import './CouponAnnouncer.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchCouponAnnouncements, type CouponAnnouncement } from '../../services/couponApi'

/** Vistas donde el cliente toma decisiones de compra: ahí reaparece el anuncio. */
const IMPORTANT_VIEWS = [/^\/$/, /^\/productos/, /^\/categorias?(\/|$)/, /^\/producto\//, /^\/carrito/, /^\/checkout/, /^\/cupones$/]

const SHOW_DELAY_MS = 1400
const MIN_GAP_MS = 4000
const EXIT_MS = 340

function isImportant(pathname: string) {
  return IMPORTANT_VIEWS.some((pattern) => pattern.test(pathname))
}

function formatValue(coupon: CouponAnnouncement) {
  return coupon.tipoDescuento === 'PORCENTAJE'
    ? { big: `-${coupon.valor}%`, text: `${coupon.valor}% de descuento` }
    : { big: `S/ ${Number.isInteger(coupon.valor) ? coupon.valor : coupon.valor.toFixed(2)}`, text: `S/ ${coupon.valor.toFixed(2)} de descuento` }
}

function formatExpiry(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return ` · Vence el ${date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`
}

/**
 * Anuncio de cupón: aparece unos segundos, se va solo y vuelve a aparecer al entrar a otra
 * vista importante (inicio, productos, categorías, detalle, carrito, checkout).
 */
export function CouponAnnouncer() {
  const { pathname } = useLocation()
  const [coupons, setCoupons] = useState<CouponAnnouncement[]>([])
  const [shown, setShown] = useState<CouponAnnouncement | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [paused, setPaused] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const cursor = useRef(0)
  const lastHiddenAt = useRef(0)
  const exitTimer = useRef(0)
  const copyTimer = useRef(0)

  useEffect(() => {
    let active = true
    void fetchCouponAnnouncements()
      .then((items) => { if (active) setCoupons(items) })
      .catch((error: unknown) => { console.error('No se pudieron cargar los anuncios de cupones.', error) })
    return () => { active = false }
  }, [])

  const hide = useCallback(() => {
    window.clearTimeout(copyTimer.current)
    setLeaving(true)
    window.clearTimeout(exitTimer.current)
    exitTimer.current = window.setTimeout(() => {
      setShown(null)
      setLeaving(false)
      setPaused(false)
      lastHiddenAt.current = Date.now()
    }, EXIT_MS)
  }, [])

  // Cada vez que cambia la vista: si es importante, se programa el anuncio; si no, se retira.
  useEffect(() => {
    window.clearTimeout(exitTimer.current)
    if (!isImportant(pathname) || !coupons.length) {
      setShown((current) => { if (current) lastHiddenAt.current = Date.now(); return null })
      setLeaving(false)
      return
    }
    const sinceHidden = Date.now() - lastHiddenAt.current
    const delay = Math.max(SHOW_DELAY_MS, MIN_GAP_MS - sinceHidden)
    const timer = window.setTimeout(() => {
      const next = coupons[cursor.current % coupons.length]
      cursor.current += 1
      setCopied(false)
      setCopyError(false)
      setLeaving(false)
      setShown(next)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [pathname, coupons])

  useEffect(() => () => { window.clearTimeout(exitTimer.current); window.clearTimeout(copyTimer.current) }, [])

  async function copyCode() {
    if (!shown) return
    try {
      await navigator.clipboard.writeText(shown.codigo)
      setCopied(true)
      setCopyError(false)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(hide, 2200)
    } catch (error) {
      console.error('No se pudo copiar el código del cupón.', error)
      setCopyError(true)
    }
  }

  if (!shown) return null
  const value = formatValue(shown)
  const inCart = pathname.startsWith('/carrito')
  const inCheckout = pathname.startsWith('/checkout')

  return (
    <aside
      className={`ca${leaving ? ' ca-leaving' : ''}`}
      role="status"
      aria-label="Cupón de descuento disponible"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="ca-ticket">
        <div className="ca-stub" aria-hidden="true">
          <b>{value.big}</b>
          <span>dscto.</span>
        </div>
        <div className="ca-body">
          <button className="ca-close" type="button" aria-label="Cerrar anuncio de cupón" onClick={hide}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
          </button>
          <strong className="ca-title">{shown.titulo}</strong>
          <p className="ca-message">{shown.mensaje}</p>
          <small className="ca-terms">
            {value.text}
            {shown.compraMinima > 0 && ` · Desde S/ ${shown.compraMinima.toFixed(2)}`}
            {` · Hasta ${shown.limitePorCliente} ${shown.limitePorCliente === 1 ? 'uso' : 'usos'} por cliente`}
            {formatExpiry(shown.venceEn)}
          </small>
          <div className="ca-row">
            <button className={`ca-code${copied ? ' is-copied' : ''}`} type="button" onClick={() => void copyCode()} aria-label={`Copiar código ${shown.codigo}`}>
              <b>{shown.codigo}</b>
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
            {inCheckout
              ? <span className="ca-hint">Pégalo en “Código de cupón”</span>
              : <Link className="ca-link" to={inCart ? '/checkout' : '/carrito'}>{inCart ? 'Ir a pagar' : 'Ver carrito'} <span aria-hidden="true">→</span></Link>}
            <Link className="ca-link ca-all-link" to="/cupones">Ver cupones</Link>
          </div>
          {copyError && <small className="ca-error" role="alert">Copia el código manualmente para usarlo al pagar.</small>}
        </div>
        {!leaving && !copied && <i className={`ca-progress${paused ? ' is-paused' : ''}`} onAnimationEnd={hide} aria-hidden="true" />}
      </div>
    </aside>
  )
}
