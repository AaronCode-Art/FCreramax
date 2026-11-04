import { apiRequest } from './api'

function readWishlist(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((productId) => typeof productId === 'string')) {
    throw new Error('No se cargaron los datos. Inténtalo de nuevo.')
  }
  return value
}

export async function fetchCustomerWishlist(token: string): Promise<string[]> {
  return readWishlist(await apiRequest('/api/v1/cliente/deseos', {}, token))
}

export async function addCustomerWishlistItem(productId: string, token: string): Promise<string[]> {
  return readWishlist(await apiRequest(`/api/v1/cliente/deseos/${encodeURIComponent(productId)}`, {
    method: 'POST',
  }, token))
}

export async function removeCustomerWishlistItem(productId: string, token: string): Promise<string[]> {
  return readWishlist(await apiRequest(`/api/v1/cliente/deseos/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  }, token))
}
