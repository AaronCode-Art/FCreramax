import { useCallback, useEffect, useState } from 'react'
import { storeApi } from '../../../lib/api'
import type { PedidoResponse } from '../../../types/orders'
import type { CustomerSession } from '../../../types/store'

export function useCustomerOrders(customer: CustomerSession) {
  const [orders, setOrders] = useState<PedidoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await storeApi.getMyOrders(customer.token))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu historial de pedidos.')
    } finally {
      setLoading(false)
    }
  }, [customer.token])

  useEffect(() => {
    let active = true
    storeApi.getMyOrders(customer.token)
      .then((result) => {
        if (active) setOrders(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu historial de pedidos.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [customer.token])

  const downloadReceipt = useCallback(async (order: PedidoResponse) => {
    setDownloadingOrderId(order.id)
    setError('')
    try {
      const pdf = await storeApi.downloadReceipt(customer.token, order.id)
      const url = URL.createObjectURL(pdf)
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
      setDownloadingOrderId(null)
    }
  }, [customer.token])

  return { orders, loading, error, refresh, downloadReceipt, downloadingOrderId }
}
