import './CarritoPage.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { PageIntro } from '../../components/common/PageIntro'
import { MinusIcon, PlusIcon, TrashIcon } from '../../components/ui/Icons'
import { useCarritoPage } from './useCarritoPage'

export default function CarritoPage() {
  const { addToCart, cart, customer, notify, openAuth, removeFromCart, setCartQuantity, total, units } = useCarritoPage()
  const [removingSlug, setRemovingSlug] = useState<string | null>(null)
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)
  const pendingLine = cart.find((item) => item.product.slug === pendingSlug)

  // Se pregunta antes de quitar y, aun así, se ofrece Deshacer por si se confirma sin querer.
  async function removeLine(slug: string) {
    const line = cart.find((item) => item.product.slug === slug)
    if (!line || removingSlug) return
    setRemovingSlug(slug)
    const removed = await removeFromCart(slug)
    setRemovingSlug(null)
    setPendingSlug(null)
    if (removed) {
      notify(`Quitaste «${line.product.name}» de tu carrito.`, {
        action: { label: 'Deshacer', onClick: () => addToCart(line.product, line.quantity, { silent: true }) },
        duration: 15000,
      })
    }
  }

  return <section className="customer-page page-shell cart-page">
    <PageIntro eyebrow="Tu selección" title="Mi carrito">Revisa tus piezas. Todavía no se te cobra nada.</PageIntro>
    {!customer ? <div className="customer-empty">
      <h2>Entra a tu cuenta para ver tu carrito</h2>
      <p>Así guardamos tus piezas y las encuentras cuando vuelvas.</p>
      <button className="button button-dark" type="button" onClick={() => openAuth('login')}>Iniciar sesión</button>
    </div>
      : cart.length === 0 ? <div className="customer-empty">
        <h2>Tu carrito está vacío</h2>
        <p>Cuando agregues una pieza, la verás aquí con su precio y el total.</p>
        <Link className="button button-dark" to="/productos">Ver productos</Link>
      </div>
        : <div className="cart-layout">
          <div className="cart-items">
            <p className="cart-count-line" aria-live="polite">{units === 1 ? '1 pieza en tu carrito' : `${units} piezas en tu carrito`}</p>
            {cart.map(({ product, quantity }) => {
              const atMax = quantity >= product.stock
              const removing = removingSlug === product.slug
              return <article className="cart-item" key={product.slug} aria-busy={removing}>
                <div className="cart-item-product">
                  <Link to={`/producto/${product.slug}`} aria-label={`Ver ${product.name}`}><img className="cart-item-image" src={product.image} alt="" /></Link>
                  <div className="cart-item-copy">
                    <span>{product.category}</span>
                    <h2><Link to={`/producto/${product.slug}`}>{product.name}</Link></h2>
                    <p>S/ {product.price.toFixed(2)} cada una</p>
                  </div>
                </div>
                <div className="cart-item-qty" role="group" aria-label={`Cantidad de ${product.name}`}>
                  <span className="cart-item-qty-label">Cantidad</span>
                  <div className="cart-item-controls">
                    <button type="button" disabled={quantity <= 1} aria-label={`Una menos: ${product.name}`} onClick={() => setCartQuantity(product.slug, quantity - 1)}><MinusIcon /></button>
                    <output aria-live="polite">{quantity}</output>
                    <button type="button" disabled={atMax} aria-label={`Una más: ${product.name}`} onClick={() => setCartQuantity(product.slug, quantity + 1)}><PlusIcon /></button>
                  </div>
                  {atMax && <small className="cart-item-max">Es el máximo disponible</small>}
                </div>
                <strong className="cart-item-total"><span>Subtotal</span>S/ {(product.price * quantity).toFixed(2)}</strong>
                <button className="cart-remove" type="button" disabled={removing} onClick={() => setPendingSlug(product.slug)}>
                  <TrashIcon />{removing ? 'Quitando…' : 'Quitar del carrito'}
                </button>
              </article>
            })}
          </div>
          <aside className="cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Resumen de tu compra</h2>
            <div><span>{units === 1 ? '1 pieza' : `${units} piezas`}</span><strong>S/ {total.toFixed(2)}</strong></div>
            <p>El envío se calcula en el siguiente paso. Antes de confirmar verás el total final y podrás volver atrás.</p>
            <Link className="button button-dark cart-continue" to="/checkout">Continuar con mi compra</Link>
            <p className="cart-next-steps">Siguiente: elegir entrega, comprobante y forma de pago.</p>
            <Link className="cart-keep-shopping" to="/productos">Seguir viendo productos</Link>
          </aside>
        </div>}
    <ConfirmDialog
      open={pendingLine !== undefined}
      title={`¿Quitar «${pendingLine?.product.name ?? 'esta pieza'}» de tu carrito?`}
      description="La pieza dejará de aparecer en tu resumen. Podrás volver a agregarla desde el catálogo."
      confirmLabel="Sí, quitar"
      cancelLabel="No, conservar"
      pending={removingSlug !== null}
      onCancel={() => setPendingSlug(null)}
      onConfirm={() => { if (pendingSlug) void removeLine(pendingSlug) }}
    />
  </section>
}
