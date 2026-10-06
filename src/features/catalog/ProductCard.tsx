import { Heart, ShoppingBag } from 'lucide-react'
import { formatPrice } from '../../lib/format'
import type { Product } from '../../types/store'
import { ProductImage } from './ProductImage'

interface ProductCardProps {
  product: Product
  isWishlisted: boolean
  onAdd: (product: Product) => void
  onToggleWishlist: (product: Product) => void
  onOpenDetail?: (product: Product) => void
}

export function ProductCard({ product, isWishlisted, onAdd, onToggleWishlist, onOpenDetail }: ProductCardProps) {
  const price = Number(product.precioFinal ?? product.precio)
  const oldPrice = Number(product.precio)
  const unavailable = Number(product.stockDisponible ?? 0) <= 0

  return (
    <article className="product-card group flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-[5px] bg-stone-100">
        <button type="button" onClick={() => onOpenDetail?.(product)} className="h-full w-full text-left" aria-label={`Ver detalle de ${product.nombre}`}>
          <ProductImage
            productId={product.id}
            alt={product.nombre}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
          />
        </button>
        {Number(product.descuentoPorcentaje) > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-terracotta shadow-sm">
            -{Math.round(Number(product.descuentoPorcentaje))}%
          </span>
        )}
        <button
          type="button"
          onClick={() => onToggleWishlist(product)}
          aria-label={`Guardar ${product.nombre} en favoritos`}
          aria-pressed={isWishlisted}
          className={`absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm transition sm:opacity-0 group-hover:opacity-100 focus:opacity-100 ${isWishlisted ? 'text-terracotta sm:opacity-100' : 'text-ink'}`}
        >
          <Heart size={16} strokeWidth={1.7} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="flex flex-1 flex-col pt-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">{product.categoria}</p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-h-10 text-[14px] font-semibold leading-5 text-ink">
            <button type="button" onClick={() => onOpenDetail?.(product)} className="text-left hover:text-terracotta">{product.nombre}</button>
          </h3>
        </div>
        <p className="mt-1 line-clamp-2 min-h-8 text-xs text-stone-500">{product.descripcion || '\u00a0'}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-sm font-bold text-ink">{formatPrice(price)}</span>
          {oldPrice > price && <span className="text-xs text-stone-400 line-through">{formatPrice(oldPrice)}</span>}
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={unavailable}
          className="secondary-button mt-3 inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Agregar ${product.nombre} al carrito`}
        >
          <ShoppingBag size={15} /> Agregar al carrito
        </button>
      </div>
    </article>
  )
}
