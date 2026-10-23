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
  const QRCode = await import('qrcode')
  const pdf = new jsPDF()
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = width - margin * 2
  const footerY = height - 12
  const ink: [number, number, number] = [20, 20, 20]
  const muted: [number, number, number] = [80, 80, 80]
  const rule: [number, number, number] = [112, 112, 112]
  const logoUrl = 'https://res.cloudinary.com/dfmveqhud/image/upload/v1790608920/favicon_xv5sdn.svg'
  const storeUrl = 'https://fcreramax.onrender.com'
  const logoResponse = await fetch(logoUrl)
  if (!logoResponse.ok) throw new Error('No se pudo cargar el logo de Ceramax.')
  const logoSvg = await logoResponse.text()
  if (!logoSvg.includes('<svg')) throw new Error('El logo de Ceramax no tiene un formato SVG válido.')
  const logoObjectUrl = URL.createObjectURL(new Blob([logoSvg], { type: 'image/svg+xml' }))
  const logoImage = new Image()
  logoImage.src = logoObjectUrl
  try {
    await logoImage.decode()
  } finally {
    URL.revokeObjectURL(logoObjectUrl)
  }
  const logoCanvas = document.createElement('canvas')
  logoCanvas.width = logoImage.naturalWidth
  logoCanvas.height = logoImage.naturalHeight
  const logoContext = logoCanvas.getContext('2d')
  if (!logoContext) throw new Error('No se pudo preparar el logo para el PDF.')
  logoContext.drawImage(logoImage, 0, 0)
  const logoPng = logoCanvas.toDataURL('image/png')
  const qrImage = await QRCode.toDataURL(storeUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 160,
  })
  let y = 0

  const startPage = (continuation = false) => {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, width, height, 'F')
    const logoX = margin + 2
    const logoY = 6
    const logoWidth = 21
    const logoHeight = 27
    const companyX = logoX + logoWidth + 4
    pdf.addImage(logoPng, 'PNG', logoX, logoY, logoWidth, logoHeight)
    pdf.setTextColor(...ink)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text('CERAMAX PE', companyX, 12)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.text('RUC: 20747598430', companyX, 17)
    pdf.text('Jr. Huallaga 649', companyX, 21)
    pdf.text('ceramax323@gmail.com', companyX, 25)
    pdf.text('fcreramax.onrender.com', companyX, 29)
    const boxX = width - margin - 58
    pdf.setDrawColor(...rule)
    pdf.roundedRect(boxX, 6, 58, 28, 2, 2, 'S')
    pdf.setTextColor(...ink)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(order.receiptType === 'FACTURA' ? 'FACTURA' : 'BOLETA DE VENTA', boxX + 29, 14, { align: 'center' })
    pdf.setFontSize(8)
    pdf.text(
      order.serie && order.numeroComprobante ? `${order.serie}-${order.numeroComprobante}` : `Pedido ${order.code}`,
      boxX + 29,
      23,
      { align: 'center' },
    )
    if (continuation) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6)
      pdf.text('CONTINUACIÓN DEL DETALLE', width / 2, 37, { align: 'center' })
    }
    y = 43
  }

  const drawTableHeader = () => {
    const columns = [margin, margin + 18, margin + 34, width - margin - 65, width - margin - 39, width - margin]
    const top = y
    const bottom = top + 11
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6)
    pdf.setTextColor(...ink)
    pdf.setDrawColor(...rule)
    pdf.rect(columns[0], top, contentWidth, 11)
    for (const x of columns.slice(1, -1)) pdf.line(x, top, x, bottom)
    pdf.text('CANT.', columns[0] + 9, top + 4, { align: 'center' })
    pdf.text('U.M.', columns[1] + 8, top + 4, { align: 'center' })
    pdf.text('DESCRIPCIÓN', columns[2] + 2, top + 7)
    pdf.text('PRECIO UNIT.', columns[4] - 2, top + 4, { align: 'right' })
    pdf.text('IMPORTE (S/)', columns[5] - 2, top + 8, { align: 'right' })
    y = bottom
  }

  const money = (amount: number) => `S/ ${amount.toFixed(2)}`
  const receiptDate = new Date(order.createdAt).toLocaleDateString('es-PE')
  const buyerName = order.receiptType === 'FACTURA' && order.businessName
    ? order.businessName
    : order.customer.name
  const buyerDocument = order.receiptType === 'FACTURA' && order.businessRuc
    ? `RUC: ${order.businessRuc}`
    : `${order.customer.documentType}: ${order.customer.documentNumber}`
  const buyerAddress = [
    order.customer.address,
    order.customer.district,
    order.customer.province,
    order.customer.department,
  ].filter(Boolean).join(', ')
  const buyerAddressLines = pdf.splitTextToSize(buyerAddress || 'No registrada', 95)

  startPage()
  const customerBoxHeight = 21 + buyerAddressLines.length * 3
  pdf.setDrawColor(...rule)
  pdf.roundedRect(margin, y, contentWidth, customerBoxHeight, 3, 3, 'S')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(...ink)
  pdf.text('CLIENTE', margin + 2, y + 4)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(pdf.splitTextToSize(buyerName, 108), margin + 15, y + 5)
  pdf.setFontSize(7)
  pdf.text(buyerDocument, margin + 15, y + 10)
  pdf.text(['Dirección:', ...buyerAddressLines], margin + 15, y + 15)
  pdf.text(`Correo: ${order.customer.email}`, margin + 15, y + 15 + buyerAddressLines.length * 3)
  pdf.text('Fecha de emisión:', width - margin - 58, y + 6)
  pdf.setFont('helvetica', 'bold')
  pdf.text(receiptDate, width - margin - 2, y + 6, { align: 'right' })
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Pedido: ${order.code}`, width - margin - 58, y + 12)
  pdf.setFont('helvetica', 'bold')
  pdf.text(order.code, width - margin - 2, y + 12, { align: 'right' })
  pdf.setFont('helvetica', 'normal')
  pdf.text('Teléfono:', width - margin - 58, y + 18)
  pdf.setFont('helvetica', 'bold')
  pdf.text(order.customer.phone || 'No registrado', width - margin - 2, y + 18, { align: 'right' })
  y += customerBoxHeight + 3

  const observation = order.delivery === 'DELIVERY'
    ? [
        `Entrega a domicilio${order.address ? ` · ${order.address}` : ''}`,
        `Recibe: ${order.deliveryRecipient || order.customer.name} · Teléfono: ${order.deliveryPhone || order.customer.phone}`,
        ...(order.deliveryAddress.reference ? [`Referencia: ${order.deliveryAddress.reference}`] : []),
      ]
    : [
        `Recojo en tienda${order.storeBranchName || order.storeBranchAddress ? ` · ${order.storeBranchName} ${order.storeBranchAddress}`.trim() : order.address}`,
        `Recibe: ${order.deliveryRecipient || order.customer.name} · Teléfono: ${order.deliveryPhone || order.customer.phone}`,
      ]
  const observationLines = observation.flatMap((line) => pdf.splitTextToSize(line, contentWidth - 31))
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.text('OBSERVACIONES', margin, y + 3)
  pdf.setFont('helvetica', 'normal')
  pdf.text([...observationLines, `Medio seleccionado: ${order.payment}`], margin + 31, y + 3)
  y += Math.max(8, (observationLines.length + 1) * 3 + 3)

  drawTableHeader()
  const rowStartX = margin
  const columns = [margin, margin + 18, margin + 34, width - margin - 65, width - margin - 39, width - margin]
  for (const { product, quantity } of order.items) {
    const description = pdf.splitTextToSize(`${product.name}${product.category ? ` · ${product.category}` : ''}`, columns[3] - columns[2] - 4)
    const rowHeight = Math.max(8, description.length * 3.5 + 3)
    if (y + rowHeight > footerY - 51) {
    pdf.addPage()
    startPage(true)
    drawTableHeader()
    }
    pdf.setDrawColor(...rule)
    for (const x of columns) pdf.line(x, y, x, y + rowHeight)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(...ink)
    pdf.text(description, columns[2] + 2, y + 4)
    pdf.text(String(quantity), columns[0] + 16, y + 4, { align: 'right' })
    pdf.text('UND', columns[1] + 8, y + 4, { align: 'center' })
    pdf.text(product.price.toFixed(2), columns[4] - 2, y + 4, { align: 'right' })
    pdf.setFont('helvetica', 'bold')
    pdf.text((quantity * product.price).toFixed(2), columns[5] - 2, y + 4, { align: 'right' })
    y += rowHeight
  }

  const totalsY = footerY - 43
  if (y + 5 > totalsY) {
    pdf.addPage()
    startPage(true)
    drawTableHeader()
  }
  const tableBottom = totalsY - 8
  if (y < tableBottom) {
    pdf.setDrawColor(...rule)
    pdf.line(rowStartX, y, rowStartX, tableBottom)
    for (const x of columns.slice(1, -1)) pdf.line(x, y, x, tableBottom)
    pdf.line(width - margin, y, width - margin, tableBottom)
    pdf.line(rowStartX, tableBottom, width - margin, tableBottom)
  }

  const totals = [
    ['Subtotal', order.subtotal ?? order.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0)],
    ...(order.couponDiscount && order.couponDiscount > 0
    ? [[`Descuento${order.couponCode ? ` (${order.couponCode})` : ''}`, -order.couponDiscount] as [string, number]]
    : []),
    ['IGV', order.igv ?? 0],
    ['Envío', order.shippingCost ?? 0],
  ] as [string, number][]
  y = totalsY
  const qrSize = 25
  pdf.addImage(qrImage, 'PNG', margin + 2, y + 4, qrSize, qrSize)
  pdf.link(margin + 2, y + 4, qrSize, qrSize, { url: storeUrl })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.setTextColor(...muted)
  pdf.text('Visita nuestra tienda', margin + 2, y + 32)
  const totalX = width - margin - 78
  for (const [label, amount] of totals) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(...muted)
    pdf.text(label, totalX, y)
    pdf.setTextColor(...ink)
    pdf.text(money(amount), width - margin, y, { align: 'right' })
    y += 5
  }
  pdf.setDrawColor(...rule)
  pdf.line(totalX, y - 2, width - margin, y - 2)
  y += 3
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...ink)
  pdf.text('TOTAL', totalX, y + 1)
  pdf.text(money(order.total), width - margin, y + 1, { align: 'right' })

  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page)
    pdf.setDrawColor(...rule)
    pdf.line(margin, footerY - 4, width - margin, footerY - 4)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(...muted)
    pdf.text('No se realizó un cobro real.', margin, footerY)
    pdf.text(`Página ${page} de ${pageCount}`, width - margin, footerY, { align: 'right' })
  }
  pdf.save(`${order.receiptType.toLowerCase()}-${order.code}.pdf`)
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
          <button className="button button-light order-download-button" type="button" onClick={() => void handleDownload(order)}>Descargar {order.receiptType === 'FACTURA' ? 'factura' : 'boleta'}</button>
        </article>)}</div>
        {pages > 1 && <nav className="orders-pagination" aria-label="Paginación de pedidos"><button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Anterior</button><span>Página {page + 1} de {pages} · {filtered.length} pedidos</span><button type="button" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>Siguiente</button></nav>}
      </>}
    </>}
    {selected && <div className="auth-modal-backdrop order-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSelected() }}><section className="order-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
      <button className="dialog-close" type="button" aria-label="Cerrar detalle" onClick={closeSelected}>×</button>
      <header className="order-detail-heading"><p className="eyebrow">Seguimiento de compra</p><h2 id="order-detail-title">Pedido {selected.code}</h2><div className={`order-status order-status-${selected.statusCode.toLowerCase()}`}><span />{statusLabel(selected.statusCode, selected.status)}</div><p>{new Date(selected.createdAt).toLocaleString('es-PE')}</p><button className="button button-dark order-detail-download" type="button" onClick={() => void handleDownload(selected)}>Descargar {selected.receiptType === 'FACTURA' ? 'factura' : 'boleta'}</button>{error && <p className="order-pdf-error" role="alert">{error}</p>}</header>
      {selectedLoading ? <div className="customer-empty" role="status"><p>Cargando detalle del pedido…</p></div> : <div className="order-detail-content">
        <section className="order-detail-section"><h3>Estado del pedido</h3>{['PENDIENTE_PAGO', 'PREPARACION', selected.delivery === 'DELIVERY' ? 'LISTO_DESPACHO' : 'LISTO_PARA_RECOGER', ...(selected.delivery === 'DELIVERY' ? ['EN_RUTA'] : []), 'COMPLETADA'].map((step, index, steps) => {
          const current = selected.statusCode === 'EN_CAMINO' ? 'EN_RUTA' : selected.statusCode
          const active = Math.max(0, steps.indexOf(current))
          const terminal = ['CANCELADO', 'NO_ENTREGADA'].includes(selected.statusCode)
          const done = selected.statusCode === 'COMPLETADA' || (!terminal && index < active)
          return <div className={`order-timeline-step${done ? ' is-complete' : ''}${!terminal && (index === active || selected.statusCode === 'COMPLETADA' && index === steps.length - 1) ? ' is-current' : ''}`} key={step}><span className="order-timeline-marker">{done ? '✓' : index + 1}</span><div><strong>{statusLabel(step, step)}</strong></div></div>
        })}{['CANCELADO', 'NO_ENTREGADA'].includes(selected.statusCode) && <div className="order-terminal-status">{statusLabel(selected.statusCode, selected.status)}</div>}</section>
        <section className="order-detail-section">
          <h3>Productos</h3>
          {selected.items.map(({ product, quantity }) => (
            <div className="order-detail-product" key={product.id}>
              <img src={product.image} alt={product.name} />
              <div>
                <strong>{product.name}</strong>
                <span>{product.category} · {quantity} × S/ {product.price.toFixed(2)}</span>
              </div>
              <strong>S/ {(quantity * product.price).toFixed(2)}</strong>
            </div>
          ))}
          {selected.couponDiscount != null && selected.couponDiscount > 0 && (
            <div className="order-detail-total">
              <span>Descuento{selected.couponCode ? ` · ${selected.couponCode}` : ''}</span>
              <strong>− S/ {selected.couponDiscount.toFixed(2)}</strong>
            </div>
          )}
          <div className="order-detail-total">
            <span>Total</span>
            <strong>S/ {selected.total.toFixed(2)}</strong>
          </div>
        </section>
        <section className="order-detail-section"><h3>Entrega</h3><p>{selected.address}</p>{selected.deliveryAddress.reference && selected.delivery === 'DELIVERY' && <p>Referencia: {selected.deliveryAddress.reference}</p>}</section>
        <section className="order-detail-section"><h3>Comprobante y cliente</h3><p>{selected.receiptType === 'FACTURA' ? 'Factura' : 'Boleta'}{selected.serie && selected.numeroComprobante ? ` ${selected.serie}-${selected.numeroComprobante}` : ''}</p><p>{selected.customer.name} · {selected.customer.documentType}: {selected.customer.documentNumber}</p>{selected.receiptType === 'FACTURA' && <p>{selected.businessName} · RUC {selected.businessRuc}</p>}<p>Medio seleccionado: {selected.payment}</p></section>
      </div>}
    </section></div>}
  </section>
}
