import {getCalculatedPrice} from './get-calculated-price'
import {Context, defaultContext, getSdk} from '@skillrecordings/database'
import type {Purchase, Product} from '@skillrecordings/database'
import {FormattedPrice} from './@types'
import isEmpty from 'lodash/isEmpty'
import {determineCouponToApply} from './determine-coupon-to-apply'

// 10% premium for an upgrade
// TODO: Display Coupon Errors
// TODO: Display Applied Site Coupon w/ Expiration
// departure from the three tiers we've used in the past and the third tier
// is for teams

export class PriceFormattingError extends Error {
  options: FormatPricesForProductOptions

  constructor(message: string, options: FormatPricesForProductOptions) {
    super(message)
    this.name = 'PriceFormattingError'
    this.options = options
  }
}

type FormatPricesForProductOptions = {
  productId: string
  country?: string
  quantity?: number
  merchantCouponId?: string
  ctx?: Context
  upgradeFromPurchaseId?: string
  userId?: string
}

export async function getFixedDiscountForUpgrade({
  purchaseToBeUpgraded,
  productToBePurchased,
  purchaseWillBeRestricted,
  ctx = defaultContext,
}: {
  purchaseToBeUpgraded: Purchase | null
  productToBePurchased: Product
  purchaseWillBeRestricted: boolean
  ctx?: Context
}) {
  // if there is no purchase to be upgraded, then this isn't an upgrade
  // and the Fixed Discount should be 0.
  if (
    purchaseToBeUpgraded === null ||
    purchaseToBeUpgraded?.productId === undefined
  ) {
    return 0
  }

  const transitioningToUnrestrictedAccess =
    purchaseToBeUpgraded.status === 'Restricted' && !purchaseWillBeRestricted

  // if the Purchase To Be Upgraded is `restricted` and it has a matching
  // `productId` with the Product To Be Purchased, then this is a PPP
  // upgrade, so use the purchase amount.
  if (transitioningToUnrestrictedAccess) {
    return purchaseToBeUpgraded.totalAmount.toNumber()
  }

  // if Purchase To Be Upgraded is upgradeable to the Product To Be Purchased,
  // then look up the Price of the original product
  const {getPrice, availableUpgradesForProduct} = getSdk({ctx})
  const upgradeIsAvailable = !isEmpty(
    await availableUpgradesForProduct(
      [purchaseToBeUpgraded],
      productToBePurchased.id,
    ),
  )
  if (upgradeIsAvailable) {
    const price = await getPrice({
      where: {
        productId: purchaseToBeUpgraded.productId,
      },
    })

    return price?.unitAmount.toNumber() || 0
  }

  return 0
}

/**
 * Creates a verified price for a given product based on the unit price
 * of the product, coupons, and other factors.
 *
 * 30 minute loom walkthrough of this function:
 * https://www.loom.com/share/8cbd2213d44145dea51590b380f5d0d7?sid=bec3caeb-b742-4425-ae6e-81ca98c88f91
 *
 * @param {FormatPricesForProductOptions} options the Prisma context
 */
export async function formatPricesForProduct(
  options: FormatPricesForProductOptions,
): Promise<FormattedPrice> {
  const {ctx = defaultContext, ...noContextOptions} = options
  const {
    productId,
    country = 'US',
    quantity = 1,
    merchantCouponId,
    upgradeFromPurchaseId,
    userId,
  } = noContextOptions

  const {getProduct, getPrice, getPurchase} = getSdk({ctx})

  const upgradeFromPurchase = upgradeFromPurchaseId
    ? await getPurchase({
        where: {
          id: upgradeFromPurchaseId,
        },
        select: {
          id: true,
          bulkCoupon: {
            select: {
              id: true,
            },
          },
          redeemedBulkCouponId: true,
          totalAmount: true,
          productId: true,
          status: true,
        },
      })
    : null

  const upgradedProduct = upgradeFromPurchase
    ? await getProduct({
        where: {
          id: upgradeFromPurchase.productId,
        },
        select: {
          id: true,
          prices: true,
        },
      })
    : null

  const product = await getProduct({
    where: {id: productId},
    include: {
      prices: true,
    },
  })

  if (!product) {
    throw new PriceFormattingError(`no-product-found`, noContextOptions)
  }

  const price = await getPrice({where: {productId}})

  if (!price) throw new PriceFormattingError(`no-price-found`, noContextOptions)

  // TODO: give this function a better name like, `determineCouponDetails`
  const {appliedMerchantCoupon, appliedCouponType, ...result} =
    await determineCouponToApply({
      prismaCtx: ctx,
      merchantCouponId,
      country,
      quantity,
      userId,
      productId: product.id,
      purchaseToBeUpgraded: upgradeFromPurchase,
    })

  const fixedDiscountForUpgrade = await getFixedDiscountForUpgrade({
    purchaseToBeUpgraded: upgradeFromPurchase,
    productToBePurchased: product,
    purchaseWillBeRestricted: appliedCouponType === 'ppp',
    ctx,
  })

  const unitPrice: number = price.unitAmount.toNumber()
  const fullPrice: number = unitPrice * quantity - fixedDiscountForUpgrade

  const percentOfDiscount = appliedMerchantCoupon?.percentageDiscount.toNumber()

  const upgradeDetails =
    upgradeFromPurchase !== null && appliedCouponType !== 'bulk' // we don't handle bulk with upgrades (yet), so be explicit here
      ? {
          upgradeFromPurchaseId,
          upgradeFromPurchase,
          upgradedProduct,
        }
      : {}

  return {
    ...product,
    quantity,
    unitPrice,
    fullPrice,
    calculatedPrice: getCalculatedPrice({
      unitPrice,
      percentOfDiscount,
      fixedDiscount: fixedDiscountForUpgrade, // if not upgrade, we know this will be 0
      quantity, // if PPP is applied, we know this will be 1
    }),
    availableCoupons: result.availableCoupons,
    appliedMerchantCoupon,
    bulk: result.bulk,
    ...upgradeDetails,
  }
}
