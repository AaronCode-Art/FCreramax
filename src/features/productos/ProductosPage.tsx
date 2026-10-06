import { useEffect, useMemo, useState } from 'react'
import { ProductCatalogSection } from '../catalog/ProductCatalogSection'
import { StorePageLayout } from '../../components/layout/StorePageLayout'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'
import type { Product } from '../../types/store'
import { ProductFilters, type ProductFilterValues } from './ProductFilters'

export function ProductosPage() {
  const store = useStorefrontContext()
  const openDetail = (product: Product) => store.navigate(`/detalleproducto/${encodeURIComponent(product.id)}`)
  const [filters, setFilters] = useState<ProductFilterValues>({
    category: store.activeCategory,
    minimumPrice: '',
    maximumPrice: '',
    inStockOnly: false,
    sortOrder: 'relevance',
  })

  useEffect(() => {
    setFilters((current) => current.category === store.activeCategory
      ? current
      : { ...current, category: store.activeCategory })
  }, [store.activeCategory])

  const prices = store.allProducts.map((product) => Number(product.precioFinal ?? product.precio)).filter(Number.isFinite)
  const minimumAvailablePrice = prices.length ? Math.min(...prices) : 0
  const maximumAvailablePrice = prices.length ? Math.max(...prices) : 0

  const filteredProducts = useMemo(() => {
    const minimum = filters.minimumPrice === '' ? Number.NEGATIVE_INFINITY : Number(filters.minimumPrice)
    const maximum = filters.maximumPrice === '' ? Number.POSITIVE_INFINITY : Number(filters.maximumPrice)
    const normalizedSearch = store.search.trim().toLocaleLowerCase('es')
    const products = store.allProducts.filter((product) => {
      const price = Number(product.precioFinal ?? product.precio)
      return (filters.category === 'Todo' || product.categoria === filters.category)
        && price >= minimum
        && price <= maximum
        && (!filters.inStockOnly || Number(product.stockDisponible) > 0)
        && (!normalizedSearch || `${product.nombre} ${product.categoria} ${product.descripcion ?? ''}`
          .toLocaleLowerCase('es')
          .includes(normalizedSearch))
    })

    if (filters.sortOrder === 'price-asc') products.sort((first, second) => Number(first.precioFinal ?? first.precio) - Number(second.precioFinal ?? second.precio))
    if (filters.sortOrder === 'price-desc') products.sort((first, second) => Number(second.precioFinal ?? second.precio) - Number(first.precioFinal ?? first.precio))
    if (filters.sortOrder === 'name-asc') products.sort((first, second) => first.nombre.localeCompare(second.nombre, 'es'))
    return products
  }, [filters, store.allProducts, store.search])

  const clearFilters = () => {
    setFilters({
      category: 'Todo',
      minimumPrice: '',
      maximumPrice: '',
      inStockOnly: false,
      sortOrder: 'relevance',
    })
    store.setActiveCategory('Todo')
    store.clearCatalogFilters()
  }

  return (
    <StorePageLayout>
      <header className="mx-auto w-[92%] pt-8 lg:pt-10">
        <div className="relative isolate flex min-h-[250px] items-center overflow-hidden rounded-lg bg-[#24241f] px-6 py-10 text-white sm:min-h-[290px] sm:px-10 lg:min-h-[320px] lg:px-14">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85"
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#171814]/90 via-[#171814]/65 to-[#171814]/15" />
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Cerámax · Colección</p>
            <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Productos para crear espacios únicos
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/80 sm:text-base">
              Encuentra cerámicos y acabados que llevan tu proyecto a otro nivel.
            </p>
            <a
              href="#coleccion"
              className="mt-6 inline-flex items-center border-b border-white/70 pb-1 text-xs font-bold uppercase tracking-wider text-white transition hover:border-white"
            >
              Explorar productos
            </a>
          </div>
        </div>
      </header>
      <div className="mx-auto mt-8 grid w-[92%] max-w-none gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="h-fit rounded border border-stone-200 bg-white p-5 lg:sticky lg:top-28">
          <h2 className="mb-5 font-display text-xl text-ink">Filtros</h2>
          <ProductFilters
            categories={store.categories}
            values={filters}
            minimumAvailablePrice={minimumAvailablePrice}
            maximumAvailablePrice={maximumAvailablePrice}
            onChange={(next) => {
              setFilters(next)
              store.setActiveCategory(next.category)
            }}
            onClear={clearFilters}
          />
        </aside>
        <ProductCatalogSection
          categories={store.categories}
          activeCategory={filters.category}
          products={filteredProducts}
          loading={store.loadingCatalog}
          error={store.catalogError}
          wishlistIds={store.wishlistIds}
          onRetry={store.retryCatalog}
          onCategoryChange={(category) => {
            setFilters((current) => ({ ...current, category }))
            store.setActiveCategory(category)
          }}
          onAddToCart={store.addToCart}
          onToggleWishlist={store.toggleWishlist}
          onClearFilters={clearFilters}
          onOpenDetail={openDetail}
          showHeader={false}
          showCategories={false}
          className="mx-0 w-full py-0"
          gridClassName="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4"
        />
      </div>
    </StorePageLayout>
  )
}
