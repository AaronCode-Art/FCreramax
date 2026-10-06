import { CalendarDays, Check, ChevronDown, FileText, PackageCheck, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatPrice } from '../../../lib/format'
import type { PedidoResponse } from '../../../types/orders'
import styles from './OrderHistorySection.module.css'

interface OrderHistorySectionProps {
  orders: PedidoResponse[]
  loading: boolean
  error: string
  downloadingOrderId: string | null
  onRefresh: () => void
  onDownloadReceipt: (order: PedidoResponse) => void
  onViewReceipt: (order: PedidoResponse) => void
}

function formatOrderDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function orderDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function statusStyle(status: string) {
  if (status === 'COMPLETADA') return styles.complete
  if (status === 'CANCELADO' || status === 'NO_ENTREGADA') return styles.failed
  if (status === 'EN_RUTA' || status === 'EN_CAMINO') return styles.inTransit
  return styles.active
}

function orderProgress(order: PedidoResponse) {
  return order.tipoEntrega === 'RECOJO_TIENDA'
    ? [
      { status: 'PENDIENTE_PAGO', label: 'Pendiente' },
      { status: 'LISTO_PARA_RECOGER', label: 'Listo para recoger' },
      { status: 'COMPLETADA', label: 'Entregado' },
    ]
    : [
      { status: 'PENDIENTE_PAGO', label: 'Pendiente' },
      { status: 'LISTO_DESPACHO', label: 'Preparado' },
      { status: 'EN_RUTA', label: 'En ruta' },
      { status: 'EN_CAMINO', label: 'En camino' },
      { status: 'COMPLETADA', label: 'Entregado' },
    ]
}

