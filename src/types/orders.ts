export interface PedidoResponse {
  id: string
  codigo: string
  canal: string
  tipoEntrega: 'DELIVERY' | 'RECOJO_TIENDA' | string
  estadoCodigo: string
  estadoNombre: string
  logisticaId: string | null
  logisticaNombre: string | null
  deliveryId: string | null
  deliveryNombre: string | null
  tipoComprobante: 'BOLETA' | 'FACTURA' | string
  serie: string | null
  numeroComprobante: string | null
  subtotal: number
  descuentoCupon: number
  costoEnvio: number
  igv: number
  total: number
  tieneReserva: boolean
  despachado: boolean
  createdAt: string
  detalles: PedidoDetalle[]
  pagos: PedidoPago[]
  datosEntrega: DatosEntrega | null
}

export interface PedidoDetalle {
  id: string
  productoId: string
  productoCodigo: string
  productoNombre: string
  categoriaNombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  estadoStock: string
}

export interface PedidoPago {
  id: string
  codigo: string
  metodoPago: string
  estado: string
  monto: number
  fechaPago: string | null
}

export interface DatosEntrega {
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
}
