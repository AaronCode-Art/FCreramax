import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { StorePageLayout } from '../../components/layout/StorePageLayout'
import { formatPrice } from '../../lib/format'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'
import { ProductRecommendations } from '../storefront/components/ProductRecommendations'
import { ProductReviews } from './components/ProductReviews'
import { useProductDetail } from './hooks/useProductDetail'
import { useProductReviews } from './hooks/useProductReviews'

interface DetalleProductoPageProps {
  productId: string
}

function readableLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (first) => first.toUpperCase())
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function SpecificationRows({ specifications }: { specifications: Array<Record<string, unknown>> }) {
  const rows = specifications.flatMap((specification, index) => {
    const label = specification.nombre ?? specification.atributo ?? specification.caracteristica ?? specification.key
    const value = specification.valor ?? specification.value ?? specification.descripcion ?? specification.detail
    if (label !== undefined && value !== undefined) {
      return [{ key: `${index}-${String(label)}`, label: displayValue(label), value: displayValue(value) }]
    }
    return Object.entries(specification)
      .filter(([key, fieldValue]) => !['id', 'orden'].includes(key.toLowerCase()) && displayValue(fieldValue))
      .map(([key, fieldValue]) => ({
        key: `${index}-${key}`,
        label: readableLabel(key),
        value: displayValue(fieldValue),
      }))
  })

  if (rows.length === 0) {
    return <p className="mt-4 rounded bg-white p-5 text-sm text-stone-500">No hay especificaciones adicionales para este producto.</p>
  }

  return (
    <dl className="mt-4 divide-y divide-stone-200 rounded bg-white px-5">
      {rows.map((row) => (
        <div key={row.key} className="grid gap-1 py-4 sm:grid-cols-[minmax(140px,0.7fr)_1fr] sm:gap-6">
          <dt className="text-sm font-medium text-stone-500">{row.label}</dt>
          <dd className="text-sm text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function DetalleProductoPage({ productId }: DetalleProductoPageProps) {
  const store = useStorefrontContext()
  const { product, images, loading, error, galleryError, galleryLoading } = useProductDetail(productId)
  const reviews = useProductReviews(productId)
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({})
  const recommendedProducts = useMemo(
    () => store.allProducts.filter((item) => item.id !== productId),
    [productId, store.allProducts],
  )

  const selectedImageId = selectedImages[productId]
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0]

  return (
    <StorePageLayout>
      <main className="mx-auto w-[92%] py-10 lg:py-14">
        <button type="button" onClick={() => store.navigate('/productos')} className="mb-7 inline-flex items-center gap-2 text-sm text-stone-500 hover:text-terracotta">
          <ArrowLeft size={16} /> Volver a productos
        </button>

        {loading ? <p role="status" className="text-stone-500">Cargando producto…</p> : error || !product ? (
          <div role="alert" className="rounded bg-white p-10 text-center">
            <h1 className="font-display text-3xl text-ink">{error ? 'No se pudo cargar el producto.' : 'No encontramos ese producto.'}</h1>
            {error && <p className="mt-3 text-sm text-stone-500">{error}</p>}
            <button type="button" onClick={() => store.navigate('/productos')} className="secondary-button mt-5">Ver productos</button>
          </div>
        ) : (
          <>
            <section className="grid gap-8 rounded bg-white p-5 sm:grid-cols-2 sm:gap-12 sm:p-8 lg:p-10">
              <div>
                <div className="aspect-square overflow-hidden rounded bg-stone-100">
                  {selectedImage ? (
                    <img src={selectedImage.url} alt={product.nombre} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center p-6 text-center text-sm text-stone-500" role={galleryError ? 'alert' : 'status'}>
                      {galleryLoading ? 'Cargando imágenes…' : galleryError ? 'No se pudieron cargar las imágenes del producto.' : 'Este producto no tiene imágenes.'}
                    </div>
                  )}
                </div>
                {galleryError && <p role="alert" className="mt-2 text-sm text-red-700">No se pudo cargar la galería: {galleryError}</p>}
                {images.length > 1 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Imágenes del producto">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setSelectedImages((selected) => ({ ...selected, [productId]: image.id }))}
                        aria-label={`Ver imagen ${index + 1} de ${product.nombre}`}
                        aria-pressed={(selectedImage?.id ?? images[0]?.id) === image.id}
                        className={`h-20 w-20 shrink-0 overflow-hidden rounded border-2 ${selectedImage?.id === image.id ? 'border-terracotta' : 'border-transparent'}`}
                      >
                        <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <p className="eyebrow">{product.categoria}</p>
                <h1 className="mt-3 font-display text-4xl text-ink">{product.nombre}</h1>
                <p className="mt-2 text-sm text-stone-400">Código: {product.codigo}</p>
                <p className="mt-5 text-2xl font-semibold text-ink">
                  {formatPrice(Number(product.precioFinal ?? product.precio))}
                </p>
                {Number(product.precio) > Number(product.precioFinal) && (
                  <p className="mt-1 text-sm text-stone-400 line-through">{formatPrice(Number(product.precio))}</p>
                )}
                {product.descripcion && (
                  <p className="mt-6 whitespace-pre-line leading-7 text-stone-600">{product.descripcion}</p>
                )}
                <p className="mt-5 text-sm text-stone-500">
                  {Number(product.stockDisponible) > 0 ? `${product.stockDisponible} disponibles` : 'Agotado temporalmente'}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void store.addToCart(product)}
                    disabled={Number(product.stockDisponible) <= 0}
                    className="primary-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag size={16} /> Agregar al carrito
                  </button>
                  <button type="button" onClick={() => void store.toggleWishlist(product)} className="secondary-button inline-flex items-center gap-2">
                    <Heart size={16} /> {store.wishlistIds.includes(product.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-12" aria-labelledby="product-specifications-title">
              <p className="eyebrow">Detalles del producto</p>
              <h2 id="product-specifications-title" className="mt-2 font-display text-3xl text-ink">Especificaciones</h2>
              <SpecificationRows specifications={product.especificaciones ?? []} />
            </section>

            <ProductReviews
              summary={reviews.summary}
              reviews={reviews.reviews}
              loading={reviews.loading}
              loadingMore={reviews.loadingMore}
              error={reviews.error}
              hasMore={reviews.hasMore}
              onRetry={() => { void reviews.refresh() }}
              onLoadMore={() => { void reviews.loadMore() }}
            />
          </>
        )}

        {!loading && !error && product && (
          <div className="mt-14">
            <ProductRecommendations
              products={recommendedProducts}
              orders={[]}
              wishlistIds={store.wishlistIds}
              onAddToCart={(recommended) => { void store.addToCart(recommended) }}
              onToggleWishlist={(recommended) => { void store.toggleWishlist(recommended) }}
              onOpenProductDetail={(recommended) => store.navigate(`/detalleproducto/${encodeURIComponent(recommended.id)}`)}
            />
          </div>
        )}
      </main>
    </StorePageLayout>
  )
}
