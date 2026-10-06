import { useEffect, useState } from 'react'
import { storeApi } from '../../../lib/api'
import type { ProductDetail, ProductGalleryImage } from '../../../types/store'

export function useProductDetail(productId: string) {
  const [detail, setDetail] = useState<{
    productId: string
    product: ProductDetail | null
    loading: boolean
    error: string | null
  }>({ productId: '', product: null, loading: true, error: null })
  const [gallery, setGallery] = useState<{
    productId: string
    images: ProductGalleryImage[]
    loading: boolean
    error: string | null
  }>({ productId: '', images: [], loading: true, error: null })

  useEffect(() => {
    let active = true

    void storeApi.getProductDetail(productId)
      .then((detail) => {
        if (active) setDetail({ productId, product: detail, loading: false, error: null })
      })
      .catch((cause: unknown) => {
        if (active) {
          setDetail({
            productId,
            product: null,
            loading: false,
            error: cause instanceof Error ? cause.message : 'No se pudo cargar el producto.',
          })
        }
      })

    void storeApi.getProductGallery(productId)
      .then((gallery) => {
        if (active) {
          setGallery({
            productId,
            images: [...gallery].sort((first, second) => Number(second.esPrincipal) - Number(first.esPrincipal) || first.orden - second.orden),
            loading: false,
            error: null,
          })
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setGallery({
            productId,
            images: [],
            loading: false,
            error: cause instanceof Error ? cause.message : 'No se pudo cargar la galería.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [productId])

  return {
    product: detail.productId === productId ? detail.product : null,
    images: gallery.productId === productId ? gallery.images : [],
    galleryLoading: gallery.productId !== productId || gallery.loading,
    loading: detail.productId !== productId || detail.loading,
    error: detail.productId === productId ? detail.error : null,
    galleryError: gallery.productId === productId ? gallery.error : null,
  }
}
