import { useMemo } from 'react'
import { useStore } from '../../context/StoreContext'

export function useInicioPage() {
  const { categories, products, catalogLoading, catalogError, refreshCatalog } = useStore()
  const discountedProducts = useMemo(
    () => products
      .filter((product) => (product.discountPercent ?? 0) > 0)
      .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
      .slice(0, 10),
    [products],
  )
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const product of products) counts[product.category] = (counts[product.category] ?? 0) + 1
    return counts
  }, [products])
  const shelfProducts = useMemo(() => {
    const offerIds = new Set(discountedProducts.map((product) => product.id))
    return products.filter((product) => !offerIds.has(product.id) && product.stock > 0).slice(0, 8)
  }, [products, discountedProducts])
  const topDiscount = discountedProducts.reduce((max, product) => Math.max(max, Math.round(product.discountPercent ?? 0)), 0)

  return { categories, categoryCounts, discountedProducts, shelfProducts, topDiscount, catalogLoading, catalogError, refreshCatalog }
}
