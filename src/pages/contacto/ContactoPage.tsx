import './ContactoPage.css'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import { useContactoPage } from './useContactoPage'

export default function ContactoPage() {
  const { customer, orders, openAuth } = useContactoPage()

  return (
    <section className="contact-page page-shell">
      <PageIntro eyebrow="Contacto" title="Estamos para ayudarte">
        Información para comprar, coordinar la entrega y resolver dudas sobre tus pedidos y productos Cerámax.
      </PageIntro>
      <div className="contact-layout">
        <aside className="contact-card">
          <p className="eyebrow">CERÁMAX · LIMA</p>
          <h2>Estamos cerca para acompañarte en tu compra.</h2>
          <div className="contact-details">
            <div>
              <span>Punto de recojo</span>
              <p>Jr. Doymer 268<br />Barranco, Lima, Perú</p>
              <a href="https://www.google.com/maps/search/?api=1&query=Jr.+Doymer+268%2C+Barranco%2C+Lima%2C+Per%C3%BA" target="_blank" rel="noreferrer">Ver ubicación en Google Maps <span aria-hidden="true">↗</span></a>
            </div>
            <div><span>Correo de contacto</span><p><a href="mailto:ceramax323@gmail.com">ceramax323@gmail.com</a></p></div>
            <div><span>Entrega</span><p>Al finalizar la compra puedes elegir delivery a la dirección registrada o recojo en tienda. El costo y los datos de entrega se muestran antes de confirmar el pedido.</p></div>
            <div><span>Comprobantes</span><p>Selecciona boleta o factura durante el checkout. Para factura, ten a mano la razón social y el RUC.</p></div>
          </div>
          <p className="contact-footnote">No publicamos un teléfono ni horario de atención para evitar mostrar datos no confirmados. Para consultas por correo, escribe a la dirección indicada.</p>
        </aside>
        <div className="contact-help-panel">
          <div className="contact-form-heading"><p className="eyebrow">Centro de ayuda</p><h2>¿Qué necesitas resolver?</h2></div>
          <div className="contact-help-options">
            <article><span className="contact-help-number">01</span><div><h3>Consultar un pedido</h3><p>Revisa el estado, los productos, el comprobante y la información de entrega.</p></div><Link className="text-link" to={customer ? '/pedidos' : '/mi-cuenta'}>Ir a mis pedidos <span aria-hidden="true">→</span></Link></article>
            <article><span className="contact-help-number">02</span><div><h3>Comprar una pieza</h3><p>Explora el catálogo, consulta características y agrega tus productos al carrito.</p></div><Link className="text-link" to="/productos">Ver productos <span aria-hidden="true">→</span></Link></article>
            <article><span className="contact-help-number">03</span><div><h3>Encontrar descuentos</h3><p>Consulta códigos vigentes, compra mínima y el límite de uso por cliente.</p></div><Link className="text-link" to="/cupones">Ver cupones <span aria-hidden="true">→</span></Link></article>
            <article><span className="contact-help-number">04</span><div><h3>Recuperar o actualizar tu cuenta</h3><p>Inicia sesión para gestionar tus datos. Si olvidaste la contraseña, solicita un código de recuperación por correo.</p></div><button className="text-link contact-sign-in" type="button" onClick={() => openAuth('login')}>Ir a mi cuenta <span aria-hidden="true">→</span></button></article>
            <article><span className="contact-help-number">05</span><div><h3>Visitar el punto de recojo</h3><p>Ubicación en Jr. Doymer 268, Barranco, Lima. Selecciona recojo en tienda al realizar el pedido.</p></div><a className="text-link" href="https://www.google.com/maps/search/?api=1&query=Jr.+Doymer+268%2C+Barranco%2C+Lima%2C+Per%C3%BA" target="_blank" rel="noreferrer">Abrir mapa <span aria-hidden="true">↗</span></a></article>
          </div>
          <p className="contact-form-note">{customer ? `Tienes ${orders.length} ${orders.length === 1 ? 'pedido en tu historial' : 'pedidos en tu historial'}.` : 'Inicia sesión para consultar tus pedidos, guardar favoritos y gestionar los datos de tu cuenta.'}</p>
        </div>
      </div>
    </section>
  )
}
