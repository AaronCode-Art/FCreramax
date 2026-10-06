import { ArrowRight, Check, ShoppingBag, X } from 'lucide-react'
import type { Product } from '../../types/store'
import styles from './AddedToCartDialog.module.css'

interface AddedToCartDialogProps {
  product: Product
  onContinueShopping: () => void
  onGoToCheckout: () => void
  onClose: () => void
}

export function AddedToCartDialog({
  product,
  onContinueShopping,
  onGoToCheckout,
  onClose,
}: AddedToCartDialogProps) {
  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="added-to-cart-title"
        aria-describedby="added-to-cart-description"
      >
        <button type="button" className={styles.close} onClick={onContinueShopping} aria-label="Seguir comprando">
          <X size={19} />
        </button>
        <span className={styles.icon}><Check size={22} /></span>
        <p className="eyebrow">Carrito actualizado</p>
        <h2 id="added-to-cart-title">Agregado al carrito</h2>
        <p id="added-to-cart-description" className={styles.productName}>{product.nombre}</p>
        <p className={styles.prompt}>¿Qué deseas hacer ahora?</p>
        <div className={styles.actions}>
          <button type="button" className="primary-button" onClick={onGoToCheckout}>
            Ir a pagar <ArrowRight size={16} />
          </button>
          <button type="button" className="secondary-button" onClick={onContinueShopping}>
            <ShoppingBag size={15} /> Seguir comprando
          </button>
        </div>
      </section>
    </div>
  )
}
