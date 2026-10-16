import './CarritoPage.css'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import { useCarritoPage } from './useCarritoPage'

export default function CarritoPage() {
  const { cart, customer, openAuth, removeFromCart, setCartQuantity, total } = useCarritoPage()

  return <section className="customer-page page-shell">
    <PageIntro eyebrow="Tu selección" title="Carrito de compras">Revisa tus piezas antes de continuar con el pedido.</PageIntro>
    {!customer ? <div className="customer-empty"><h2>Inicia sesión para ver tu carrito</h2><p>Tu carrito se guarda localmente en este navegador y está vinculado a tu cuenta.</p><button className="button button-dark" type="button" onClick={() => openAuth('login')}>Iniciar sesión</button></div>
      : cart.length === 0 ? <div className="customer-empty"><h2>Tu carrito está vacío</h2><p>Descubre piezas hechas a mano en nuestro taller.</p><Link className="button button-dark" to="/productos">Ver productos</Link></div>
        : <div className="cart-layout"><div className="cart-items">{cart.map(({ product, quantity }) => <article className="cart-item" key={product.slug}>
          <div className="cart-item-product">
            <img className="cart-item-image" src={product.image} alt={product.name} />
            <div className="cart-item-copy"><span>{product.category}</span><h2>{product.name}</h2><p>S/ {product.price.toFixed(2)} por unidad</p></div>
          </div>
          <div className="cart-item-controls"><button type="button" disabled={quantity <= 1} aria-label={`Reducir ${product.name}`} onClick={() => setCartQuantity(product.slug, quantity - 1)}>−</button><span>{quantity}</span><button type="button" disabled={quantity >= product.stock} aria-label={`Aumentar ${product.name}`} onClick={() => setCartQuantity(product.slug, quantity + 1)}>+</button></div>
          <strong>S/ {(product.price * quantity).toFixed(2)}</strong><button className="text-button" type="button" onClick={() => removeFromCart(product.slug)}>Quitar</button>
        </article>)}</div><aside className="cart-summary"><h2>Resumen</h2><div><span>Subtotal</span><strong>S/ {total.toFixed(2)}</strong></div><p>El costo de envío se confirmará según la dirección.</p><Link className="button button-dark" to="/checkout">Continuar compra</Link></aside></div>}
  </section>
}
