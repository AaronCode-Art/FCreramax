import type {
  ApiErrorBody,
  AuthResponse,
  CartItemResponse,
  CartOrderRequest,
  CheckoutQuote,
  CheckoutQuoteRequest,
  CreateCustomerRequest,
  CreateOrderRequest,
  CustomerProfile,
  ProductGalleryImage,
  ProductDetail,
  ProductReviewsPage,
  ProductReviewsSummary,
  Product,
  PedidoResponse,
  RegisteredCustomer,
  SimulatedCheckoutResponse,
  UbigeoDepartment,
} from '../types/store'

const BACKEND_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const API_BASE_URL = `${BACKEND_URL}/api`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = `La solicitud falló (${response.status}).`
    try {
      const error = (await response.json()) as ApiErrorBody
      if (error.message) message = error.message
    } catch {
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const storeApi = {
  getCatalog: () => request<Product[]>('/v1/public/catalogo'),

  getUbigeos: () => request<UbigeoDepartment[]>('/v1/public/ubigeos'),

  getProductGallery: (productId: string) =>
    request<ProductGalleryImage[]>(`/v1/public/catalogo/${productId}/galeria`),

  getProductDetail: (productId: string) =>
    request<ProductDetail>(`/v1/public/catalogo/${productId}/detalle`),

  getProductReviews: (productId: string, page = 0, size = 5) =>
    request<ProductReviewsPage>(`/v1/public/catalogo/${productId}/resenas?page=${page}&size=${size}`),

  getProductReviewsSummary: (productId: string) =>
    request<ProductReviewsSummary>(`/v1/public/catalogo/${productId}/resenas/resumen`),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/cliente/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  registerCustomer: (customer: CreateCustomerRequest) =>
    request<RegisteredCustomer>('/v1/clientes', {
      method: 'POST',
      body: JSON.stringify(customer),
    }),

  getMyProfile: (token: string) =>
    request<CustomerProfile>('/v1/clientes/mio', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getCart: (token: string) =>
    request<CartItemResponse[]>('/v1/cliente/carrito', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addCartItem: (token: string, item: CartOrderRequest) =>
    request<CartItemResponse[]>('/v1/cliente/carrito/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(item),
    }),

  updateCartItem: (token: string, productId: string, quantity: number) =>
    request<CartItemResponse[]>(`/v1/cliente/carrito/items/${productId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ cantidad: quantity }),
    }),

  removeCartItem: (token: string, productId: string) =>
    request<CartItemResponse[]>(`/v1/cliente/carrito/items/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getWishlist: (token: string) =>
    request<string[]>('/v1/cliente/deseos', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addWishlistItem: (token: string, productId: string) =>
    request<string[]>(`/v1/cliente/deseos/${productId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  removeWishlistItem: (token: string, productId: string) =>
    request<string[]>(`/v1/cliente/deseos/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  quoteCheckout: (token: string, body: CheckoutQuoteRequest) =>
    request<CheckoutQuote>('/v1/pedidos/web/checkout/cotizacion', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),

  getMyOrders: (token: string) =>
    request<PedidoResponse[]>('/v1/pedidos/mios', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  downloadReceipt: async (token: string, orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/v1/pedidos/${orderId}/comprobante/pdf`, {
      headers: {
        Accept: 'application/pdf',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      let message = `No se pudo descargar el comprobante (${response.status}).`
      try {
        const error = (await response.json()) as ApiErrorBody
        if (error.message) message = error.message
      } catch {
        // Keep the HTTP status message when the server response is not JSON.
      }
      throw new Error(message)
    }
    return response.blob()
  },

  createCheckout: (token: string, body: CreateOrderRequest) =>
    request<SimulatedCheckoutResponse>('/v1/pedidos/web/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),

}
