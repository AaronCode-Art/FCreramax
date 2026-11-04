import './ContactoPage.css'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import { useContactoPage } from './useContactoPage'

const photo = (id: string, width = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`
const gallery = [
  { src: photo('photo-1578749556568-bc2c40e68b61', 1100), alt: 'Platos de cerámica artesanal sobre una mesa' },
  { src: photo('photo-1565193566173-7a0ee3dbe261', 700), alt: 'Jarrón de cerámica con acabado mate' },
  { src: photo('photo-1610701596007-11502861dcfa', 700), alt: 'Tazas de cerámica hechas a mano' },
]
const customImage = photo('photo-1485955900006-10f4d324d411', 1600)
const customMail = 'mailto:ceramax323@gmail.com?subject=' + encodeURIComponent('Producto personalizado') + '&body=' + encodeURIComponent('Hola Cerámax, me gustaría un producto personalizado.\n\nPieza que imagino:\nCantidad:\nFecha en la que lo necesito:\n')

export default function ContactoPage() {
  const { customer, orders, openAuth } = useContactoPage()

  return (
    <section className="contact-page page-shell">
      <PageIntro eyebrow="Contacto" title="Estamos para ayudarte">
        Información para comprar, coordinar la entrega y resolver dudas sobre tus pedidos y productos Cerámax.
      </PageIntro>
      <div className="contact-gallery" aria-label="Piezas de cerámica Cerámax">
        {gallery.map((item) => <figure key={item.src}><img src={item.src} alt={item.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.closest('figure')?.classList.add('is-missing') }} /></figure>)}
      </div>
      <div className="contact-layout">
        <aside className="contact-card">
          <p className="eyebrow">CERÁMAX · LIMA</p>
          <h2>Estamos cerca para acompañarte en tu compra.</h2>
          <div className="contact-details">
            <div>
              <span>Punto de recojo</span>
              <p>Jr. Doymer 268<br />Barranco, Lima, Perú</p>
              <a href="https://www.google.com/maps/search/?api=1&query=Jr.+Doymer+268%2C+Barranco%2C+Lima%2C+Per%C3%BA" target="_blank" rel="noopener noreferrer">Ver ubicación en Google Maps <span aria-hidden="true">↗</span></a>
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
            <article><span className="contact-help-number">01</span><div><h3>Consultar un pedido</h3><p>Revisa el estado, los productos, el comprobante y la información de entrega.</p></div><Link className="text-link" to={customer ? '/pedidos' : '/mi-cuenta'}>Ir a mis pedidos</Link></article>
            <article><span className="contact-help-number">02</span><div><h3>Comprar una pieza</h3><p>Explora el catálogo, consulta características y agrega tus productos al carrito.</p></div><Link className="text-link" to="/productos">Ver productos</Link></article>
            <article><span className="contact-help-number">03</span><div><h3>Encontrar descuentos</h3><p>Consulta códigos vigentes, compra mínima y el límite de uso por cliente.</p></div><Link className="text-link" to="/cupones">Ver cupones</Link></article>
            <article><span className="contact-help-number">04</span><div><h3>Recuperar o actualizar tu cuenta</h3><p>Inicia sesión para gestionar tus datos. Si olvidaste la contraseña, solicita un código de recuperación por correo.</p></div><button className="text-link contact-sign-in" type="button" onClick={() => openAuth('login')}>Ir a mi cuenta</button></article>
            <article><span className="contact-help-number">05</span><div><h3>Visitar el punto de recojo</h3><p>Ubicación en Jr. Doymer 268, Barranco, Lima. Selecciona recojo en tienda al realizar el pedido.</p></div><a className="text-link" href="https://www.google.com/maps/search/?api=1&query=Jr.+Doymer+268%2C+Barranco%2C+Lima%2C+Per%C3%BA" target="_blank" rel="noopener noreferrer">Abrir mapa <span aria-hidden="true">↗</span></a></article>
          </div>
          <p className="contact-form-note">{customer ? `Tienes ${orders.length} ${orders.length === 1 ? 'pedido en tu historial' : 'pedidos en tu historial'}.` : 'Inicia sesión para consultar tus pedidos, guardar favoritos y gestionar los datos de tu cuenta.'}</p>
        </div>
      </div>
      <aside className="contact-custom" style={{ backgroundImage: `linear-gradient(90deg, rgb(31 24 19 / 88%) 0%, rgb(31 24 19 / 62%) 55%, rgb(31 24 19 / 28%) 100%), url(${customImage})` }}>
        <div>
          <p className="eyebrow">A tu medida</p>
          <h2>¿Deseas un producto personalizado?</h2>
          <p>Cuéntanos qué pieza imaginas: tamaño, color, acabado o cantidad. Te respondemos por correo para coordinar los detalles.</p>
        </div>
        <a className="button contact-custom-button" href={customMail}>Contáctanos</a>
      </aside>
    </section>
  )
}
