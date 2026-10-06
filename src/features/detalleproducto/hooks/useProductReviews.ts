import { useCallback, useEffect, useState } from 'react'
import { storeApi } from '../../../lib/api'
import type { ProductReview, ProductReviewsSummary } from '../../../types/store'

const PAGE_SIZE = 5

interface ReviewState {
  productId: string
  summary: ProductReviewsSummary | null
  reviews: ProductReview[]
  totalPages: number
  page: number
  loading: boolean
  loadingMore: boolean
  error: string | null
}

const emptyState: ReviewState = {
  productId: '',
  summary: null,
  reviews: [],
  totalPages: 0,
  page: 0,
  loading: true,
  loadingMore: false,
  error: null,
}

async function fetchFirstPage(productId: string) {
  const [summary, firstPage] = await Promise.all([
    storeApi.getProductReviewsSummary(productId),
    storeApi.getProductReviews(productId, 0, PAGE_SIZE),
  ])
  if (!Array.isArray(firstPage.content) || typeof firstPage.totalPages !== 'number') {
    throw new Error('El backend devolvió una respuesta de reseñas no válida.')
  }
  return { summary, reviews: firstPage.content, totalPages: firstPage.totalPages }
}

export function useProductReviews(productId: string) {
  const [state, setState] = useState<ReviewState>(emptyState)

  useEffect(() => {
    let active = true
    void fetchFirstPage(productId)
      .then((result) => {
        if (active) {
          setState({
            productId,
            ...result,
            page: 0,
            loading: false,
            loadingMore: false,
            error: null,
          })
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setState({
            ...emptyState,
            productId,
            loading: false,
            error: cause instanceof Error ? cause.message : 'No se pudieron cargar las reseñas.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [productId])

  const refresh = useCallback(async () => {
    setState((current) => ({
      ...(current.productId === productId ? current : emptyState),
      productId,
      loading: true,
      error: null,
    }))
    try {
      const result = await fetchFirstPage(productId)
      setState({
        productId,
        ...result,
        page: 0,
        loading: false,
        loadingMore: false,
        error: null,
      })
    } catch (cause) {
      setState((current) => ({
        ...(current.productId === productId ? current : emptyState),
        productId,
        loading: false,
        error: cause instanceof Error ? cause.message : 'No se pudieron cargar las reseñas.',
      }))
    }
  }, [productId])

  const loadMore = useCallback(async () => {
    if (state.loadingMore || state.loading || state.page + 1 >= state.totalPages) return
    setState((current) => ({ ...current, loadingMore: true, error: null }))
    try {
      const nextPage = state.page + 1
      const result = await storeApi.getProductReviews(productId, nextPage, PAGE_SIZE)
      setState((current) => ({
        ...current,
        reviews: [...current.reviews, ...result.content],
        page: nextPage,
        loadingMore: false,
      }))
    } catch (cause) {
      setState((current) => ({
        ...current,
        loadingMore: false,
        error: cause instanceof Error ? cause.message : 'No se pudieron cargar más reseñas.',
      }))
    }
  }, [productId, state.loading, state.loadingMore, state.page, state.totalPages])

  const isCurrentProduct = state.productId === productId
  return {
    summary: isCurrentProduct ? state.summary : null,
    reviews: isCurrentProduct ? state.reviews : [],
    loading: !isCurrentProduct || state.loading,
    loadingMore: isCurrentProduct && state.loadingMore,
    error: isCurrentProduct ? state.error : null,
    hasMore: isCurrentProduct && state.page + 1 < state.totalPages,
    refresh,
    loadMore,
  }
}
