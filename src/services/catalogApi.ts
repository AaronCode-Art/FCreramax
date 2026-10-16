import { apiRequest } from './api'

export const PRODUCT_GALLERY_REFRESH_INTERVAL = 5 * 60 * 1000
export const STORE_DATA_REFRESH_INTERVAL = 60 * 1000

export type PublicCatalogProduct = {
  id: string
  codigo: string
  nombre: string
  categoria: string
  descripcion: string | null
  precio: number
  precioFinal: number | null
  descuentoPorcentaje: number | null
  stockDisponible: number
}

export type PublicProductSpecification = {
  label: string
  value: string
}

export type PublicProductGalleryImage = {
  url: string
  isPrimary: boolean
}

type CatalogPage = {
  content: PublicCatalogProduct[]
  totalPages: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseProduct(value: unknown): PublicCatalogProduct {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.codigo !== 'string'
    || typeof value.nombre !== 'string'
    || typeof value.categoria !== 'string'
    || typeof value.stockDisponible !== 'number'
    || typeof value.precio !== 'number'
    || (value.precioFinal !== null && typeof value.precioFinal !== 'number')
    || (value.descuentoPorcentaje !== null && typeof value.descuentoPorcentaje !== 'number')
    || (value.descripcion !== null && typeof value.descripcion !== 'string')) {
    throw new Error('La API devolvió un producto con un formato inesperado.')
  }
  return {
    id: value.id,
    codigo: value.codigo,
    nombre: value.nombre,
    categoria: value.categoria,
    descripcion: value.descripcion,
    precio: value.precio,
    precioFinal: value.precioFinal,
    descuentoPorcentaje: value.descuentoPorcentaje,
    stockDisponible: value.stockDisponible,
  }
}

function parsePage(value: unknown): CatalogPage {
  if (!isRecord(value) || !Array.isArray(value.content) || typeof value.totalPages !== 'number') {
    throw new Error('La API devolvió una página de catálogo con un formato inesperado.')
  }
  return {
    content: value.content.map(parseProduct),
    totalPages: value.totalPages,
  }
}

export async function fetchPublicCatalog(): Promise<PublicCatalogProduct[]> {
  const firstPage = parsePage(await apiRequest('/api/v1/public/catalogo?page=0&size=100'))
  if (firstPage.totalPages <= 1) return firstPage.content

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      apiRequest(`/api/v1/public/catalogo?page=${index + 1}&size=100`).then(parsePage),
    ),
  )
  return [firstPage, ...remainingPages].flatMap((page) => page.content)
}

export async function fetchPublicProductDetails(productId: string): Promise<PublicProductSpecification[]> {
  const response = await apiRequest(`/api/v1/public/catalogo/${encodeURIComponent(productId)}/detalle`)
  if (!isRecord(response) || !Array.isArray(response.especificaciones)) {
    throw new Error('La API devolvió los detalles del producto con un formato inesperado.')
  }
  return response.especificaciones.flatMap((specification) => {
    if (!isRecord(specification)) return []
    return Object.entries(specification)
      .filter((entry): entry is [string, string | number | boolean] =>
        typeof entry[1] === 'string' || typeof entry[1] === 'number' || typeof entry[1] === 'boolean',
      )
      .map(([label, value]) => ({ label, value: String(value) }))
  })
}

export async function fetchPublicProductGallery(productId: string): Promise<PublicProductGalleryImage[]> {
  const response = await apiRequest(`/api/v1/public/catalogo/${encodeURIComponent(productId)}/galeria`)
  if (!Array.isArray(response)) {
    throw new Error('La API devolvió la galería del producto con un formato inesperado.')
  }
  return response.flatMap((image) => {
    if (!isRecord(image) || typeof image.url !== 'string' || !image.url.trim()) return []
    return [{ url: image.url, isPrimary: image.esPrincipal === true }]
  })
}
