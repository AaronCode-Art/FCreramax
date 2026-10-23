import './CuponesPage.css'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import { useStore } from '../../context/StoreContext'
import { fetchCouponAnnouncements, type CouponAnnouncement } from '../../services/couponApi'

function formatDiscount(coupon: CouponAnnouncement) {
  return coupon.tipoDescuento === 'PORCENTAJE'
    ? `${coupon.valor}%`
    : `S/ ${coupon.valor.toFixed(2)}`
}

function formatExpiry(value: string | null) {
  if (!value) return 'Sin fecha de vencimiento publicada'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha de vencimiento no disponible'
    : `Válido hasta ${date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

export default function CuponesPage() {
  const { customer, orders, ordersLoading, ordersError, loadOrderDetails, openAuth } = useStore()
  const [coupons, setCoupons] = useState<CouponAnnouncement[]>([])
  const [couponsLoading, setCouponsLoading] = useState(true)
  const [couponsError, setCouponsError] = useState('')
  const [usageResult, setUsageResult] = useState<{
    key: string
    usageByCode: Record<string, number>
    error: string
  } | null>(null)
  const [copiedCode, setCopiedCode] = useState('')
  const orderIds = useMemo(() => orders.map((order) => order.id).join('|'), [orders])
  const usageKey = customer ? `${customer.id ?? customer.email}:${orderIds}` : ''
  const usageLoading = Boolean(customer && (ordersLoading || (!ordersError && usageResult?.key !== usageKey)))
  const usageError = ordersError
    ? 'No se pudo revisar el uso de cupones de tu cuenta. Inténtalo de nuevo más tarde.'
    : usageResult?.key === usageKey ? usageResult.error : ''
  const usageByCode = usageResult?.key === usageKey ? usageResult.usageByCode : {}

  useEffect(() => {
    let active = true
    void fetchCouponAnnouncements().then((result) => {
      if (active) setCoupons(result)
    }).catch((error: unknown) => {
      console.error('No se pudieron cargar los cupones disponibles.', error)
      if (active) setCouponsError(error instanceof Error ? error.message : 'No se pudieron cargar los cupones.')
    }).finally(() => {
      if (active) setCouponsLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!customer || ordersLoading || ordersError) return

    let active = true
    void (async () => {
      const usage: Record<string, number> = {}
      try {
        for (let index = 0; index < orders.length; index += 5) {
          const batch = await Promise.all(orders.slice(index, index + 5).map((order) => loadOrderDetails(order.id)))
          for (const order of batch) {
            if (order.couponCode) {
              const code = order.couponCode.toLocaleUpperCase('es')
              usage[code] = (usage[code] ?? 0) + 1
            }
          }
        }
        if (active) setUsageResult({ key: usageKey, usageByCode: usage, error: '' })
      } catch (error) {
        console.error('No se pudo verificar el uso de cupones de la cuenta.', error)
        if (active) {
          setUsageResult({
            key: usageKey,
            usageByCode: {},
            error: 'No se pudo revisar el uso de cupones de tu cuenta. Inténtalo de nuevo más tarde.',
          })
        }
      }
    })()
    return () => { active = false }
  }, [customer, loadOrderDetails, orderIds, orders, ordersError, ordersLoading, usageKey])

  async function copyCoupon(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      window.setTimeout(() => setCopiedCode((current) => current === code ? '' : current), 1800)
    } catch (error) {
      console.error('No se pudo copiar el código del cupón.', error)
      setCopiedCode('')
    }
  }

  return (
    <section className="coupons-page page-shell">
      <PageIntro eyebrow="Beneficios Cerámax" title="Cupones para tu próxima compra">
        Revisa los descuentos vigentes, sus condiciones y el límite de uso disponible para tu cuenta.
      </PageIntro>
      {!customer && <div className="coupons-account-note">
        <span>Inicia sesión para consultar cuántos usos personales te quedan.</span>
        <button className="text-link" type="button" onClick={() => openAuth('login')}>Iniciar sesión <span aria-hidden="true">→</span></button>
      </div>}
      {usageError && <p className="coupons-error" role="alert">{usageError}</p>}
      {couponsError && <p className="coupons-error" role="alert">{couponsError}</p>}
      {couponsLoading ? (
        <p className="coupons-status" role="status">Cargando cupones vigentes…</p>
      ) : coupons.length ? (
        <div className="coupons-grid">
          {coupons.map((coupon) => {
            const used = usageByCode[coupon.codigo.toLocaleUpperCase('es')] ?? 0
            const limitReached = Boolean(customer && !usageError && !usageLoading && used >= coupon.limitePorCliente)
            const usageUnknown = Boolean(customer && (usageLoading || usageError))
            return (
              <article className={`coupon-card${limitReached ? ' coupon-card-used' : ''}`} key={coupon.codigo}>
                <div className="coupon-card-ribbon">
                  <span>{limitReached ? 'Límite alcanzado' : 'Cupón disponible'}</span>
                  <strong>{formatDiscount(coupon)}</strong>
                  <small>{coupon.tipoDescuento === 'PORCENTAJE' ? 'de descuento' : 'de descuento'}</small>
                </div>
                <div className="coupon-card-content">
                  <p className="eyebrow">{coupon.titulo}</p>
                  <h2>{coupon.mensaje || 'Aprovecha este descuento en tu compra.'}</h2>
                  <ul>
                    {coupon.compraMinima > 0 && <li>Compra mínima: <strong>S/ {coupon.compraMinima.toFixed(2)}</strong></li>}
                    <li>Válido hasta: <strong>{formatExpiry(coupon.venceEn).replace('Válido hasta ', '')}</strong></li>
                    <li>Límite por cliente: <strong>{coupon.limitePorCliente} {coupon.limitePorCliente === 1 ? 'uso' : 'usos'}</strong></li>
                    {customer && !usageError && !usageLoading && <li>Usos realizados: <strong>{Math.min(used, coupon.limitePorCliente)} de {coupon.limitePorCliente}</strong></li>}
                    {usageUnknown && <li className="coupon-usage-pending">{usageLoading ? 'Verificando el uso en tu cuenta…' : 'No se pudo verificar tu límite personal.'}</li>}
                  </ul>
                  <div className="coupon-card-actions">
                    <code>{coupon.codigo}</code>
                    <button
                      type="button"
                      disabled={limitReached || usageUnknown}
                      onClick={() => void copyCoupon(coupon.codigo)}
                    >
                      {limitReached ? 'Ya utilizado' : copiedCode === coupon.codigo ? '¡Copiado!' : 'Copiar código'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : !couponsError ? (
        <div className="coupons-empty">
          <span aria-hidden="true">✳</span>
          <h2>Por ahora no hay cupones vigentes</h2>
          <p>Vuelve pronto o explora los productos de la tienda.</p>
          <Link className="button button-dark" to="/productos">Ver productos</Link>
        </div>
      ) : null}
    </section>
  )
}
