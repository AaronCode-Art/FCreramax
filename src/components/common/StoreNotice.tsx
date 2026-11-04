import './StoreNotice.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { AlertIcon, CheckIcon, InfoIcon } from '../ui/Icons'

const EXIT_MS = 260

/**
 * Aviso temporal. Pensado para personas que leen despacio: dura más, se detiene mientras se lee
 * (cursor encima o foco dentro), no tapa la cabecera y las acciones tienen nombre propio.
 */
export function StoreNotice() {
  const { noticeState } = useStore()
  // Cada aviso nuevo es una tarjeta nueva: su temporizador y su estado de cierre empiezan de cero.
  return noticeState.message ? <NoticeCard key={noticeState.id} /> : null
}

function NoticeCard() {
  const { noticeState, setNotice } = useStore()
  const { id, message, tone, action, duration } = noticeState
  const [closing, setClosing] = useState(false)
  const exitTimer = useRef<number | null>(null)

  const dismiss = useCallback(() => {
    setClosing(true)
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
    exitTimer.current = window.setTimeout(() => {
      setNotice('')
      exitTimer.current = null
    }, EXIT_MS)
  }, [setNotice])

  useEffect(() => {
    if (!message || closing) return
    const timer = window.setTimeout(dismiss, duration)
    return () => window.clearTimeout(timer)
  }, [id, message, closing, duration, dismiss])

  useEffect(() => () => {
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current)
  }, [])

  if (!message) return null
  const Icon = tone === 'success' ? CheckIcon : tone === 'warning' ? AlertIcon : InfoIcon
  const actionNode = action && (action.to
    ? <Link className="notice-action" to={action.to} onClick={dismiss}>{action.label}</Link>
    : <button className="notice-action" type="button" onClick={() => { action.onClick?.(); dismiss() }}>{action.label}</button>)

  return (
    <div
      className={`notice notice-${tone}${closing ? ' notice-closing' : ''}`}
      role={tone === 'warning' ? 'alert' : 'status'}
      aria-live={tone === 'warning' ? 'assertive' : 'polite'}
    >
      <span className="notice-indicator" aria-hidden="true"><Icon /></span>
      <p className="notice-message">{message}</p>
      {actionNode}
      <button className="notice-close" type="button" aria-label="Cerrar aviso" onClick={dismiss}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
  )
}
