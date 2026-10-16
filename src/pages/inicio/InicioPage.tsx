import './InicioPage.css'
import { Link } from 'react-router-dom'
import { ProductGrid } from '../../components/catalogo/ProductCard'
import { CatalogStatus } from '../../components/catalogo/CatalogStatus'
import { useInicioPage } from './useInicioPage'

export default function InicioPage() {
  const { categories, discountedProducts, catalogLoading, catalogError, refreshCatalog } = useInicioPage()
  return (
    <>
      <section className="hero-section page-shell" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Cerámica peruana contemporánea</p>
          <h1 id="home-title">Diseño que crea <em>espacios con identidad.</em></h1>
          <p className="hero-description">
            Explora la tienda Cerámax y encuentra piezas para dar forma a tus espacios.
          </p>
          <div className="hero-buttons">
            <Link className="button button-dark" to="/productos">Ver productos</Link>
            <Link className="button button-light" to="/categorias">Explorar categorías</Link>
          </div>
          <div className="hero-note">
            <span className="note-line" aria-hidden="true" />
            <span>Descubre la tienda Cerámax</span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=2000&q=90"
            alt="Platos artesanales de cerámica sobre una mesa de madera"
            fetchPriority="high"
          />
          <div className="hero-image-overlay" aria-hidden="true" />
          <div className="collection-label">
            <span>CERÁMAX</span>
            <strong>Cerámica para tus espacios</strong>
          </div>
          <span className="hero-index">CERÁMICA PERUANA</span>
        </div>
      </section>

      <section className="category-section page-shell" aria-labelledby="home-categories-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explora la tienda</p>
            <h2 id="home-categories-title">Categorías</h2>
          </div>
          <Link className="text-link" to="/categorias">Ver categorías <span aria-hidden="true">→</span></Link>
        </div>
        {catalogLoading || catalogError ? <CatalogStatus loading={catalogLoading} error={catalogError} onRetry={() => { void refreshCatalog() }} /> : <div className="category-grid">
          {categories.slice(0, 4).map((category, index) => <Link className="category-card" to={`/categoria/${category.slug}`} key={category.slug}>
            <img src={category.image} alt="" loading="lazy" />
            <div className="category-overlay" />
            <span className="category-number">0{index + 1}</span>
            <div className="category-copy"><span>{category.note}</span><h3>{category.name}</h3></div>
            <span className="category-arrow" aria-hidden="true">→</span>
          </Link>)}
        </div>}
      </section>

      {!catalogLoading && !catalogError && discountedProducts.length > 0 && <section className="products-section offers-section" aria-labelledby="home-offers-title">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Descuentos destacados</p>
              <h2 id="home-offers-title">Ofertas especiales</h2>
            </div>
            <Link className="text-link" to="/productos">Ver productos <span aria-hidden="true">→</span></Link>
          </div>
          <ProductGrid products={discountedProducts} />
        </div>
      </section>}

    </>
  )
}
