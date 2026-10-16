import './Catalog.css'
import './ProductCard.css'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import fallbackProductImage from '../../assets/product-image-unavailable.svg'
import { PRODUCT_GALLERY_REFRESH_INTERVAL } from '../../services/catalogApi'
import { useStore, type StoreProduct } from '../../context/StoreContext'
import { ArrowIcon, HeartIcon } from '../ui/Icons'
import { productDeal } from './pricing'

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  if (!products.length) {
    return <div className="empty-results"><h3>No encontramos piezas</h3><p>Prueba con otro nombre o explora todas las categorías.</p><Link className="text-link" to="/productos">Ver todos los productos <span aria-hidden="true">→</span></Link></div>
  }
  return <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
}

export function ProductCard({ product, index = 0, deal = false }: { product: StoreProduct; index?: number; deal?: boolean }) {
  const { customer, favorites, addToCart, toggleFavorite, loadProductGallery } = useStore()
  const imageContainer = useRef<HTMLAnchorElement>(null)
  const [imageNearViewport, setImageNearViewport] = useState(false)
  const [quickView, setQuickView] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const isFavorite = favorites.includes(product.slug)
  const { active: hasDiscount, percent, savings } = productDeal(product)
  const alternateImage = useMemo(
    () => product.gallery.find((image) => image.url && image.url !== product.image)?.url,
    [product.gallery, product.image],
  )
  const lowStock = product.stock > 0 && product.stock <= 5

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

  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(() => setJustAdded(false), 1800)
    return () => window.clearTimeout(timer)
  }, [justAdded])

  function handleAdd() {
    addToCart(product)
    if (customer) setJustAdded(true)
  }

  return (
    <>
      <article
        className={`pc${hasDiscount ? ' pc-sale' : ''}${deal ? ' pc-deal' : ''}${product.stock > 0 ? '' : ' pc-out'}`}
        style={{ '--pc-delay': `${Math.min(index, 8) * 55}ms` } as CSSProperties}
      >
        <div className="pc-media">
          <Link className="pc-image" ref={imageContainer} to={`/producto/${product.slug}`} aria-label={`Ver ${product.name}`}>
            <img className="pc-img-main" src={product.image} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.src = fallbackProductImage }} />
            {alternateImage && <img className="pc-img-alt" src={alternateImage} alt="" loading="lazy" aria-hidden="true" />}
          </Link>
          <div className="pc-flags">
            {hasDiscount && <span className="pc-discount" aria-label={`${percent}% de descuento`}><b>-{percent}%</b></span>}
            {product.badge && !/^-?\d+(\.\d+)?\s*%/.test(product.badge.trim()) && <span className="pc-badge">{product.badge}</span>}
          </div>
          <button className={`pc-fav${isFavorite ? ' is-favorite' : ''}`} type="button" aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`} aria-pressed={isFavorite} onClick={() => toggleFavorite(product)}>
            <HeartIcon filled={isFavorite} />
          </button>
          <button className="pc-quick" type="button" onClick={() => setQuickView(true)}>Vista rápida</button>
        </div>
        <div className="pc-body">
          <span className="pc-category">{product.category}</span>
          <Link className="pc-title" to={`/producto/${product.slug}`}><h3>{product.name}</h3></Link>
          <div className="pc-price-row">
            <strong className="pc-price">S/ {product.price.toFixed(2)}</strong>
            {hasDiscount && <del className="pc-old">S/ {product.originalPrice?.toFixed(2)}</del>}
          </div>
          {hasDiscount && <span className="pc-save">Ahorras S/ {savings.toFixed(2)}</span>}
          <span className={`pc-stock${product.stock <= 0 ? ' is-out' : lowStock ? ' is-low' : ''}`}>
            {product.stock <= 0 ? 'No disponible' : lowStock ? `¡Últimas ${product.stock} unidades!` : `${product.stock} disponibles`}
          </span>
          <button className={`pc-add${justAdded ? ' is-added' : ''}`} type="button" disabled={!product.stock} onClick={handleAdd}>
            {product.stock <= 0 ? 'No disponible' : justAdded ? <><span aria-hidden="true">✓</span> Agregado</> : <><span aria-hidden="true">+</span> Agregar al carrito</>}
          </button>
        </div>
      </article>
      {quickView && (
        <div className="quick-view-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickView(false) }}>
          <section className="quick-view-dialog" role="dialog" aria-modal="true" aria-labelledby={`quick-title-${product.id}`}>
            <button className="dialog-close" type="button" aria-label="Cerrar vista rápida" onClick={() => setQuickView(false)}>×</button>
            <div className="quick-view-image-wrap">
              <img src={product.image} alt={product.name} />
              {hasDiscount && <span className="pc-discount pc-discount-static"><b>-{percent}%</b></span>}
              {product.badge && !/^-?\d+(\.\d+)?\s*%/.test(product.badge.trim()) && <span className="product-badge">{product.badge}</span>}
              <span className="quick-view-image-caption">Cerámica peruana · Hecha a mano</span>
            </div>
            <div className="quick-view-content">
              <p className="eyebrow">Código {product.collection}</p>
              <p className="product-category">{product.category}</p>
              <h2 id={`quick-title-${product.id}`}>{product.name}</h2>
              <div className="pc-price-row pc-price-row-lg">
                <strong className="quick-view-price">S/ {product.price.toFixed(2)}</strong>
                {hasDiscount && <del className="pc-old">S/ {product.originalPrice?.toFixed(2)}</del>}
                {hasDiscount && <span className="pc-save">Ahorras S/ {savings.toFixed(2)}</span>}
              </div>
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
