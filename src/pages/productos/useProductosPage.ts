import { useParams } from 'react-router-dom'
import { useCatalogoFilters } from '../catalogo/useCatalogoFilters'
import { useStore } from '../../context/StoreContext'

export function useProductosPage() {
  const { slug } = useParams()
  const { categories, products, catalogLoading, catalogError, catalogWarning, refreshCatalog } = useStore()
  const category = categories.find((item) => item.slug === slug)
  const filters = useCatalogoFilters(products.filter((product) => !category || product.category === category.name))

  return { category, categories, catalogError, catalogLoading, catalogWarning, refreshCatalog, ...filters }
}
