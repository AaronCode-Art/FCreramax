import { useMemo } from 'react'
import { useStore } from '../../context/StoreContext'

export function useInicioPage() {
  const { categories, products, catalogLoading, catalogError, refreshCatalog } = useStore()
  const discountedProducts = useMemo(
    () => products
      .filter((product) => (product.discountPercent ?? 0) > 0)
      .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
      .slice(0, 4),
    [products],
  )

  return { categories, discountedProducts, catalogLoading, catalogError, refreshCatalog }
}
