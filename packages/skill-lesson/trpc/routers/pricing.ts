import {z} from 'zod'
import {getSdk} from '@skillrecordings/database'
import {
  formatPricesForProduct,
  getActiveMerchantCoupon,
  getValidPurchases,
  propsForCommerce,
} from '@skillrecordings/commerce-server'
import {find} from 'lodash'
import {publicProcedure, router} from '../trpc.server'
import {getActiveProducts} from '../../lib/products'
import {getToken} from 'next-auth/jwt'

const merchantCouponSchema = z.object({
  id: z.string(),
  type: z.string().nullable(),
})

const PricingFormattedInputSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  couponId: z.string().optional(),
  merchantCoupon: merchantCouponSchema.optional(),
  upgradeFromPurchaseId: z.string().optional(),
})

const checkForAnyAvailableUpgrades = async ({
  upgradeFromPurchaseId,
  productId,
  purchases,
  country,
}: {
  upgradeFromPurchaseId: string | undefined
  productId: string
  purchases: Array<{id: string; productId: string; status: string}>
  country: string
}) => {
  if (upgradeFromPurchaseId) return upgradeFromPurchaseId

  const {availableUpgradesForProduct} = getSdk()
  const validPurchases = getValidPurchases(purchases)

  const availableUpgrades = await availableUpgradesForProduct(
    validPurchases,
    productId,
  )

  return find(validPurchases, (purchase) => {
    const upgradeProductIds = availableUpgrades.map(
      (upgrade) => upgrade.upgradableFrom.id,
    )
    return upgradeProductIds.includes(purchase.productId)
  })?.id
}

const CheckForAvailableCouponsSchema = PricingFormattedInputSchema.pick({
  merchantCoupon: true,
  couponId: true,
  code: true,
  productId: true,
})
type CheckForAvailableCoupons = z.infer<typeof CheckForAvailableCouponsSchema>

const checkForAvailableCoupons = async ({
  merchantCoupon,
  couponId,
  productId,
}: CheckForAvailableCoupons) => {
  // explicit incoming merchant coupons are honored
  // without checking for other potential coupons
  // if there is no explicit incoming merchant coupon
  // we check for default/global coupon or an incoming code
  if (merchantCoupon?.id) {
    return {
      activeMerchantCoupon: merchantCoupon,
      defaultCoupon: undefined,
    }
  } else {
    const {activeMerchantCoupon, defaultCoupon} = await getActiveMerchantCoupon(
      {
        siteCouponId: couponId,
        productId,
        code: undefined,
      },
    )

    const minimalDefaultCoupon = defaultCoupon && {
      expires: defaultCoupon.expires?.toISOString(),
      percentageDiscount: defaultCoupon.percentageDiscount.toString(),
    }

    return {activeMerchantCoupon, defaultCoupon: minimalDefaultCoupon}
  }
}

export const pricing = router({
  propsForCommerce: publicProcedure
    .input(
      z.object({
        code: z.string().optional(),
        coupon: z.string().optional(),
        allowPurchase: z.string().optional(),
        productId: z.string().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const token = await getToken({req: ctx.req})
      const {products} = await getActiveProducts()

      const {props} = await propsForCommerce({
        query: input,
        token,
        products: input.productId ? [{productId: input.productId}] : products,
      })
      return props
    }),
  formatted: publicProcedure
    .input(PricingFormattedInputSchema)
    .query(async ({ctx, input}) => {
      const {
        productId,
        quantity,
        couponId,
        merchantCoupon,
        upgradeFromPurchaseId: _upgradeFromPurchaseId,
      } = input

      const token = await getToken({req: ctx.req})

      const verifiedUserId = token?.sub

      const {getPurchasesForUser} = getSdk()
      const purchases = getValidPurchases(
        await getPurchasesForUser(verifiedUserId),
      )

      const country =
        (ctx.req.headers['x-vercel-ip-country'] as string) ||
        process.env.DEFAULT_COUNTRY ||
        'US'

      let upgradeFromPurchaseId = await checkForAnyAvailableUpgrades({
        upgradeFromPurchaseId: _upgradeFromPurchaseId,
        productId,
        purchases,
        country,
      })

      const restrictedPurchase = purchases.find((purchase) => {
        return (
          purchase.productId === productId && purchase.status === 'Restricted'
        )
      })

      if (restrictedPurchase) {
        const validPurchase = purchases.find((purchase) => {
          return purchase.productId === productId && purchase.status === 'Valid'
        })

        if (!validPurchase) {
          upgradeFromPurchaseId = restrictedPurchase.id
        }
      }

      const {activeMerchantCoupon, defaultCoupon} =
        await checkForAvailableCoupons({
          merchantCoupon,
          couponId,
          productId,
        })

      const productPrices = await formatPricesForProduct({
        productId,
        country,
        quantity,
        merchantCouponId: activeMerchantCoupon?.id,
        ...(upgradeFromPurchaseId && {upgradeFromPurchaseId}),
        userId: verifiedUserId,
      })

      const formattedPrice = {
        ...productPrices,
        ...(defaultCoupon && {defaultCoupon}),
      }

      return formattedPrice
    }),
})
