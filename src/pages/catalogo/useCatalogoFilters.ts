import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { StoreProduct } from '../../context/StoreContext'

type CatalogSort = 'recommended' | 'discount-desc' | 'price-asc' | 'price-desc' | 'name'

export function useCatalogoFilters(products: StoreProduct[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sort, setSort] = useState<CatalogSort>('recommended')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [inStockOnly, setInStockOnly] = useState(false)
  const search = searchParams.get('search') ?? ''
  const maximum = Math.ceil(Math.max(0, ...products.map((product) => product.price)) / 50) * 50
  const activeMaxPrice = maxPrice ?? maximum
  function updateSort(value: string) {
    if (value === 'recommended' || value === 'discount-desc' || value === 'price-asc' || value === 'price-desc' || value === 'name') {
      setSort(value)
    }
  }
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    const result = products.filter((product) => {
      const matchesText = !term || `${product.name} ${product.category} ${product.collection} ${product.description}`.toLocaleLowerCase('es').includes(term)
      return matchesText && product.price <= activeMaxPrice && (!inStockOnly || product.stock > 0)
    })
    result.sort((a, b) => {
      if (sort === 'discount-desc') {
        const discountOrder = (b.discountPercent ?? 0) - (a.discountPercent ?? 0)
        if (discountOrder !== 0) return discountOrder
        return a.price - b.price
      }
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name, 'es')
      const availabilityOrder = Number(b.stock > 0) - Number(a.stock > 0)
      if (availabilityOrder !== 0) return availabilityOrder
      return 0
    })
    return result
  }, [products, search, activeMaxPrice, inStockOnly, sort])

  function clearFilters() {
    setSearchParams({})
    setMaxPrice(null)
    setSort('recommended')
    setInStockOnly(false)
  }

  return {
    activeMaxPrice,
    clearFilters,
    filtered,
    inStockOnly,
    maximum,
    search,
    setInStockOnly,
    setMaxPrice,
    setSearchParams,
    setSort: updateSort,
    sort,
  }
}
