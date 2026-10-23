import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useCatalogoFilters } from '../catalogo/useCatalogoFilters'
import { useStore } from '../../context/StoreContext'

export function useCategoriasPage() {
  const { slug } = useParams()
  const { categories, products, catalogLoading, catalogError, catalogWarning, refreshCatalog } = useStore()
  const selected = categories.find((category) => category.slug === slug)
  const categoryProducts = useMemo(
    () => selected ? products.filter((product) => product.category === selected.name) : [],
    [products, selected],
  )
  const filters = useCatalogoFilters(categoryProducts)

  return { categories, catalogError, catalogLoading, catalogWarning, products, refreshCatalog, selected, ...filters }
}
