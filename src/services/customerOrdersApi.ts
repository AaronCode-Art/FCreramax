import { apiRequest } from './api'

export type CustomerCheckoutRequest = {
  tipoEntrega: 'DELIVERY' | 'RECOJO_TIENDA'
  tipoComprobante: 'BOLETA' | 'FACTURA'
  ruc: string | null
  razonSocial: string | null
  envioDepartamento: string | null
  envioProvincia: string | null
  envioDistrito: string | null
  envioDireccion: string | null
  envioTelefono: string | null
  envioCodigoPostal: string | null
  envioReferencia: string | null
  envioIdUbigeo: string | null
  metodoPago: 'SIMULADO'
  medioPagoSimulado: 'YAPE' | 'PLIN' | 'TARJETA'
  detalles: { productoId: string; cantidad: number }[]
  codigoCupon: string | null
}

export type CheckoutQuote = {
  subtotal: number
  descuentoCupon: number
  codigoCupon: string | null
  igv: number
  costoEnvio: number
  total: number
}

type CustomerOrderDelivery = {
  destinatario: string | null
  telefono: string | null
  departamento: string | null
  provincia: string | null
  distrito: string | null
  direccion: string | null
  codigoPostal: string | null
  referencia: string | null
  sucursalNombre: string | null
  sucursalDireccion: string | null
} | null

export type CustomerOrderSummary = {
  id: string
  codigo: string
  canal: string
  tipoEntrega: string
  estadoCodigo: string
  estadoNombre: string
  tipoComprobante: string
  serie: string | null
  numeroComprobante: string | null
  total: number
  createdAt: string
  datosEntrega: CustomerOrderDelivery
}

export type CustomerOrderDetail = CustomerOrderSummary & {
  ruc: string | null
  razonSocial: string | null
  subtotal: number
  descuentoCupon: number
  codigoCupon: string | null
  costoEnvio: number
  igv: number
  detalles: {
    id: string
    productoId: string | null
    productoCodigo: string | null
    productoNombre: string
    categoriaNombre: string | null
    imagenUrl: string | null
    cantidad: number
    precioUnitario: number
  }[]
  pagos: { metodoPago: string; estado: string }[]
  datosEntrega: CustomerOrderDelivery
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value) throw new Error(`La API devolvió un pedido sin ${field}.`)
  return value
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error('La API devolvió un dato de pedido no válido.')
  return value
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`La API devolvió un pedido sin ${field} válido.`)
  return value
}

function readSummary(value: unknown): CustomerOrderSummary {
  if (!isRecord(value)) throw new Error('La API devolvió un pedido no válido.')
  const createdAt = requiredString(value.createdAt, 'fecha')
  if (Number.isNaN(Date.parse(createdAt))) throw new Error('La API devolvió una fecha de pedido no válida.')
  let datosEntrega: CustomerOrderSummary['datosEntrega'] = null
  if (value.datosEntrega !== null && value.datosEntrega !== undefined) {
    if (!isRecord(value.datosEntrega)) throw new Error('La API devolvió datos de entrega no válidos.')
    datosEntrega = {
      destinatario: nullableString(value.datosEntrega.destinatario),
      telefono: nullableString(value.datosEntrega.telefono),
      departamento: nullableString(value.datosEntrega.departamento),
      provincia: nullableString(value.datosEntrega.provincia),
      distrito: nullableString(value.datosEntrega.distrito),
      direccion: nullableString(value.datosEntrega.direccion),
      codigoPostal: nullableString(value.datosEntrega.codigoPostal),
      referencia: nullableString(value.datosEntrega.referencia),
      sucursalNombre: nullableString(value.datosEntrega.sucursalNombre),
      sucursalDireccion: nullableString(value.datosEntrega.sucursalDireccion),
    }
  }
  return {
    id: requiredString(value.id, 'identificador'),
    codigo: requiredString(value.codigo, 'código'),
    canal: requiredString(value.canal, 'canal'),
    tipoEntrega: requiredString(value.tipoEntrega, 'tipo de entrega'),
    estadoCodigo: requiredString(value.estadoCodigo, 'estado'),
    estadoNombre: requiredString(value.estadoNombre, 'nombre del estado'),
    tipoComprobante: requiredString(value.tipoComprobante, 'tipo de comprobante'),
    serie: nullableString(value.serie),
    numeroComprobante: nullableString(value.numeroComprobante),
    total: requiredNumber(value.total, 'total'),
    createdAt,
    datosEntrega,
  }
}

