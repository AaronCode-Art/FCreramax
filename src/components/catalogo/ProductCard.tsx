import './Catalog.css'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import fallbackProductImage from '../../assets/product-image-unavailable.svg'
import { PRODUCT_GALLERY_REFRESH_INTERVAL } from '../../services/catalogApi'
import { useStore, type StoreProduct } from '../../context/StoreContext'
import { ArrowIcon, HeartIcon } from '../ui/Icons'

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  if (!products.length) {
    return <div className="empty-results"><h3>No encontramos piezas</h3><p>Prueba con otro nombre o explora todas las categorías.</p><Link className="text-link" to="/productos">Ver todos los productos <span aria-hidden="true">→</span></Link></div>
  }
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
}

function ProductCard({ product }: { product: StoreProduct }) {
  const { favorites, addToCart, toggleFavorite, loadProductGallery } = useStore()
  const imageContainer = useRef<HTMLAnchorElement>(null)
  const [imageNearViewport, setImageNearViewport] = useState(false)
  const [quickView, setQuickView] = useState(false)
  const isFavorite = favorites.includes(product.slug)
  const hasDiscount = (product.discountPercent ?? 0) > 0
    && product.originalPrice !== undefined
    && product.originalPrice > product.price

  useEffect(() => {
    const element = imageContainer.current
    if (!element) return
    if (!('IntersectionObserver' in window)) {
      void loadProductGallery(product.id)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      setImageNearViewport(entries.some((entry) => entry.isIntersecting))
    }, { rootMargin: '250px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [loadProductGallery, product.id])

  useEffect(() => {
    if (!imageNearViewport) return
    void loadProductGallery(product.id)
    const refreshGallery = () => {
      if (document.visibilityState === 'visible') void loadProductGallery(product.id, true)
    }
    const interval = window.setInterval(refreshGallery, PRODUCT_GALLERY_REFRESH_INTERVAL)
    document.addEventListener('visibilitychange', refreshGallery)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshGallery)
    }
  }, [imageNearViewport, product.id, loadProductGallery])

  useEffect(() => {
    if (!quickView) return
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setQuickView(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = oldOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [quickView])

  return (
    <>
      <article className="product-card">
        <Link className="product-image" ref={imageContainer} to={`/producto/${product.slug}`} aria-label={`Ver ${product.name}`}>
          <img src={product.image} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.src = fallbackProductImage }} />
          {product.badge && <span className="product-badge">{product.badge}</span>}
        </Link>
        <button className={`favorite-button${isFavorite ? ' is-favorite' : ''}`} type="button" aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`} aria-pressed={isFavorite} onClick={() => toggleFavorite(product)}>
          <HeartIcon filled={isFavorite} />
        </button>
        <div className="product-info">
          <Link className="product-title-link" to={`/producto/${product.slug}`}><h3>{product.name}</h3></Link>
          <div className="product-bottom">
            <span className={product.stock > 0 ? '' : 'product-unavailable'}>{product.stock > 0 ? `${product.stock} disponibles` : 'No disponible'}</span>
            <div className={`product-card-prices${hasDiscount ? ' has-discount' : ''}`}>
              {hasDiscount && <del>S/ {product.originalPrice?.toFixed(2)}</del>}
              <strong>S/ {product.price.toFixed(2)}</strong>
            </div>
          </div>
          <div className="product-card-actions">
            <button className="quick-view-button" type="button" onClick={() => setQuickView(true)}>Vista rápida</button>
            <button className="product-cta" type="button" disabled={!product.stock} onClick={() => addToCart(product)}>{product.stock > 0 ? <><span aria-hidden="true">+</span> Agregar</> : 'No disponible'}</button>
          </div>
        </div>
      </article>
      {quickView && (
        <div className="quick-view-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickView(false) }}>
          <section className="quick-view-dialog" role="dialog" aria-modal="true" aria-labelledby={`quick-title-${product.id}`}>
            <button className="dialog-close" type="button" aria-label="Cerrar vista rápida" onClick={() => setQuickView(false)}>×</button>
            <div className="quick-view-image-wrap">
              <img src={product.image} alt={product.name} />
              {product.badge && <span className="product-badge">{product.badge}</span>}
              <span className="quick-view-image-caption">Cerámica peruana · Hecha a mano</span>
            </div>
            <div className="quick-view-content">
              <p className="eyebrow">Código {product.collection}</p>
              <p className="product-category">{product.category}</p>
              <h2 id={`quick-title-${product.id}`}>{product.name}</h2>
              <strong className="quick-view-price">S/ {product.price.toFixed(2)}</strong>
              <span className={`quick-view-stock${product.stock > 0 ? '' : ' quick-view-stock-unavailable'}`}>{product.stock > 0 ? <><i />{product.stock} piezas disponibles</> : 'No disponible'}</span>
              <p>{product.description}</p>
              <div className="quick-view-actions">
                <button className="button button-dark" type="button" disabled={!product.stock} onClick={() => { addToCart(product); setQuickView(false) }}>Agregar al carrito</button>
                <button className={`quick-view-favorite${isFavorite ? ' is-favorite' : ''}`} type="button" aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'} aria-pressed={isFavorite} onClick={() => toggleFavorite(product)}><HeartIcon filled={isFavorite} /></button>
              </div>
              <Link className="quick-view-detail-link" to={`/producto/${product.slug}`} onClick={() => setQuickView(false)}>Ver detalles completos <ArrowIcon /></Link>
              <span className="quick-view-note">Empaque protegido · Opciones de entrega al finalizar</span>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
