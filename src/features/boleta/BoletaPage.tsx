import { ArrowLeft, Download, FileText } from 'lucide-react'
import { StorePageLayout } from '../../components/layout/StorePageLayout'
import { formatPrice } from '../../lib/format'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'
import { useReceipt } from './hooks/useReceipt'
import styles from './BoletaPage.module.css'

export function BoletaPage({ orderId }: { orderId: string }) {
  const store = useStorefrontContext()
  const receipt = useReceipt(store.session, orderId)
  const paymentApproved = receipt.order?.pagos?.some((payment) => payment.estado === 'APROBADO') ?? false

  return (
    <StorePageLayout>
      <section className={styles.page}>
        <button type="button" onClick={() => store.navigate('/miperfil')} className={styles.back}><ArrowLeft size={16} /> Volver a mi perfil</button>
        <p className="eyebrow">Comprobante de compra</p>
        <h1 className={styles.title}>Boleta / factura</h1>
        {receipt.loading ? <p className={styles.info}>Cargando los datos del pedido…</p> : receipt.error ? (
          <p className={styles.error} role="alert">{receipt.error}</p>
        ) : receipt.order ? (
          <article className={styles.receipt}>
            <div className={styles.receiptHeader}>
              <div><FileText size={22} /><span>{receipt.order.tipoComprobante}</span></div>
              <strong>{receipt.order.serie && receipt.order.numeroComprobante ? `${receipt.order.serie}-${receipt.order.numeroComprobante}` : receipt.order.codigo}</strong>
            </div>
            <p className={styles.orderNumber}>Pedido {receipt.order.codigo} · {new Date(receipt.order.createdAt).toLocaleDateString('es-PE')}</p>
            <div className={styles.items}>
              {receipt.order.detalles.map((item) => (
                <div key={item.id}><span>{item.productoNombre} <small>× {item.cantidad}</small></span><strong>{formatPrice(item.subtotal)}</strong></div>
              ))}
            </div>
            <dl className={styles.total}>
              <div><dt>Subtotal</dt><dd>{formatPrice(receipt.order.subtotal)}</dd></div>
              <div><dt>Envío</dt><dd>{formatPrice(receipt.order.costoEnvio)}</dd></div>
              <div className={styles.grandTotal}><dt>Total</dt><dd>{formatPrice(receipt.order.total)}</dd></div>
            </dl>
            <p className={styles.status}>Estado del pedido: <strong>{receipt.order.estadoNombre || receipt.order.estadoCodigo}</strong></p>
            <p className={styles.status}>Pago: <strong>{paymentApproved ? 'Aprobado' : 'Pendiente'}</strong></p>
            <button type="button" onClick={() => void receipt.download()} disabled={!paymentApproved || receipt.downloading} title={!paymentApproved ? 'El comprobante estará disponible cuando se apruebe el pago.' : undefined} className="primary-button mt-6 inline-flex items-center gap-2 disabled:opacity-50">
              <Download size={16} /> {receipt.downloading ? 'Descargando…' : 'Descargar PDF'}
            </button>
            <p className={styles.disclaimer}>El PDF es informativo; no reemplaza un comprobante tributario electrónico emitido ante SUNAT.</p>
          </article>
        ) : null}
      </section>
    </StorePageLayout>
  )
}
