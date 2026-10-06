import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import styles from './NotificationIsland.module.css'

interface NotificationIslandProps {
  message: string
  onDismiss: () => void
}

export function NotificationIsland({ message, onDismiss }: NotificationIslandProps) {
  const [closing, setClosing] = useState(false)
  const dismissTimer = useRef<number | null>(null)
  const beginDismiss = useCallback(() => {
    if (dismissTimer.current !== null) return
    setClosing(true)
    dismissTimer.current = window.setTimeout(onDismiss, 300)
  }, [onDismiss])

  useEffect(() => {
    const closeTimer = window.setTimeout(beginDismiss, 3600)
    return () => {
      window.clearTimeout(closeTimer)
      if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current)
    }
  }, [beginDismiss])

  return (
    <div className={styles.container}>
      <div
        className={`${styles.island} ${closing ? styles.closing : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={styles.icon} aria-hidden="true"><Check size={15} strokeWidth={2.5} /></span>
        <span className={styles.message}>{message}</span>
        <button type="button" className={styles.dismiss} onClick={beginDismiss} aria-label="Cerrar notificación">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
