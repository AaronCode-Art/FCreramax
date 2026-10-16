import { useRef, useState } from 'react'
import { useStore, type StoreOrder } from '../../context/StoreContext'

type OrderDownloader = (order: StoreOrder) => Promise<void>

export function usePedidosPage(downloadOrderPdf: OrderDownloader) {
  const { customer, orders, ordersLoading, ordersError, openAuth, loadOrderDetails, refreshOrders } = useStore()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<StoreOrder | null>(null)
  const [selectedLoading, setSelectedLoading] = useState(false)
  const [error, setError] = useState('')
  const selectionRequest = useRef(0)
  const pageSize = 8
  const filtered = orders.filter((order) => {
    const term = query.trim().toLocaleLowerCase('es')
    return !term || [order.code, order.customer.name, order.numeroComprobante ?? ''].some((item) => item.toLocaleLowerCase('es').includes(term))
  })
  const pages = Math.ceil(filtered.length / pageSize)
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize)

  function updateQuery(value: string) {
    setQuery(value)
    setPage(0)
  }

  async function handleDownload(order: StoreOrder) {
    try {
      const detail = await loadOrderDetails(order.id)
      await downloadOrderPdf(detail)
      setError('')
    } catch (cause) {
      console.error('No se pudo generar el PDF del pedido.', cause)
      setError('No se pudo descargar el PDF. Inténtalo de nuevo.')
    }
  }

  async function handleSelect(order: StoreOrder) {
    const requestId = ++selectionRequest.current
    setSelected(order)
    setSelectedLoading(true)
    setError('')
    try {
      const detail = await loadOrderDetails(order.id)
      if (selectionRequest.current === requestId) setSelected(detail)
    } catch (cause) {
      console.error('No se pudo cargar el detalle del pedido.', cause)
      if (selectionRequest.current === requestId) {
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el detalle del pedido.')
        setSelected(null)
      }
    } finally {
      if (selectionRequest.current === requestId) setSelectedLoading(false)
    }
  }

  function closeSelected() {
    selectionRequest.current += 1
    setSelected(null)
    setSelectedLoading(false)
  }

  async function retryOrders() {
    try {
      await refreshOrders()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el historial.')
    }
  }

  return {
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
    refreshOrders: retryOrders,
    selected,
    selectedLoading,
    setPage,
    updateQuery,
    visible,
  }
}
