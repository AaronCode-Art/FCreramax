import { useMemo } from 'react'
import type { PedidoResponse } from '../../../types/orders'
import type { Product } from '../../../types/store'

const selectionSeed = Math.random()

function selectionScore(id: string) {
  return [...id].reduce((score, character) => (score * 31 + character.charCodeAt(0)) % 100_000, Math.floor(selectionSeed * 100_000))
}

export function useProductRecommendations(products: Product[], orders: PedidoResponse[]) {
  return useMemo(() => {
    const purchasedIds = new Set(orders.flatMap((order) => order.detalles.map((detail) => detail.productoId)))
    const candidates = products.filter((product) => Number(product.stockDisponible) > 0 && !purchasedIds.has(product.id))
    return [...candidates]
      .sort((first, second) => selectionScore(first.id) - selectionScore(second.id))
      .slice(0, 4)
  }, [orders, products])
}