function readDetail(value: unknown): CustomerOrderDetail {
  if (!isRecord(value) || !Array.isArray(value.detalles) || !Array.isArray(value.pagos)) {
    throw new Error('La API devolvió el detalle del pedido incompleto.')
  }
  const summary = readSummary(value)
  const detalles = value.detalles.map((line): CustomerOrderDetail['detalles'][number] => {
    if (!isRecord(line)) throw new Error('La API devolvió una línea de pedido no válida.')
    return {
      id: requiredString(line.id, 'identificador de producto'),
      productoId: nullableString(line.productoId),
      productoCodigo: nullableString(line.productoCodigo),
      productoNombre: requiredString(line.productoNombre, 'nombre del producto'),
      categoriaNombre: nullableString(line.categoriaNombre),
      imagenUrl: nullableString(line.imagenUrl),
      cantidad: requiredNumber(line.cantidad, 'cantidad'),
      precioUnitario: requiredNumber(line.precioUnitario, 'precio del producto'),
    }
  })
  const pagos = value.pagos.map((payment): CustomerOrderDetail['pagos'][number] => {
    if (!isRecord(payment)) throw new Error('La API devolvió un pago no válido.')
    return {
      metodoPago: requiredString(payment.metodoPago, 'método de pago'),
      estado: requiredString(payment.estado, 'estado de pago'),
    }
  })
  return {
    ...summary,
    ruc: nullableString(value.ruc),
    razonSocial: nullableString(value.razonSocial),
    subtotal: requiredNumber(value.subtotal, 'subtotal'),
    descuentoCupon: requiredNumber(value.descuentoCupon, 'descuento'),
    codigoCupon: nullableString(value.codigoCupon),
    costoEnvio: requiredNumber(value.costoEnvio, 'costo de envío'),
    igv: requiredNumber(value.igv, 'IGV'),
    detalles,
    pagos,
  }
}

export async function quoteCustomerCheckout(
  tipoEntrega: CustomerCheckoutRequest['tipoEntrega'],
  codigoCupon: string | null,
  token: string,
): Promise<CheckoutQuote> {
  const response = await apiRequest('/api/v1/pedidos/web/checkout/cotizacion', {
    method: 'POST',
    body: JSON.stringify({ tipoEntrega, codigoCupon }),
  }, token)
  if (!isRecord(response)) throw new Error('La API devolvió una cotización no válida.')
  return {
    subtotal: requiredNumber(response.subtotal, 'subtotal'),
    descuentoCupon: requiredNumber(response.descuentoCupon, 'descuento de cupón'),
    codigoCupon: nullableString(response.codigoCupon),
    igv: requiredNumber(response.igv, 'IGV'),
    costoEnvio: requiredNumber(response.costoEnvio, 'costo de envío'),
    total: requiredNumber(response.total, 'total'),
  }
}

export async function createCustomerOrder(request: CustomerCheckoutRequest, token: string): Promise<CustomerOrderDetail> {
  return readDetail(await apiRequest('/api/v1/pedidos/web/checkout', {
    method: 'POST',
    body: JSON.stringify(request),
  }, token))
}

export async function fetchCustomerOrder(orderId: string, token: string): Promise<CustomerOrderDetail> {
  return readDetail(await apiRequest(`/api/v1/pedidos/${encodeURIComponent(orderId)}`, {}, token))
}

export async function fetchCustomerOrders(token: string): Promise<CustomerOrderSummary[]> {
  const orders: CustomerOrderSummary[] = []
  let page = 0
  let totalPages = 1
  while (page < totalPages) {
    const response = await apiRequest(`/api/v1/pedidos/mios?pagina=${page}&tamano=100`, {}, token)
    if (!isRecord(response) || !Array.isArray(response.contenido) || typeof response.totalPaginas !== 'number') {
      throw new Error('La API devolvió un historial de pedidos no válido.')
    }
    orders.push(...response.contenido.map(readSummary))
    totalPages = response.totalPaginas
    page += 1
  }
  return orders
}
