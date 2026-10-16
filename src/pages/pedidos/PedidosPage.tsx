import './PedidosPage.css'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import type { StoreOrder } from '../../context/StoreContext'
import { usePedidosPage } from './usePedidosPage'

function statusLabel(code: string, fallback: string) {
  const labels: Record<string, string> = {
    PENDIENTE_PAGO: 'Pendiente de pago', PREPARACION: 'En preparación',
    LISTO_DESPACHO: 'Listo para despacho', LISTO_PARA_RECOGER: 'Listo para recoger',
    EN_RUTA: 'En ruta', EN_CAMINO: 'En ruta', COMPLETADA: 'Completado',
    NO_ENTREGADA: 'No se pudo entregar', CANCELADO: 'Cancelado',
  }
  return labels[code] ?? fallback
}

async function downloadOrderPdf(order: StoreOrder) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  const width = pdf.internal.pageSize.getWidth()
  const margin = 18
  let y = 20
  const line = (text: string, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    const wrapped = pdf.splitTextToSize(text, width - margin * 2)
    if (y + wrapped.length * 6 > 278) { pdf.addPage(); y = 20 }
    pdf.text(wrapped, margin, y)
    y += wrapped.length * 6 + 2
  }
  pdf.setFillColor(50, 45, 39)
  pdf.rect(0, 0, width, 42, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text('CERAMAX', margin, 19)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Comprobante de pedido · ${order.code}`, margin, 30)
  pdf.setTextColor(45, 42, 38)
  y = 54
  line(`Fecha: ${new Date(order.createdAt).toLocaleString('es-PE')}`)
  line(`Estado: ${statusLabel(order.statusCode, order.status)}`)
  line(`Comprobante: ${order.receiptType === 'FACTURA' ? 'Factura' : 'Boleta'}${order.serie && order.numeroComprobante ? ` ${order.serie}-${order.numeroComprobante}` : ''}`)
  line(`Cliente: ${order.customer.name}`)
  line(`Documento: ${order.customer.documentType} ${order.customer.documentNumber}`)
  line(`Correo: ${order.customer.email}`)
  if (order.receiptType === 'FACTURA') {
    line(`Razon social: ${order.businessName}`)
    line(`RUC: ${order.businessRuc}`)
  }
  y += 5
  pdf.setDrawColor(210, 203, 194)
  pdf.line(margin, y, width - margin, y)
  y += 8
  line('PRODUCTOS', true)
  for (const { product, quantity } of order.items) {
    line(`${product.name} - ${product.category}`)
    line(`${quantity} x S/ ${product.price.toFixed(2)} = S/ ${(quantity * product.price).toFixed(2)}`)
  }
  y += 3
  pdf.line(margin, y, width - margin, y)
  y += 8
  line(`TOTAL: S/ ${order.total.toFixed(2)}`, true)
  line(`Entrega: ${order.delivery === 'DELIVERY' ? 'Envio a domicilio' : 'Recojo en tienda'}`)
  line(`Direccion: ${order.address}`)
  if (order.delivery === 'DELIVERY' && order.deliveryAddress.postalCode) line(`Codigo postal: ${order.deliveryAddress.postalCode}`)
  if (order.delivery === 'DELIVERY' && order.deliveryAddress.ubigeo) line(`Ubigeo (INEI): ${order.deliveryAddress.ubigeo}`)
  if (order.delivery === 'DELIVERY' && order.deliveryAddress.reference) line(`Referencia: ${order.deliveryAddress.reference}`)
  line(`Metodo de pago: ${order.payment} (pago simulado)`)
  pdf.setFontSize(8)
  pdf.setTextColor(110, 104, 96)
  pdf.text('Documento generado desde la tienda Ceramax. El pago fue simulado.', margin, Math.min(y + 5, 285))
  pdf.save(`pedido-${order.code}.pdf`)
}

export default function PedidosPage() {
  const {
    closeSelected,
    customer,
    error,
    filtered,
    handleDownload,
    handleSelect,
    openAuth,
    orders,
    ordersError,
    ordersLoading,
    page,
    pages,
    query,
    refreshOrders,
    selected,
    selectedLoading,
    setPage,
    updateQuery,
    visible,
  } = usePedidosPage(downloadOrderPdf)

  if (!customer) return <section className="customer-page page-shell"><PageIntro eyebrow="Tu historial" title="Mis pedidos">Inicia sesión para consultar tus compras.</PageIntro><button className="button button-dark" type="button" onClick={() => openAuth('login')}>Iniciar sesión</button></section>
  return <section className="customer-page page-shell">
    <PageIntro eyebrow="Tu historial" title="Mis pedidos">Busca tus pedidos por código o comprobante y consulta su seguimiento.</PageIntro>
    {ordersLoading ? <div className="customer-empty" role="status"><h2>Cargando tus pedidos…</h2><p>Estamos consultando el historial de tu cuenta.</p></div> : ordersError ? <div className="customer-empty"><h2>No se pudo cargar tu historial</h2><p role="alert">{ordersError}</p><button className="button button-dark" type="button" onClick={() => void refreshOrders()}>Reintentar</button></div> : !orders.length ? <div className="customer-empty"><h2>Aún no tienes pedidos</h2><p>Cuando completes una compra, aparecerá aquí su estado y comprobante.</p><Link className="button button-dark" to="/productos">Ver productos</Link></div> : <>
      {error && <p className="order-pdf-error" role="alert">{error}</p>}
      <label className="orders-search">Buscar pedido<input type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Código de pedido o comprobante" /></label>
      {!filtered.length ? <div className="customer-empty"><h2>No encontramos pedidos</h2><p>Prueba con otro producto o número.</p></div> : <>
        <div className="orders-list">{visible.map((order) => <article className="order-card" key={order.id}>
          <button className="order-card-button" type="button" onClick={() => void handleSelect(order)}>
            <div className="order-card-heading"><div><span>Pedido {order.code}</span><h2>{statusLabel(order.statusCode, order.status)}</h2></div><strong>S/ {order.total.toFixed(2)}</strong></div>
            <div className="order-meta"><span>{new Date(order.createdAt).toLocaleDateString('es-PE')}</span><span>{order.delivery === 'DELIVERY' ? 'Envío a domicilio' : 'Recojo en tienda'}</span><span>{order.receiptType === 'FACTURA' ? 'Factura' : 'Boleta'}{order.serie && order.numeroComprobante ? ` · ${order.serie}-${order.numeroComprobante}` : ''}</span></div>
            <div className={`order-status order-status-${order.statusCode.toLowerCase()}`}><span />{statusLabel(order.statusCode, order.status)}</div>
            <span className="order-view-details">Ver detalle del pedido <span aria-hidden="true">›</span></span>
          </button>
          <button className="button button-light order-download-button" type="button" onClick={() => void handleDownload(order)}>Descargar pedido en PDF</button>
        </article>)}</div>
        {pages > 1 && <nav className="orders-pagination" aria-label="Paginación de pedidos"><button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Anterior</button><span>Página {page + 1} de {pages} · {filtered.length} pedidos</span><button type="button" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>Siguiente</button></nav>}
      </>}
    </>}
    {selected && <div className="auth-modal-backdrop order-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSelected() }}><section className="order-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
      <button className="dialog-close" type="button" aria-label="Cerrar detalle" onClick={closeSelected}>×</button>
      <header className="order-detail-heading"><p className="eyebrow">Seguimiento de compra</p><h2 id="order-detail-title">Pedido {selected.code}</h2><div className={`order-status order-status-${selected.statusCode.toLowerCase()}`}><span />{statusLabel(selected.statusCode, selected.status)}</div><p>{new Date(selected.createdAt).toLocaleString('es-PE')}</p><button className="button button-dark order-detail-download" type="button" onClick={() => void handleDownload(selected)}>Descargar pedido en PDF</button>{error && <p className="order-pdf-error" role="alert">{error}</p>}</header>
      {selectedLoading ? <div className="customer-empty" role="status"><p>Cargando detalle del pedido…</p></div> : <div className="order-detail-content">
        <section className="order-detail-section"><h3>Estado del pedido</h3>{['PENDIENTE_PAGO', 'PREPARACION', selected.delivery === 'DELIVERY' ? 'LISTO_DESPACHO' : 'LISTO_PARA_RECOGER', ...(selected.delivery === 'DELIVERY' ? ['EN_RUTA'] : []), 'COMPLETADA'].map((step, index, steps) => {
          const current = selected.statusCode === 'EN_CAMINO' ? 'EN_RUTA' : selected.statusCode
          const active = Math.max(0, steps.indexOf(current))
          const terminal = ['CANCELADO', 'NO_ENTREGADA'].includes(selected.statusCode)
          const done = selected.statusCode === 'COMPLETADA' || (!terminal && index < active)
          return <div className={`order-timeline-step${done ? ' is-complete' : ''}${!terminal && (index === active || selected.statusCode === 'COMPLETADA' && index === steps.length - 1) ? ' is-current' : ''}`} key={step}><span className="order-timeline-marker">{done ? '✓' : index + 1}</span><div><strong>{statusLabel(step, step)}</strong></div></div>
        })}{['CANCELADO', 'NO_ENTREGADA'].includes(selected.statusCode) && <div className="order-terminal-status">{statusLabel(selected.statusCode, selected.status)}</div>}</section>
        <section className="order-detail-section"><h3>Productos</h3>{selected.items.map(({ product, quantity }) => <div className="order-detail-product" key={product.id}><img src={product.image} alt={product.name} /><div><strong>{product.name}</strong><span>{product.category} · {quantity} × S/ {product.price.toFixed(2)}</span></div><strong>S/ {(quantity * product.price).toFixed(2)}</strong></div>)}<div className="order-detail-total"><span>Total</span><strong>S/ {selected.total.toFixed(2)}</strong></div></section>
        <section className="order-detail-section"><h3>Entrega</h3><p>{selected.address}</p>{selected.deliveryAddress.reference && selected.delivery === 'DELIVERY' && <p>Referencia: {selected.deliveryAddress.reference}</p>}</section>
        <section className="order-detail-section"><h3>Comprobante y cliente</h3><p>{selected.receiptType === 'FACTURA' ? 'Factura' : 'Boleta'}{selected.serie && selected.numeroComprobante ? ` ${selected.serie}-${selected.numeroComprobante}` : ''}</p><p>{selected.customer.name} · {selected.customer.documentType}: {selected.customer.documentNumber}</p>{selected.receiptType === 'FACTURA' && <p>{selected.businessName} · RUC {selected.businessRuc}</p>}<p>Pago simulado: {selected.payment}</p></section>
      </div>}
    </section></div>}
  </section>
}
