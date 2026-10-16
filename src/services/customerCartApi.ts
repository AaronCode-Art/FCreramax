import { apiRequest } from './api'

export type CustomerCartProduct = {
  id: string
  codigo: string
  nombre: string
  categoria: string
  descripcion: string
  precio: number
  precioFinal: number | null
  descuentoPorcentaje: number | null
  stockDisponible: number
}

export type CustomerCartItem = {
  product: CustomerCartProduct
  quantity: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readCart(value: unknown): CustomerCartItem[] {
  if (!Array.isArray(value)) {
    throw new Error('La API devolvió un carrito no válido.')
  }

  return value.map((item): CustomerCartItem => {
    if (!isRecord(item) || !isRecord(item.product)) {
      throw new Error('La API devolvió un producto del carrito no válido.')
    }
    const product = item.product
    if (typeof product.id !== 'string'
      || typeof product.codigo !== 'string'
      || typeof product.nombre !== 'string'
      || typeof product.categoria !== 'string'
      || (product.descripcion !== null && typeof product.descripcion !== 'string')
      || typeof product.precio !== 'number'
      || (product.precioFinal !== null && typeof product.precioFinal !== 'number')
      || (product.descuentoPorcentaje !== null && typeof product.descuentoPorcentaje !== 'number')
      || typeof product.stockDisponible !== 'number'
      || typeof item.quantity !== 'number') {
      throw new Error('La API devolvió datos incompletos del carrito.')
    }
    return {
      product: {
        id: product.id,
        codigo: product.codigo,
        nombre: product.nombre,
        categoria: product.categoria,
        descripcion: typeof product.descripcion === 'string' ? product.descripcion : '',
        precio: product.precio,
        precioFinal: product.precioFinal,
        descuentoPorcentaje: product.descuentoPorcentaje,
        stockDisponible: product.stockDisponible,
      },
      quantity: item.quantity,
    }
  })
}

async function requestCart(path: string, options: RequestInit, token: string): Promise<CustomerCartItem[]> {
  return readCart(await apiRequest(path, options, token))
}

export function fetchCustomerCart(token: string): Promise<CustomerCartItem[]> {
  return requestCart('/api/v1/cliente/carrito', {}, token)
}

export function addCustomerCartItem(productoId: string, cantidad: number, token: string): Promise<CustomerCartItem[]> {
  return requestCart('/api/v1/cliente/carrito/items', {
    method: 'POST',
    body: JSON.stringify({ productoId, cantidad }),
  }, token)
}

export function updateCustomerCartItem(productoId: string, cantidad: number, token: string): Promise<CustomerCartItem[]> {
  return requestCart(`/api/v1/cliente/carrito/items/${encodeURIComponent(productoId)}`, {
    method: 'PUT',
    body: JSON.stringify({ cantidad }),
  }, token)
}

export function removeCustomerCartItem(productoId: string, token: string): Promise<CustomerCartItem[]> {
  return requestCart(`/api/v1/cliente/carrito/items/${encodeURIComponent(productoId)}`, {
    method: 'DELETE',
  }, token)
}

export async function clearCustomerCart(token: string): Promise<void> {
  await apiRequest('/api/v1/cliente/carrito', { method: 'DELETE' }, token)
}
