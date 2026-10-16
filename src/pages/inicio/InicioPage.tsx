import './InicioHome.css'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard, ProductGrid } from '../../components/catalogo/ProductCard'
import { CatalogStatus } from '../../components/catalogo/CatalogStatus'
import { CategoryCarousel3D } from '../../components/motion/CategoryCarousel3D'
import { productDeal } from '../../components/catalogo/pricing'
import { useInicioPage } from './useInicioPage'

const BENEFITS = [
  { title: 'Delivery a domicilio', text: 'S/ 15.00 · llega en unos 5 días', icon: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.8 1.8 0 1 0 0-.01M17 19a1.8 1.8 0 1 0 0-.01" /> },
  { title: 'Recojo en tienda', text: 'Gratis, cuando tu pedido esté listo', icon: <path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6" /> },
  { title: 'Hecho a mano', text: 'Cerámica peruana de nuestro taller', icon: <path d="M8 3h8M9 3c0 3-3 4-3 8 0 5 2 9 6 9s6-4 6-9c0-4-3-5-3-8" /> },
  { title: 'Empaque protegido', text: 'Cada pieza viaja cuidada', icon: <path d="M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10" /> },
]

export default function InicioPage() {
  const { categories, categoryCounts, discountedProducts, shelfProducts, topDiscount, catalogLoading, catalogError, refreshCatalog } = useInicioPage()
  const dealRail = useRef<HTMLDivElement>(null)
  const featuredDeal = discountedProducts[0]
  const featuredInfo = featuredDeal ? productDeal(featuredDeal) : null
  const hasOffers = !catalogLoading && !catalogError && discountedProducts.length > 0

  function scrollRail(direction: 1 | -1) {
    const rail = dealRail.current
    if (rail) rail.scrollBy({ left: direction * Math.max(280, rail.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <>
      <section className="cx-hero" aria-labelledby="home-title">
        <div className="cx-hero-glow" aria-hidden="true" />
        <div className="cx-hero-inner page-shell">
          <div className="cx-hero-copy">
            <h1 id="home-title">Diseño que crea <span className="cx-mark">espacios con identidad<svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9c60-8 130-8 294-2" /></svg></span></h1>
            <p className="cx-hero-text">Cerámica peruana contemporánea, hecha a mano en nuestro taller. Elige tus piezas, pide en línea y recíbelas en casa o recógelas en tienda.</p>
            <div className="cx-hero-actions">
              <Link className="cx-btn cx-btn-ember" to="/productos">Ver productos <span aria-hidden="true">→</span></Link>
              <Link className="cx-btn cx-btn-ghost" to="/categorias">Explorar categorías</Link>
            </div>
          </div>
          <div className="cx-hero-visual">
            <div className="cx-arch">
              <img
                src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1400&q=85"
                alt="Platos artesanales de cerámica sobre una mesa de madera"
                fetchPriority="high"
              />
            </div>
            {hasOffers && topDiscount > 0 && <a className="cx-seal" href="#ofertas" aria-label={`Ofertas de hasta ${topDiscount}% de descuento`}>
              <svg className="cx-seal-ring" viewBox="0 0 120 120" aria-hidden="true">
                <defs><path id="cx-seal-path" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" /></defs>
                <text><textPath href="#cx-seal-path">OFERTAS · OFERTAS · OFERTAS · OFERTAS ·</textPath></text>
              </svg>
              <span className="cx-seal-core"><small>hasta</small><b>-{topDiscount}%</b></span>
            </a>}
            {featuredDeal && featuredInfo?.active && <Link className="cx-float-card" to={`/producto/${featuredDeal.slug}`}>
              <img src={featuredDeal.image} alt="" />
              <span className="cx-float-copy">
                <small>Pieza en oferta</small>
                <strong>{featuredDeal.name}</strong>
                <span><b>S/ {featuredDeal.price.toFixed(2)}</b> <del>S/ {featuredDeal.originalPrice?.toFixed(2)}</del></span>
              </span>
              <span className="cx-float-off">-{featuredInfo.percent}%</span>
            </Link>}
          </div>
        </div>
      </section>

      <section className="cx-benefits page-shell" aria-label="Beneficios de comprar en Cerámax">
        {BENEFITS.map((benefit) => <div className="cx-benefit" key={benefit.title}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{benefit.icon}</svg>
          <span><strong>{benefit.title}</strong><small>{benefit.text}</small></span>
        </div>)}
      </section>

      <section className="cx-section cx-cats" aria-labelledby="home-categories-title">
        <div className="page-shell cx-head">
          <h2 id="home-categories-title">Categorías</h2>
          <Link className="cx-link" to="/categorias">Ver todas <span aria-hidden="true">→</span></Link>
        </div>
        <div className="cx-cats-stage">
          {catalogLoading || catalogError
            ? <div className="page-shell"><CatalogStatus loading={catalogLoading} error={catalogError} onRetry={() => { void refreshCatalog() }} /></div>
            : <CategoryCarousel3D categories={categories} counts={categoryCounts} />}
        </div>
      </section>

      {hasOffers && <section className="cx-deals" id="ofertas" aria-labelledby="home-offers-title">
        <div className="cx-deals-glow" aria-hidden="true" />
        <div className="page-shell cx-deals-head">
          <div className="cx-deals-title">
            <span className="cx-deals-big" aria-hidden="true">-{topDiscount}%</span>
            <div>
              <h2 id="home-offers-title">Ofertas especiales</h2>
              <p>Piezas con precio rebajado hasta agotar stock.</p>
            </div>
          </div>
          <div className="cx-deals-tools">
            <Link className="cx-link cx-link-light" to="/productos">Ver todos los productos <span aria-hidden="true">→</span></Link>
            <button type="button" className="cx-round" aria-label="Ofertas anteriores" onClick={() => scrollRail(-1)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 10h-12m5-5-5 5 5 5" /></svg></button>
            <button type="button" className="cx-round" aria-label="Más ofertas" onClick={() => scrollRail(1)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10h12m-5-5 5 5-5 5" /></svg></button>
          </div>
        </div>
        <div className="cx-rail page-shell" ref={dealRail} tabIndex={0} aria-label="Productos en oferta">
          {discountedProducts.map((product, index) => <div className="cx-rail-item" key={product.id}><ProductCard product={product} index={index} deal /></div>)}
        </div>
      </section>}

      {!catalogLoading && !catalogError && shelfProducts.length > 0 && <section className="cx-section cx-shelf page-shell" aria-labelledby="home-shelf-title">
        <div className="cx-head">
          <h2 id="home-shelf-title">Piezas para tu espacio</h2>
          <Link className="cx-link" to="/productos">Ver productos <span aria-hidden="true">→</span></Link>
        </div>
        <ProductGrid products={shelfProducts} />
      </section>}
    </>
  )
}
