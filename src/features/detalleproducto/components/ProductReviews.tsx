import { Star } from 'lucide-react'
import type { ProductReview, ProductReviewsSummary } from '../../../types/store'

interface ProductReviewsProps {
  summary: ProductReviewsSummary | null
  reviews: ProductReview[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  onRetry: () => void
  onLoadMore: () => void
}

const distribution = [
  { label: '5 estrellas', key: 'cincoEstrellas' },
  { label: '4 estrellas', key: 'cuatroEstrellas' },
  { label: '3 estrellas', key: 'tresEstrellas' },
  { label: '2 estrellas', key: 'dosEstrellas' },
  { label: '1 estrella', key: 'unaEstrella' },
] as const

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={15} fill={index < rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

export function ProductReviews({
  summary,
  reviews,
  loading,
  loadingMore,
  error,
  hasMore,
  onRetry,
  onLoadMore,
}: ProductReviewsProps) {
  const reviewCount = summary?.cantidadResenas ?? 0

  return (
    <section className="mt-14 border-t border-stone-200 pt-10" aria-labelledby="product-reviews-title">
      <p className="eyebrow">Opiniones de clientes</p>
      <h2 id="product-reviews-title" className="mt-2 font-display text-3xl text-ink">Reseñas</h2>

      {summary && reviewCount > 0 && (
        <div className="mt-6 grid gap-6 rounded bg-white p-6 sm:grid-cols-[180px_1fr]">
          <div>
            <p className="font-display text-5xl text-ink">{Number(summary.calificacionPromedio ?? 0).toFixed(1)}</p>
            <RatingStars rating={Math.round(Number(summary.calificacionPromedio ?? 0))} />
            <p className="mt-1 text-sm text-stone-500">{reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}</p>
          </div>
          <div className="space-y-2">
            {distribution.map(({ label, key }) => {
              const count = summary[key] ?? 0
              const percentage = reviewCount ? (count / reviewCount) * 100 : 0
              return (
                <div key={key} className="grid grid-cols-[82px_1fr_30px] items-center gap-3 text-xs text-stone-500">
                  <span>{label}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{error}</p>
          <button type="button" className="mt-2 font-semibold underline" onClick={onRetry}>Reintentar</button>
        </div>
      )}
      {loading ? <p className="mt-6 text-sm text-stone-500">Cargando reseñas…</p> : reviews.length === 0 && !error ? (
        <p className="mt-6 rounded bg-white p-6 text-sm text-stone-500">Este producto todavía no tiene reseñas.</p>
      ) : (
        <div className="mt-6 divide-y divide-stone-200">
          {reviews.map((review) => (
            <article key={review.id} className="py-6 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{review.clienteNombre}</p>
                <time className="text-xs text-stone-400" dateTime={review.creadoEn}>
                  {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(review.creadoEn))}
                </time>
              </div>
              <div className="mt-2"><RatingStars rating={review.calificacion} /></div>
              {review.comentario && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600">{review.comentario}</p>}
              {review.imagenes?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {review.imagenes.map((image) => (
                    <a key={image.id} href={image.url} target="_blank" rel="noreferrer" aria-label="Abrir imagen adjunta de la reseña">
                      <img src={image.url} alt={`Imagen adjunta por ${review.clienteNombre}`} loading="lazy" className="h-20 w-20 rounded object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
          {hasMore && (
            <button type="button" onClick={onLoadMore} disabled={loadingMore} className="secondary-button mt-5 disabled:opacity-60">
              {loadingMore ? 'Cargando…' : 'Ver más reseñas'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
