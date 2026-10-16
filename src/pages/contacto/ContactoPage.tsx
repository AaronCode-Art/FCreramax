import './ContactoPage.css'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import { useContactoPage } from './useContactoPage'

export default function ContactoPage() {
  const { customer, orders, openAuth } = useContactoPage()

  return (
    <section className="contact-page page-shell">
      <PageIntro eyebrow="Contacto" title="Estamos para ayudarte">
        Encuentra cómo revisar una compra, conocer las opciones de entrega o visitar el punto de recojo.
      </PageIntro>
      <div className="contact-layout">
        <aside className="contact-card">
          <p className="eyebrow">CERÁMAX · LIMA</p>
          <h2>Una pieza especial empieza con una buena conversación.</h2>
          <div className="contact-details">
            <div><span>Recojo en tienda</span><p>Jr. Doymer 268<br />Barranco, Lima, Perú</p></div>
            <div><span>Entrega</span><p>Delivery a domicilio o recojo en tienda; eliges la opción al finalizar tu compra.</p></div>
            <div><span>Seguimiento</span><p>Consulta el estado y el detalle de tus compras desde tu cuenta.</p></div>
          </div>
          <p className="contact-footnote">Esta versión de demostración no tiene un correo ni teléfono de atención conectados. No enviaremos mensajes que no podamos entregar.</p>
        </aside>
        <div className="contact-help-panel">
          <div className="contact-form-heading"><p className="eyebrow">Centro de ayuda</p><h2>¿Qué necesitas resolver?</h2></div>
          <div className="contact-help-options">
            <article><span className="contact-help-number">01</span><div><h3>Consultar un pedido</h3><p>Revisa el estado, los productos y el comprobante de una compra.</p></div><Link className="text-link" to={customer ? '/pedidos' : '/mi-cuenta'}>Ir a mis pedidos <span aria-hidden="true">→</span></Link></article>
            <article><span className="contact-help-number">02</span><div><h3>Conocer una pieza</h3><p>Explora materiales, medidas y disponibilidad del catálogo.</p></div><Link className="text-link" to="/productos">Ver productos <span aria-hidden="true">→</span></Link></article>
            <article><span className="contact-help-number">03</span><div><h3>Guardar tus favoritas</h3><p>Inicia sesión para mantener tu lista de deseos en este navegador.</p></div>{customer ? <Link className="text-link" to="/favoritos">Ver favoritos <span aria-hidden="true">→</span></Link> : <button className="text-link contact-sign-in" type="button" onClick={() => openAuth('login')}>Iniciar sesión <span aria-hidden="true">→</span></button>}</article>
          </div>
          <p className="contact-form-note">{customer ? `Tienes ${orders.length} ${orders.length === 1 ? 'pedido guardado' : 'pedidos guardados'} en tu cuenta local.` : 'Tus compras, favoritos y datos de cuenta se guardan localmente en este navegador.'}</p>
        </div>
      </div>
    </section>
  )
}
