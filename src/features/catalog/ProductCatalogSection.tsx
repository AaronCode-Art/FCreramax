import { ProductSkeleton } from '../../components/ui/ProductSkeleton'
import { ProductCard } from './ProductCard'
import type { Product } from '../../types/store'

interface ProductCatalogSectionProps {
  categories: string[]
  activeCategory: string
  products: Product[]
  loading: boolean
  error: string
  wishlistIds: string[]
  onRetry: () => void
  onCategoryChange: (category: string) => void
  onAddToCart: (product: Product) => void
  onToggleWishlist: (product: Product) => void
  onClearFilters: () => void
  onOpenDetail: (product: Product) => void
  showHeader?: boolean
  showCategories?: boolean
  className?: string
  gridClassName?: string
}

export function ProductCatalogSection({
  categories,
  activeCategory,
  products,
  loading,
  error,
  wishlistIds,
  onRetry,
  onCategoryChange,
  onAddToCart,
  onToggleWishlist,
  onClearFilters,
  onOpenDetail,
  showHeader = true,
  showCategories = true,
  className,
  gridClassName,
}: ProductCatalogSectionProps) {
  return (
    <section id="coleccion" className={`mx-auto w-[92%] max-w-none scroll-mt-24 py-16 lg:py-20 ${className ?? ''}`}>
      {showHeader && (
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">Productos disponibles</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-stone-500">Productos e información obtenidos del catálogo.</p>
          </div>
        </div>
      )}

      {showCategories && (
        <div id="categorias" className="mt-8 flex scroll-mt-24 gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                activeCategory === category
                  ? 'border-ink bg-ink text-white'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
              }`}
            >
              {category}
            </button>
          ))}
          <span className="ml-auto hidden self-center text-xs text-stone-400 sm:block">
            {products.length} productos
          </span>
        </div>
      )}
      {!showCategories && (
        <p className="mb-4 text-xs text-stone-500" aria-live="polite">
          {products.length} productos
        </p>
      )}

      {loading ? (
        <div className={gridClassName ?? 'mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4'}>
          {Array.from({ length: 4 }, (_, index) => <ProductSkeleton key={index} />)}
        </div>
      ) : error ? (
        <div className="mt-8 rounded bg-white px-5 py-16 text-center" role="alert">
          <p className="font-display text-2xl text-ink">No pudimos cargar el catálogo.</p>
          <p className="mt-2 text-sm text-stone-500">{error}</p>
          <button type="button" onClick={onRetry} className="secondary-button mt-5">Reintentar conexión</button>
        </div>
      ) : products.length > 0 ? (
        <div className={gridClassName ?? 'mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-7'}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onAdd={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded bg-white px-5 py-16 text-center">
          <p className="font-display text-2xl text-ink">No hay productos para mostrar.</p>
          <p className="mt-2 text-sm text-stone-500">El catálogo no contiene productos con los filtros actuales.</p>
          <button type="button" onClick={onClearFilters} className="secondary-button mt-5">Limpiar filtros</button>
        </div>
      )}
    </section>
  )
}