export function OrderHistorySection({
  orders,
  loading,
  error,
  downloadingOrderId,
  onRefresh,
  onDownloadReceipt,
  onViewReceipt,
}: OrderHistorySectionProps) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    return [...orders]
      .filter((order) => {
        const matchesNumber = !query || order.codigo.toLocaleLowerCase('es').includes(query)
        const date = orderDate(order.createdAt)
        return matchesNumber && (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo)
      })
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
  }, [dateFrom, dateTo, orders, search])

  return (
    <section className={styles.section} aria-labelledby="orders-title">
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">Tus compras</p>
          <h2 id="orders-title">Mis pedidos <span>({filteredOrders.length}{filteredOrders.length !== orders.length ? ` de ${orders.length}` : ''})</span></h2>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} aria-label="Actualizar pedidos">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {!loading && orders.length > 0 && (
        <div className={styles.filters} aria-label="Buscar pedidos">
          <label className={styles.searchField}>
            <Search size={16} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Buscar por número de pedido</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Número de pedido"
            />
          </label>
          <label className={styles.dateField}>
            <CalendarDays size={15} aria-hidden="true" />
            <span>Desde</span>
            <input type="date" aria-label="Desde la fecha" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className={styles.dateField}>
            <CalendarDays size={15} aria-hidden="true" />
            <span>Hasta</span>
            <input type="date" aria-label="Hasta la fecha" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          {(search || dateFrom || dateTo) && (
            <button type="button" className={styles.clearFilters} onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}>
              Limpiar
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className={styles.empty} role="status">Cargando tus pedidos…</div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>
          <PackageCheck size={25} />
          <h3>Aún no tienes pedidos</h3>
          <p>Cuando realices una compra, podrás seguirla desde aquí.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.empty}>
          <PackageCheck size={25} />
          <h3>No encontramos pedidos</h3>
          <p>Prueba con otro número o cambia el rango de fechas.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredOrders.map((order) => {
            const approvedPayment = order.pagos?.find((payment) => payment.estado === 'APROBADO')
            const receiptNumber = order.serie && order.numeroComprobante
              ? `${order.serie}-${order.numeroComprobante}`
              : null
            const steps = orderProgress(order)
            const currentStatus = order.estadoCodigo === 'PREPARACION' ? 'PENDIENTE_PAGO' : order.estadoCodigo
            const currentStep = steps.findIndex(({ status }) => status === currentStatus)
            const terminalFailure = order.estadoCodigo === 'CANCELADO' || order.estadoCodigo === 'NO_ENTREGADA'
            const failureLabel = order.estadoCodigo === 'NO_ENTREGADA'
              ? 'No se pudo entregar'
              : order.estadoNombre || 'Pedido cancelado'
            const expanded = expandedOrderId === order.id
            return (
              <article key={order.id} className={styles.order}>
                <button
                  type="button"
                  className={styles.orderToggle}
                  aria-expanded={expanded}
                  aria-controls={`order-details-${order.id}`}
                  onClick={() => setExpandedOrderId(expanded ? null : order.id)}
                >
                  <span className={styles.orderSummary}>
                    <span className={styles.orderIdentity}>
                      <strong>Pedido {order.codigo}</strong>
                      <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
                    </span>
                    <span className={styles.orderSummaryMeta}>
                      <span className={`${styles.status} ${statusStyle(order.estadoCodigo)}`}>
                        {order.estadoNombre || order.estadoCodigo.replaceAll('_', ' ')}
                      </span>
                      <strong className={styles.summaryTotal}>{formatPrice(order.total)}</strong>
                    </span>
                  </span>
                  <ChevronDown size={18} className={`${styles.expandIcon} ${expanded ? styles.expandedIcon : ''}`} aria-hidden="true" />
                </button>

                {expanded && (
                  <div id={`order-details-${order.id}`} className={styles.orderDetails}>
                    <div className={styles.paymentInfo}>
                      <span className={approvedPayment ? styles.paid : styles.unpaid}>
                        {approvedPayment ? 'Pago aprobado' : 'Pago pendiente'}
                      </span>
                      {approvedPayment && <span>{approvedPayment.metodoPago}</span>}
                      <span>{order.tipoEntrega === 'DELIVERY' ? 'Delivery' : 'Recojo en tienda'}</span>
                      <span>{order.tipoComprobante}{receiptNumber ? ` · ${receiptNumber}` : ''}</span>
                    </div>

                    {terminalFailure ? (
                      <p className={styles.failureMessage}>{failureLabel}</p>
                    ) : currentStep >= 0 ? (
                      <ol className={styles.progress} aria-label="Seguimiento del pedido">
                        {steps.map((step, index) => (
                          <li
                            key={step.status}
                            className={index < currentStep ? styles.pastStep : index === currentStep ? styles.currentStep : ''}
                          >
                            <span>{index < currentStep ? <Check size={12} /> : index + 1}</span>
                            <span>{step.label}</span>
                            {index === currentStep && <small>Estado actual</small>}
                          </li>
                        ))}
                      </ol>
                    ) : null}

                    <div className={styles.products}>
                      <h3>Productos del pedido</h3>
                      {order.detalles?.map((detail) => (
                        <div key={detail.id} className={styles.productLine}>
                          <span>
                            <strong>{detail.productoNombre}</strong>
                            <small>{detail.productoCodigo} · {detail.categoriaNombre} · {detail.cantidad} × {formatPrice(detail.precioUnitario)}</small>
                          </span>
                          <strong>{formatPrice(detail.subtotal)}</strong>
                        </div>
                      ))}
                    </div>

                    <div className={styles.detailColumns}>
                      <section className={styles.detailBlock}>
                        <h3>Entrega</h3>
                        {order.datosEntrega ? (
                          <>
                            <p><strong>{order.datosEntrega.destinatario || 'Destinatario'}</strong></p>
                            {order.datosEntrega.telefono && <p>{order.datosEntrega.telefono}</p>}
                            {order.tipoEntrega === 'RECOJO_TIENDA' ? (
                              <>
                                {order.datosEntrega.sucursalNombre && <p>{order.datosEntrega.sucursalNombre}</p>}
                                {order.datosEntrega.sucursalDireccion && <p>{order.datosEntrega.sucursalDireccion}</p>}
                              </>
                            ) : (
                              <>
                                {order.datosEntrega.direccion && <p>{order.datosEntrega.direccion}</p>}
                                <p>{[order.datosEntrega.distrito, order.datosEntrega.provincia, order.datosEntrega.departamento].filter(Boolean).join(', ')}</p>
                                {order.datosEntrega.referencia && <p>Referencia: {order.datosEntrega.referencia}</p>}
                              </>
                            )}
                          </>
                        ) : <p>Sin datos de entrega registrados.</p>}
                      </section>
                      <section className={styles.detailBlock}>
                        <h3>Pagos</h3>
                        {order.pagos?.length ? order.pagos.map((payment) => (
                          <p key={payment.id}>
                            {payment.metodoPago} · {payment.estado} · {formatPrice(payment.monto)}
                            {payment.fechaPago && <small>{` · ${formatOrderDate(payment.fechaPago)}`}</small>}
                          </p>
                        )) : <p>No hay pagos registrados.</p>}
                      </section>
                    </div>

                    <dl className={styles.totalBreakdown}>
                      <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
                      {order.descuentoCupon > 0 && <div><dt>Descuento</dt><dd>-{formatPrice(order.descuentoCupon)}</dd></div>}
                      <div><dt>IGV</dt><dd>{formatPrice(order.igv)}</dd></div>
                      <div><dt>Envío</dt><dd>{formatPrice(order.costoEnvio)}</dd></div>
                      <div className={styles.totalRow}><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
                    </dl>

                    <footer className={styles.orderFooter}>
                      <button type="button" onClick={() => onViewReceipt(order)}>
                        Ver comprobante
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadReceipt(order)}
                        disabled={!approvedPayment || downloadingOrderId === order.id}
                        title={!approvedPayment ? 'El comprobante estará disponible cuando se apruebe el pago.' : 'Descargar PDF'}
                      >
                        <FileText size={16} />
                        {downloadingOrderId === order.id ? 'Descargando…' : 'Descargar PDF'}
                      </button>
                    </footer>
                    <p className={styles.disclaimer}>PDF informativo; no reemplaza un comprobante tributario electrónico emitido ante SUNAT.</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
