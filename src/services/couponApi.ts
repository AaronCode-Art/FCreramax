import { apiRequest } from './api'

export type CouponAnnouncement = {
  codigo: string
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO'
  valor: number
  compraMinima: number
  limitePorCliente: number
  venceEn: string | null
  titulo: string
  mensaje: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readAnnouncement(value: unknown): CouponAnnouncement {
  if (!isRecord(value)
    || typeof value.codigo !== 'string'
    || (value.tipoDescuento !== 'PORCENTAJE' && value.tipoDescuento !== 'MONTO_FIJO')
    || typeof value.valor !== 'number'
    || typeof value.compraMinima !== 'number'
    || typeof value.limitePorCliente !== 'number'
    || !(typeof value.venceEn === 'string' || value.venceEn === null)
    || typeof value.titulo !== 'string'
    || typeof value.mensaje !== 'string') {
    throw new Error('La API devolvió un anuncio de cupón con formato no válido.')
  }
  return {
    codigo: value.codigo,
    tipoDescuento: value.tipoDescuento,
    valor: value.valor,
    compraMinima: value.compraMinima,
    limitePorCliente: value.limitePorCliente,
    venceEn: value.venceEn,
    titulo: value.titulo,
    mensaje: value.mensaje,
  }
}

export async function fetchCouponAnnouncements(): Promise<CouponAnnouncement[]> {
  const response = await apiRequest('/api/v1/public/cupones/anuncios')
  if (!Array.isArray(response)) throw new Error('La API devolvió una lista de anuncios no válida.')
  return response.map(readAnnouncement)
}
