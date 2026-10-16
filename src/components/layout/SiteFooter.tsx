import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner page-shell">
        <div className="footer-brand">
          <Link className="brand brand-footer" to="/" aria-label="Cerámax, ir al inicio">
            <img className="footer-logo" src="https://res.cloudinary.com/dfmveqhud/image/upload/v1790609343/images_ydj9yb.svg" alt="Cerámax" />
          </Link>
          <p>Cerámica peruana contemporánea, creada para acompañar tus espacios y momentos cotidianos.</p>
        </div>
        <nav className="footer-column" aria-label="Explora Cerámax">
          <span className="footer-label">Explora</span>
          <Link to="/">Inicio</Link>
          <Link to="/productos">Productos</Link>
          <Link to="/categorias">Categorías</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>
        <div className="footer-column">
          <span className="footer-label">Visítanos</span>
          <span>Jr. Doymer 268</span>
          <span>Barranco, Lima, Perú</span>
          <span>Delivery o recojo en tienda</span>
        </div>
        <div className="footer-copy">© Cerámax · Cerámica peruana contemporánea</div>
      </div>
    </footer>
  )
}
