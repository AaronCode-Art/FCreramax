export interface Product {
  id: string
  codigo: string
  nombre: string
  categoria: string
  descripcion: string | null
  precio: number
  precioFinal: number
  descuentoPorcentaje: number
  stockDisponible: number
}

export interface ProductGalleryImage {
  id: string
  productoId: string
  url: string
  publicId: string
  orden: number
  esPrincipal: boolean
}

export interface ProductDetail extends Product {
  especificaciones: Array<Record<string, unknown>>
}

export interface ProductReview {
  id: string
  productoId: string
  clienteNombre: string
  calificacion: number
  comentario: string | null
  creadoEn: string
  imagenes: Array<{ id: string; url: string }>
}

export interface ProductReviewsPage {
  content: ProductReview[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ProductReviewsSummary {
  productoId: string
  cantidadResenas: number
  calificacionPromedio: number | null
  cincoEstrellas: number
  cuatroEstrellas: number
  tresEstrellas: number
  dosEstrellas: number
  unaEstrella: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartItemResponse {
  product: Product
  quantity: number
}

export interface CustomerSession {
  token: string
  email: string
  nombres: string
  apellidos: string
}

export interface UbigeoDistrict {
  id: string
  name: string
  level: 'district'
}

export interface UbigeoProvince {
  id: string
  name: string
  level: 'province'
  childrens: UbigeoDistrict[]
}

export interface UbigeoDepartment {
  id: string
  name: string
  level: 'department'
  childrens: UbigeoProvince[]
}

export interface AuthResponse {
  token: string
  tipo: string
  email: string
  nombres: string
  apellidos: string
  rol: string
}

export interface CartOrderRequest {
  productoId: string
  cantidad: number
}

export type SimulatedPaymentMethod = 'YAPE' | 'PLIN' | 'TARJETA'

export type SimulatedCheckoutResponse = PedidoResponse

export interface CreateCustomerRequest {
  tipoDocumento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE'
  numeroDocumento: string
  nombres: string
  apellidos: string
  email: string
  password: string
  telefono: string
  departamento: string
  provincia: string
  distrito: string
  direccion: string
  codigoPostal: string
  referencia: string
  idUbigeo: string
}

export interface RegisteredCustomer {
  id: string
  email: string | null
}

export interface CheckoutQuote {
  subtotal: number
  igv: number
  costoEnvio: number
  total: number
}

export interface CreateOrderRequest {
  tipoEntrega: 'DELIVERY' | 'RECOJO_TIENDA'
  tipoComprobante: 'BOLETA' | 'FACTURA'
  ruc?: string
  razonSocial?: string
  envioDepartamento?: string
  envioProvincia?: string
  envioDistrito?: string
  envioDireccion?: string
  metodoPago: 'SIMULADO'
  medioPagoSimulado: SimulatedPaymentMethod
  detalles: Array<{ productoId: string; cantidad: number }>
}

export interface CheckoutQuoteRequest {
  tipoEntrega: 'DELIVERY' | 'RECOJO_TIENDA'
}

export interface ApiErrorBody {
  message?: string
}
import type { PedidoResponse } from './orders'

export type { DatosEntrega, PedidoDetalle, PedidoPago, PedidoResponse } from './orders'
export type { CustomerProfile } from './profile'
