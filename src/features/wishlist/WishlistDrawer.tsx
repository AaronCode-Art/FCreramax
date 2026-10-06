import { Heart, Plus, X } from 'lucide-react'
import overlayStyles from '../../components/ui/Overlay.module.css'
import { formatPrice } from '../../lib/format'
import type { Product } from '../../types/store'
import { ProductImage } from '../catalog/ProductImage'

interface WishlistDrawerProps {
  products: Product[]
  onClose: () => void
  onRemove: (product: Product) => void
  onAddToCart: (product: Product) => void
}

export function WishlistDrawer({ products, onClose, onRemove, onAddToCart }: WishlistDrawerProps) {
  return (
    <div className={overlayStyles.drawerBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className={overlayStyles.drawerPanel} role="dialog" aria-modal="true" aria-labelledby="wishlist-title">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-5 sm:px-7">
          <div>
            <p className="eyebrow">Tus favoritos</p>
            <h2 id="wishlist-title" className="mt-1 font-display text-2xl text-ink">Lista de deseos <span className="text-stone-400">({products.length})</span></h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Cerrar favoritos"><X size={20} /></button>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-stone-100 text-stone-500"><Heart size={25} /></span>
            <h3 className="mt-5 font-display text-2xl text-ink">Aún no guardas favoritos</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-stone-500">Toca el corazón de un producto para guardarlo aquí.</p>
            <button onClick={onClose} className="secondary-button mt-6">Seguir explorando</button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-2 sm:px-7">
            {products.map((product) => (
              <article key={product.id} className="flex gap-4 border-b border-stone-100 py-5">
                <ProductImage
                  productId={product.id}
                  alt=""
                  className="size-24 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{product.categoria}</p>
                  <h3 className="mt-1 text-sm font-semibold leading-5 text-ink">{product.nombre}</h3>
                  <p className="mt-1 text-xs text-stone-500">{formatPrice(Number(product.precioFinal ?? product.precio))}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button type="button" onClick={() => onAddToCart(product)} className="inline-flex items-center gap-2 text-xs font-semibold text-ink hover:text-terracotta">
                      <Plus size={14} /> Agregar al carrito
                    </button>
                    <button type="button" onClick={() => onRemove(product)} className="text-xs text-stone-400 hover:text-terracotta">
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}
