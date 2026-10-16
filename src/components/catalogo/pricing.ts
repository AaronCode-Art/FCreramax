import type { StoreProduct } from '../../context/StoreContext'

export function productDeal(product: StoreProduct) {
  const original = product.originalPrice
  const active = (product.discountPercent ?? 0) > 0 && original !== undefined && original > product.price
  return {
    active,
    percent: active ? Math.max(1, Math.round(product.discountPercent ?? 0)) : 0,
    savings: active && original !== undefined ? original - product.price : 0,
  }
}
