import './DetalleProductoPage.css'
import { Link } from 'react-router-dom'
import { CatalogStatus } from '../../components/catalogo/CatalogStatus'
import { ProductGrid } from '../../components/catalogo/ProductCard'
import { PageIntro } from '../../components/common/PageIntro'
import { useDetalleProductoPage } from './useDetalleProductoPage'

export default function DetalleProductoPage() {
  const {
    addToCart, authToken, catalogError, catalogLoading, checkingEligibleOrders, comment, detailsError,
    completedOrders, favorites, hasReviewedProduct, matchingEligibleOrders, openAuth, orderCheckError, ordersError, ordersLoading, product,
    productCategory, productReviews, productSpecifications: specifications, refreshCatalog, relatedProducts,
    rating, reviewImages, reviewSubmitError, reviewSubmitMessage, reviewsError, reviewsLoading,
    selectedImage, selectedOrderId, selectReviewImages, setComment, setRating, setRequestedOrderId,
    setReviewImages, setSelectedImage, submitReview, submittingReview, toggleFavorite,
  } = useDetalleProductoPage()

  if (!product && (catalogLoading || catalogError)) return <section className="empty-page page-shell"><CatalogStatus loading={catalogLoading} error={catalogError} onRetry={() => { void refreshCatalog() }} /></section>
  if (!product) return <section className="empty-page page-shell"><PageIntro eyebrow="Catálogo" title="Pieza no encontrada">No encontramos el producto que buscas.</PageIntro><Link className="button button-dark" to="/productos">Volver al catálogo</Link></section>
  const gallery = product.gallery
  const mainImage = selectedImage?.productId === product.id && gallery.some((image) => image.url === selectedImage.url)
    ? selectedImage.url
    : product.image
  const hasDiscount = (product.discountPercent ?? 0) > 0
    && product.originalPrice !== undefined
    && product.originalPrice > product.price

  return <>
    <section className="product-detail-page page-shell">
      <div className="breadcrumbs"><Link to="/">Inicio</Link><span>/</span><Link to="/productos">Productos</Link><span>/</span>{productCategory ? <Link to={`/categoria/${productCategory.slug}`}>{product.category}</Link> : <span>{product.category}</span>}<span>/</span><span>{product.name}</span></div>
      <div className="product-detail-layout">
        <div className="product-gallery"><div className="product-detail-image"><img src={mainImage} alt={product.name} /></div><div className="product-thumbnails">{(gallery.length ? gallery : [{ url: product.image, isPrimary: true }]).map((image, index) => <button className={`thumbnail-button${mainImage === image.url ? ' thumbnail-active' : ''}`} key={`${image.url}-${index}`} type="button" aria-label={`Ver imagen ${index + 1} de ${product.name}`} aria-pressed={mainImage === image.url} onClick={() => setSelectedImage({ productId: product.id, url: image.url })}><img src={image.url} alt="" loading="lazy" /></button>)}</div></div>
        <div className="product-detail-info">
          <p className="eyebrow">{product.category} · Código {product.collection}</p>
          <h1>{product.name}</h1>
          <p className="detail-rating"><span aria-label="5 de 5 estrellas">★★★★★</span> Pieza artesanal hecha en Perú</p>
          <p className="detail-description">{product.description}</p>
          <div className={`detail-price${hasDiscount ? ' has-discount' : ''}`}>
            {hasDiscount && <div className="detail-price-original">
              <span>Precio regular</span>
              <del>S/ {product.originalPrice?.toFixed(2)}</del>
            </div>}
            <div className="detail-price-final">
              <span>{hasDiscount ? 'Precio final' : 'Precio'}</span>
              <strong>S/ {product.price.toFixed(2)}</strong>
              {hasDiscount && <span className="detail-discount-badge">-{product.discountPercent}%</span>}
            </div>
          </div>
          <p className={`detail-stock${product.stock > 0 ? '' : ' detail-stock-unavailable'}`}>{product.stock > 0 ? <><span /> {product.stock} disponibles en el taller</> : 'No disponible'}</p>
          <div className="detail-actions"><button className="button button-dark detail-add-button" type="button" disabled={!product.stock} onClick={() => addToCart(product)}>{product.stock > 0 ? `Agregar al carrito · S/ ${product.price.toFixed(2)}` : 'No disponible'}</button><button className="button button-light" type="button" aria-pressed={favorites.includes(product.slug)} onClick={() => toggleFavorite(product)}>{favorites.includes(product.slug) ? 'Guardado en favoritos' : 'Guardar en favoritos'}</button></div>
          <div className="delivery-note"><span className="delivery-note-icon">✳</span><p><strong>Entrega con cuidado</strong><br />Consulta las opciones de envío o recojo en tienda al finalizar tu compra.</p></div>
          {detailsError && <p className="checkout-error" role="status">{detailsError}</p>}
          <div className="product-specs"><h2>Detalles de la pieza</h2><dl>{specifications.length ? specifications.map((specification, index) => <div key={`${specification.label}-${index}`}><dt>{specification.label}</dt><dd>{specification.value}</dd></div>) : <><div><dt>Material</dt><dd>{product.material}</dd></div><div><dt>Medidas aproximadas</dt><dd>{product.dimensions}</dd></div><div><dt>Técnica</dt><dd>{product.technique}</dd></div><div><dt>Origen</dt><dd>Hecho a mano en Perú</dd></div></>}</dl></div>
          <p className="handmade-note">Por su proceso artesanal, cada pieza puede presentar ligeras variaciones de tono, forma y textura.</p>
        </div>
      </div>
    </section>
    <section className="reviews-section page-shell">
      <div className="section-heading reviews-heading">
        <div><p className="eyebrow">Experiencias de nuestra comunidad</p><h2>Reseñas de la pieza</h2></div>
        <span className="reviews-count">{reviewsLoading ? 'Cargando reseñas…' : reviewsError ? 'No disponibles' : `${productReviews.length} ${productReviews.length === 1 ? 'reseña' : 'reseñas'}`}</span>
      </div>
      {reviewsError && <p className="checkout-error" role="alert">{reviewsError}</p>}
      {reviewsLoading ? (
        <p className="review-feedback" role="status">Cargando reseñas…</p>
      ) : productReviews.length ? (
        <div className="reviews-grid">
          {productReviews.map((review) => {
            const initials = review.clienteNombre.split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0]).join('').toLocaleUpperCase('es')
            return <article className="review-card" key={review.id}>
              <div className="review-card-heading">
                <span className="review-avatar" aria-hidden="true">{initials}</span>
                <div className="review-author"><strong>{review.clienteNombre}</strong><time>{new Date(review.creadoEn).toLocaleDateString('es-PE')}</time></div>
                <span className="review-stars" aria-label={`${review.calificacion} de 5 estrellas`}>{'★'.repeat(review.calificacion)}{'☆'.repeat(5 - review.calificacion)}</span>
              </div>
              {review.comentario && <p>{review.comentario}</p>}
              {review.imagenes.length > 0 && <div className="review-images">{review.imagenes.map((image, index) => <a href={image.url} target="_blank" rel="noreferrer" key={`${image.url}-${index}`} aria-label={`Ver imagen ${index + 1} de la reseña`}><img src={image.url} alt={`Imagen ${index + 1} compartida en la reseña`} loading="lazy" /></a>)}</div>}
            </article>
          })}
        </div>
      ) : !reviewsError ? (
        <div className="reviews-empty">
          <span aria-hidden="true">✳</span>
          <div><strong>Aún no hay reseñas</strong><p>Sé la primera persona en compartir tu experiencia con esta pieza.</p></div>
        </div>
      ) : null}
      {authToken ? (
        <>
          {ordersError && <p className="checkout-error" role="alert">{ordersError}</p>}
          {hasReviewedProduct ? (
            <p className="review-feedback" role="status">Ya publicaste una reseña para esta pieza. Gracias por compartir tu experiencia.</p>
          ) : ordersLoading ? (
            <p className="review-feedback" role="status">Revisando tus pedidos completados…</p>
          ) : checkingEligibleOrders ? (
            <p className="review-feedback" role="status">Buscando pedidos completados que incluyan esta pieza…</p>
          ) : matchingEligibleOrders.length > 0 ? (
            <label className="review-order-select">Pedido completado
              <select value={selectedOrderId} onChange={(event) => setRequestedOrderId(event.target.value)}>
                {matchingEligibleOrders.map((order) => <option value={order.id} key={order.id}>{order.code} · {new Date(order.createdAt).toLocaleDateString('es-PE')}</option>)}
              </select>
            </label>
          ) : <p className="review-feedback">{completedOrders.length
            ? 'No encontramos pedidos completados que incluyan esta pieza.'
            : 'Tus pedidos todavía no figuran como completados. Podrás publicar una reseña cuando un pedido que incluya esta pieza llegue al estado «Completada».'}</p>}
          {orderCheckError && <p className="checkout-error" role="alert">{orderCheckError}</p>}
          {reviewSubmitMessage && <p className="review-feedback" role="status">{reviewSubmitMessage}</p>}
          {!reviewsLoading && !reviewsError && !hasReviewedProduct && !ordersLoading && !checkingEligibleOrders && matchingEligibleOrders.length > 0 && <form className="review-form" onSubmit={submitReview}>
            <div className="review-form-heading"><p className="eyebrow">Tu experiencia</p><h3>Escribe una reseña</h3><p>Cuéntale a la comunidad qué te pareció esta pieza.</p></div>
            <label>Calificación<select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} estrellas</option>)}</select></label>
            <label>Tu comentario<textarea required minLength={8} rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comparte los detalles que más te gustaron..." /></label>
            <label>Fotos (opcional, máximo 5)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple onChange={selectReviewImages} /></label>
            {reviewImages.length > 0 && <div className="review-image-previews">{reviewImages.map((image, index) => <div className="review-image-file" key={`${image.name}-${image.lastModified}-${index}`}><span title={image.name}>{image.name} · {(image.size / (1024 * 1024)).toFixed(1)} MB</span><button type="button" aria-label={`Quitar ${image.name}`} onClick={() => setReviewImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}>Quitar</button></div>)}</div>}
            {reviewSubmitError && <p className="checkout-error review-submit-error" role="alert">{reviewSubmitError}</p>}
            <button className="button button-dark" type="submit" disabled={submittingReview || !selectedOrderId}>{submittingReview ? 'Publicando…' : 'Publicar reseña'}</button>
          </form>}
        </>
      ) : (
        <div className="review-login-note"><span>¿Ya tienes una experiencia con esta pieza?</span><button type="button" onClick={() => openAuth('login')}>Inicia sesión para dejar tu reseña</button></div>
      )}
    </section>
    {relatedProducts.length > 0 && <section className="related-products-section"><div className="page-shell"><div className="section-heading"><div><p className="eyebrow">Continúa explorando</p><h2>Productos que te pueden interesar</h2></div><Link className="text-link" to="/productos">Ver catálogo →</Link></div><ProductGrid products={relatedProducts} /></div></section>}
  </>
}
