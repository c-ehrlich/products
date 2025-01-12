import {
  Purchase,
  MerchantCoupon,
  Product,
  Price,
} from '@skillrecordings/database'
import type {PortableTextBlock} from '@portabletext/types'

type MerchantCouponWithCountry = MerchantCoupon & {country?: string | undefined}

export type MinimalMerchantCoupon = Omit<
  MerchantCouponWithCountry,
  'identifier' | 'merchantAccountId'
>

type ProductWithPrices = Product & {prices?: Price[]}

export type FormattedPrice = {
  id: string
  quantity: number
  unitPrice: number
  fullPrice: number
  calculatedPrice: number
  availableCoupons: Array<
    Omit<MerchantCouponWithCountry, 'identifier'> | undefined
  >
  appliedMerchantCoupon?: MinimalMerchantCoupon
  upgradeFromPurchaseId?: string
  upgradeFromPurchase?: Purchase
  defaultCoupon?: {
    expires?: string
    percentageDiscount: string
  }
  upgradedProduct?: ProductWithPrices | null
  bulk: boolean
}

export type CouponForCode = {
  isValid: boolean
  id: string
  isRedeemable: boolean
}

export type DefaultCoupon = {percentageDiscount: number; expires: string}

export type CommerceProps = {
  couponIdFromCoupon?: string
  couponFromCode?: CouponForCode
  userId?: string
  purchases?: Purchase[]
  products: SanityProduct[]
  defaultCoupon?: DefaultCoupon
  allowPurchase?: boolean
}

export type SanityProduct = {
  productId: string
  name: string
  title?: string
  action: string
  description?: string
  slug?: string
  image: {
    url: string
    alt: string
  }
  summary?: PortableTextBlock
  modules: SanityProductModule[]
  lessons?: {
    title: string
    state?: 'draft' | 'published'
    image: {
      url: string
      alt: string
    }
  }[]
  features: {
    value: string
  }[]
  instructor?: {
    name: string
    image: string
  }
}

export type SanityProductModule = {
  slug: string
  moduleType: 'workshop' | 'playlist' | 'bonus'
  title: string
  state?: 'draft' | 'published'
  image: {
    url: string
    alt: string
  }
  sections?: {
    _id: string
    title: string
    slug: string
    lessons?: {
      title: string
      state?: 'draft' | 'published'
      slug: string
      image: {
        url: string
        alt: string
      }
    }[]
  }[]
  lessons?: {
    title: string
    state?: 'draft' | 'published'
    slug: string
    image: {
      url: string
      alt: string
    }
  }[]
}
