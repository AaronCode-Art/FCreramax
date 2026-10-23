import { apiRequest } from './api'

export type PublicProductReview = {
  id: string
  productoId: string
  clienteId: string
  clienteNombre: string
  calificacion: number
  comentario: string | null
  creadoEn: string
  imagenes: { url: string }[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readReview(value: unknown): PublicProductReview {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.productoId !== 'string'
    || typeof value.clienteId !== 'string'
    || typeof value.clienteNombre !== 'string'
    || typeof value.calificacion !== 'number'
    || typeof value.creadoEn !== 'string'
    || !Array.isArray(value.imagenes)
    || (value.comentario !== null && typeof value.comentario !== 'string')
    || Number.isNaN(Date.parse(value.creadoEn))) {
    throw new Error('La API devolvió una reseña con un formato inesperado.')
  }
  return {
    id: value.id,
    productoId: value.productoId,
    clienteId: value.clienteId,
    clienteNombre: value.clienteNombre,
    calificacion: value.calificacion,
    comentario: value.comentario,
    creadoEn: value.creadoEn,
    imagenes: value.imagenes.flatMap((image) =>
      isRecord(image) && typeof image.url === 'string' && image.url.trim()
        ? [{ url: image.url }]
        : [],
    ),
  }
}

function readReviewPage(value: unknown): { content: PublicProductReview[]; totalPages: number } {
  if (!isRecord(value)
    || !Array.isArray(value.content)
    || typeof value.totalPages !== 'number'
    || !Number.isInteger(value.totalPages)
    || value.totalPages < 0) {
    throw new Error('La API devolvió una página de reseñas con un formato inesperado.')
  }
  return { content: value.content.map(readReview), totalPages: value.totalPages }
}

export async function fetchPublicProductReviews(productId: string): Promise<PublicProductReview[]> {
  const pageSize = 50
  const firstPage = readReviewPage(await apiRequest(
    `/api/v1/public/catalogo/${encodeURIComponent(productId)}/resenas?page=0&size=${pageSize}`,
  ))
  if (firstPage.totalPages <= 1) return firstPage.content

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      apiRequest(
        `/api/v1/public/catalogo/${encodeURIComponent(productId)}/resenas?page=${index + 1}&size=${pageSize}`,
      ).then(readReviewPage),
    ),
  )
  return [firstPage, ...remainingPages].flatMap((page) => page.content)
}

export async function createCustomerReview(
  request: {
    productoId: string
    pedidoId: string
    calificacion: number
    comentario: string
  },
  images: File[],
  token: string,
): Promise<PublicProductReview> {
  const formData = new FormData()
  formData.append('resena', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  images.forEach((image) => formData.append('imagenes', image))
  return readReview(await apiRequest('/api/v1/cliente/resenas', {
    method: 'POST',
    body: formData,
  }, token))
}
