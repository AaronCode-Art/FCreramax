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
    const availableProducts = products.filter((product) => (product.discountPercent ?? 0) <= 0 && product.stock > 0)
    for (let index = availableProducts.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      const currentProduct = availableProducts[index]
      availableProducts[index] = availableProducts[randomIndex]
      availableProducts[randomIndex] = currentProduct
    }
    return availableProducts.slice(0, 12)
  }, [products])
  const topDiscount = discountedProducts.reduce((max, product) => Math.max(max, Math.round(product.discountPercent ?? 0)), 0)

  return { categories, categoryCounts, discountedProducts, shelfProducts, topDiscount, catalogLoading, catalogError, refreshCatalog }
}
