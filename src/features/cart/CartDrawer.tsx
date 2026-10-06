import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import overlayStyles from '../../components/ui/Overlay.module.css'
import { formatPrice } from '../../lib/format'
import type { CartItem } from '../../types/store'
import { ProductImage } from '../catalog/ProductImage'

interface CartDrawerProps {
  items: CartItem[]
  onClose: () => void
  onChangeQuantity: (productId: string, amount: number) => void
  onRemove: (productId: string) => void
  onCheckout: () => void
}

export function CartDrawer({ items, onClose, onChangeQuantity, onRemove, onCheckout }: CartDrawerProps) {
  const subtotal = items.reduce(
    (total, item) => total + Number(item.product.precioFinal ?? item.product.precio) * item.quantity,
    0,
  )

  return (
    <div className={overlayStyles.drawerBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className={overlayStyles.drawerPanel} role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-5 sm:px-7">
          <div>
            <p className="eyebrow">Tu selección</p>
            <h2 id="cart-title" className="mt-1 font-display text-2xl text-ink">Mi carrito <span className="text-stone-400">({items.length})</span></h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Cerrar carrito"><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-stone-100 text-stone-500"><ShoppingBag size={25} /></span>
            <h3 className="mt-5 font-display text-2xl text-ink">Tu carrito está esperando</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-stone-500">Explora nuestra colección y encuentra el acabado que imaginas.</p>
            <button onClick={onClose} className="secondary-button mt-6">Seguir explorando</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-2 sm:px-7">
              {items.map(({ product, quantity }) => (
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
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-stone-200">
                        <button type="button" onClick={() => onChangeQuantity(product.id, -1)} className="grid size-8 place-items-center text-stone-500 hover:text-ink" aria-label="Reducir cantidad"><Minus size={13} /></button>
                        <span className="w-7 text-center text-xs font-semibold">{quantity}</span>
                        <button type="button" onClick={() => onChangeQuantity(product.id, 1)} className="grid size-8 place-items-center text-stone-500 hover:text-ink" aria-label="Aumentar cantidad"><Plus size={13} /></button>
                      </div>
                      <button type="button" onClick={() => onRemove(product.id)} className="text-stone-400 transition hover:text-red-600" aria-label={`Eliminar ${product.nombre}`}><Trash2 size={15} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="border-t border-stone-200 px-5 py-5 sm:px-7">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal referencial</span>
                <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-stone-500">Impuestos y envío se calculan al confirmar tu pedido.</p>
              <button onClick={onCheckout} className="primary-button mt-5 w-full">
                Continuar al checkout <span aria-hidden>→</span>
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
