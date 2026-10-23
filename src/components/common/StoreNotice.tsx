import './StoreNotice.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../../context/StoreContext'

export function StoreNotice() {
  const { notice, setNotice } = useStore()
  const [closing, setClosing] = useState(false)
  const timeout = useRef<number | null>(null)

  const dismiss = useCallback(() => {
    setClosing(true)
    if (timeout.current !== null) window.clearTimeout(timeout.current)
    timeout.current = window.setTimeout(() => {
      setNotice('')
      timeout.current = null
    }, 450)
  }, [setNotice])

  useEffect(() => {
    if (!notice) return
    setClosing(false)
    const autoDismiss = window.setTimeout(dismiss, 4550)
    return () => {
      window.clearTimeout(autoDismiss)
      if (timeout.current !== null) {
        window.clearTimeout(timeout.current)
        timeout.current = null
      }
    }
  }, [notice, dismiss])

  if (!notice) return null
  return (
    <div className={`notice${closing ? ' notice-closing' : ''}`} role="status" aria-live="polite">
      <span className="notice-indicator" aria-hidden="true">i</span>
      <span className="notice-message">{notice}</span>
      <button type="button" aria-label="Cerrar aviso" onClick={dismiss}>×</button>
    </div>
  )
}
