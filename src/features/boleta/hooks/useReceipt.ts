import { useEffect, useState } from 'react'
import { storeApi } from '../../../lib/api'
import type { PedidoResponse } from '../../../types/orders'
import type { CustomerSession } from '../../../types/store'

export function useReceipt(customer: CustomerSession | null, orderId: string) {
  const [order, setOrder] = useState<PedidoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!customer) return
    let active = true
    storeApi.getMyOrders(customer.token)
      .then((orders) => {
        if (!active) return
        const found = orders.find((item) => item.id === orderId)
        if (found) setOrder(found)
        else setError('No encontramos este pedido en tu historial.')
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el pedido.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [customer, orderId])

  async function download() {
    if (!order || !customer) return
    setDownloading(true)
    setError('')
    try {
      const file = await storeApi.downloadReceipt(customer.token, order.id)
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = `comprobante-${order.codigo}.pdf`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo descargar el comprobante.')
    } finally {
      setDownloading(false)
    }
  }

  return { order, loading, error, downloading, download }
}
