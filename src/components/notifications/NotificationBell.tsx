import './Notifications.css'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationsContext'
import { BellIcon, CartIcon, PackageIcon } from '../ui/Icons'

export function NotificationBell({ onOpen }: { onOpen?: () => void }) {
  const { items, unreadCount, markAllSeen } = useNotifications()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    window.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  const label = unreadCount > 0
    ? `Avisos: ${unreadCount} ${unreadCount === 1 ? 'nuevo' : 'nuevos'}`
    : 'Avisos'

  return (
    <div className="bell" ref={rootRef}>
      <button
        className="icon-button header-icon-link bell-button"
        type="button"
        aria-label={label}
        title="Avisos de tu carrito y tus pedidos"
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => { setOpen((current) => !current); onOpen?.() }}
      >
        <BellIcon />
        <span className="icon-label" aria-hidden="true">Avisos</span>
        {unreadCount > 0 && <span className="bell-badge" aria-hidden="true">{unreadCount}</span>}
      </button>
      {open && (
        <section className="bell-panel" id="notification-panel" aria-label="Avisos">
          <header className="bell-panel-header">
            <h2>Tus avisos</h2>
            {unreadCount > 0 && <button type="button" onClick={markAllSeen}>Marcar todo como visto</button>}
          </header>
          {items.length === 0 ? (
            <p className="bell-empty">
              Por ahora no hay nada nuevo. Aquí te avisaremos si dejas piezas en el carrito o si cambia el estado de tu pedido.
            </p>
          ) : (
            <ul className="bell-list">
              {items.map((item) => (
                <li key={item.id} className={`bell-item bell-item-${item.tone}${item.unread ? ' is-unread' : ''}`}>
                  <span className="bell-item-icon" aria-hidden="true">{item.kind === 'cart' ? <CartIcon /> : <PackageIcon />}</span>
                  <div className="bell-item-copy">
                    <strong>{item.unread && <span className="bell-new">Nuevo</span>}{item.title}</strong>
                    <p>{item.body}</p>
                    <Link to={item.to} onClick={() => { markAllSeen(); setOpen(false) }}>{item.actionLabel}</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
