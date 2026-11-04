import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { isFinalStatus, statusHelp, statusLabel } from '../components/common/orderStatus'
import { useStore } from './StoreContext'

export type AppNotification = {
  id: string
  kind: 'cart' | 'order'
  title: string
  body: string
  to: string
  actionLabel: string
  unread: boolean
  tone: 'default' | 'good' | 'problem'
}

type NotificationsValue = {
  items: AppNotification[]
  unreadCount: number
  unreadOrderIds: Set<string>
  markAllSeen: () => void
  /** Marca como vistos los estados de pedidos y el carrito actual. */
  acknowledgeCart: () => void
  acknowledgeOrders: () => void
}

const NotificationsContext = createContext<NotificationsValue | null>(null)
const CART_REMINDER_DELAY_MS = 3500

const seenKey = (email: string) => `ceramax:order-seen:${email.trim().toLowerCase()}`
const cartAckKey = (email: string) => `ceramax:cart-ack:${email.trim().toLowerCase()}`

function readSeen(email: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(seenKey(email))
    return raw ? JSON.parse(raw) as Record<string, string> : null
  } catch {
    return null
  }
}

function writeSeen(email: string, value: Record<string, string>) {
  try { localStorage.setItem(seenKey(email), JSON.stringify(value)) } catch { /* sin almacenamiento: los avisos siguen funcionando en memoria */ }
}

function readCartAck(email: string) {
  try { return sessionStorage.getItem(cartAckKey(email)) } catch { return null }
}

function writeCartAck(email: string, signature: string) {
  try { sessionStorage.setItem(cartAckKey(email), signature) } catch { /* idem */ }
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { customer, cart, orders, ordersLoading, notify } = useStore()
  const { pathname } = useLocation()
  const email = customer?.email ?? ''
  const [seen, setSeen] = useState<Record<string, string>>({})
  const [cartAck, setCartAck] = useState<string | null>(null)
  const baselineReady = useRef(false)
  const lastStatuses = useRef<Record<string, string>>({})
  const reminderShown = useRef(false)
  const ordersRef = useRef(orders)
  useEffect(() => { ordersRef.current = orders }, [orders])

  const units = cart.reduce((sum, line) => sum + line.quantity, 0)
  const total = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const cartSignature = `${cart.length}:${units}`

  // Al cambiar de cuenta se reinicia todo el seguimiento.
  useEffect(() => {
    baselineReady.current = false
    lastStatuses.current = {}
    reminderShown.current = false
    setSeen(email ? readSeen(email) ?? {} : {})
    setCartAck(email ? readCartAck(email) : null)
  }, [email])

  // La primera lista de pedidos es la "línea base": no avisa de pedidos antiguos.
  useEffect(() => {
    if (!email || ordersLoading) return
    if (!baselineReady.current) {
      if (!orders.length && !readSeen(email)) return
      baselineReady.current = true
      lastStatuses.current = Object.fromEntries(orders.map((order) => [order.id, order.statusCode]))
      if (!readSeen(email)) {
        const baseline = Object.fromEntries(orders.map((order) => [order.id, order.statusCode]))
        writeSeen(email, baseline)
        setSeen(baseline)
      }
      return
    }
    for (const order of orders) {
      const before = lastStatuses.current[order.id]
      if (before && before !== order.statusCode) {
        notify(`Tu pedido ${order.code}: ${statusLabel(order.statusCode, order.status).toLowerCase()}.`, {
          tone: order.statusCode === 'CANCELADO' || order.statusCode === 'NO_ENTREGADA' ? 'warning' : 'success',
          action: { label: 'Ver mi pedido', to: '/pedidos' },
        })
      }
      lastStatuses.current[order.id] = order.statusCode
    }
  }, [orders, ordersLoading, email, notify])

  // Recordatorio amable, una sola vez por visita, si dejó piezas en el carrito.
  useEffect(() => {
    if (!email || reminderShown.current || cart.length === 0) return
    if (cartAck === cartSignature) { reminderShown.current = true; return }
    if (/^\/(carrito|checkout)/.test(pathname)) return
    const timer = window.setTimeout(() => {
      reminderShown.current = true
      notify(`Tienes ${plural(units, 'pieza', 'piezas')} esperando en tu carrito.`, {
        action: { label: 'Terminar mi compra', to: '/carrito' },
        duration: 15000,
      })
    }, CART_REMINDER_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [email, cart.length, units, cartAck, cartSignature, pathname, notify])

  const acknowledgeCart = useCallback(() => {
    if (!email) return
    writeCartAck(email, cartSignature)
    setCartAck(cartSignature)
  }, [email, cartSignature])

  const acknowledgeOrders = useCallback(() => {
    if (!email) return
    const next = Object.fromEntries(ordersRef.current.map((order) => [order.id, order.statusCode]))
    writeSeen(email, next)
    setSeen(next)
  }, [email])

  // Entrar al carrito ya es "haberlo visto".
  useEffect(() => {
    if (/^\/(carrito|checkout)/.test(pathname)) acknowledgeCart()
  }, [pathname, acknowledgeCart])

  const items = useMemo<AppNotification[]>(() => {
    if (!email) return []
    const list: AppNotification[] = []
    if (cart.length > 0) {
      list.push({
        id: 'cart',
        kind: 'cart',
        title: `Tienes ${plural(units, 'pieza', 'piezas')} en tu carrito`,
        body: `Total hasta ahora: S/ ${total.toFixed(2)}. Todavía no se te cobra nada.`,
        to: '/carrito',
        actionLabel: 'Ver mi carrito',
        unread: cartAck !== cartSignature,
        tone: 'default',
      })
    }
    const relevant = orders.filter((order) => !isFinalStatus(order.statusCode) || seen[order.id] !== order.statusCode)
    for (const order of relevant.slice(0, 5)) {
      const unread = seen[order.id] !== order.statusCode
      list.push({
        id: `order-${order.id}`,
        kind: 'order',
        title: `Pedido ${order.code}: ${statusLabel(order.statusCode, order.status)}`,
        body: statusHelp(order.statusCode),
        to: '/pedidos',
        actionLabel: 'Ver mi pedido',
        unread,
        tone: order.statusCode === 'COMPLETADA' ? 'good' : order.statusCode === 'CANCELADO' || order.statusCode === 'NO_ENTREGADA' ? 'problem' : 'default',
      })
    }
    return list
  }, [email, cart.length, units, total, cartAck, cartSignature, orders, seen])

  const unreadOrderIds = useMemo(() => new Set(orders.filter((order) => seen[order.id] !== order.statusCode).map((order) => order.id)), [orders, seen])
  const unreadCount = items.filter((item) => item.unread).length
  const markAllSeen = useCallback(() => { acknowledgeCart(); acknowledgeOrders() }, [acknowledgeCart, acknowledgeOrders])

  const value = useMemo(() => ({ items, unreadCount, unreadOrderIds, markAllSeen, acknowledgeCart, acknowledgeOrders }), [items, unreadCount, unreadOrderIds, markAllSeen, acknowledgeCart, acknowledgeOrders])
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications debe usarse dentro de NotificationsProvider.')
  return context
}
