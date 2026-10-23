import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { PRODUCT_GALLERY_REFRESH_INTERVAL, STORE_DATA_REFRESH_INTERVAL, fetchPublicProductDetails, type PublicProductSpecification } from '../../services/catalogApi'
import { useStore } from '../../context/StoreContext'
import { createCustomerReview, fetchPublicProductReviews, type PublicProductReview } from '../../services/reviewApi'

export function useDetalleProductoPage() {
  const { id } = useParams()
  const {
    products, categories, catalogLoading, catalogError, refreshCatalog, loadProductGallery, customer, orders, ordersLoading,
    ordersError, refreshOrders, loadOrderDetails, favorites, openAuth, addToCart, toggleFavorite,
  } = useStore()
  const product = products.find((item) => item.slug === id || item.id === id)
  const productId = product?.id
  const [productDetails, setProductDetails] = useState<{
    productId: string
    specifications: PublicProductSpecification[]
    error: string
  } | null>(null)
  const [selectedImage, setSelectedImage] = useState<{ productId: string; url: string } | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewImages, setReviewImages] = useState<File[]>([])
  const [reviewsResult, setReviewsResult] = useState<{
    productId: string
    reviews: PublicProductReview[]
    error: string
  } | null>(null)
  const [requestedOrderId, setRequestedOrderId] = useState('')
  const authToken = customer ? localStorage.getItem('ceramax:auth-token') : null
  const [eligibleOrdersResult, setEligibleOrdersResult] = useState<{
    productId: string
    orderIds: string[]
    error: string
  } | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitError, setReviewSubmitError] = useState('')
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState('')
  const completedOrders = useMemo(
    () => orders.filter((order) => order.statusCode === 'COMPLETADA'),
    [orders],
  )
  const completedOrderIds = completedOrders.map((order) => order.id).join('|')
  const matchingEligibleOrders = eligibleOrdersResult?.productId === productId
    ? completedOrders.filter((order) => (eligibleOrdersResult?.orderIds ?? []).includes(order.id))
    : []
  const selectedOrderId = matchingEligibleOrders.some((order) => order.id === requestedOrderId)
    ? requestedOrderId
    : matchingEligibleOrders[0]?.id ?? ''
  const checkingEligibleOrders = Boolean(authToken && productId && !ordersLoading
    && eligibleOrdersResult?.productId !== productId)
  const orderCheckError = eligibleOrdersResult?.productId === productId
    ? eligibleOrdersResult?.error ?? ''
    : ''
  const productReviews = reviewsResult?.productId === productId ? reviewsResult?.reviews ?? [] : []
  const reviewsLoading = Boolean(productId) && reviewsResult?.productId !== productId
  const reviewsError = reviewsResult?.productId === productId ? reviewsResult?.error ?? '' : ''
  const hasReviewedProduct = Boolean(customer?.id && productReviews.some((review) => review.clienteId === customer.id))
  const relatedProducts = useMemo(() => products
    .filter((item) => item.id !== productId && item.stock > 0)
    .sort((first, second) => {
      const firstSameCategory = first.category === product?.category
      const secondSameCategory = second.category === product?.category
      if (firstSameCategory !== secondSameCategory) return firstSameCategory ? -1 : 1
      const firstDiscounted = (first.discountPercent ?? 0) > 0
      const secondDiscounted = (second.discountPercent ?? 0) > 0
      if (firstDiscounted !== secondDiscounted) return firstDiscounted ? -1 : 1
      return first.name.localeCompare(second.name, 'es')
    })
    .slice(0, 4), [product?.category, productId, products])

  useEffect(() => {
    if (!authToken || !productId) return
    const refreshCustomerOrders = () => {
      if (document.visibilityState === 'visible') void refreshOrders(true).catch(() => undefined)
    }
    const interval = window.setInterval(refreshCustomerOrders, STORE_DATA_REFRESH_INTERVAL)
    document.addEventListener('visibilitychange', refreshCustomerOrders)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshCustomerOrders)
    }
  }, [authToken, productId, refreshOrders])

  useEffect(() => {
    if (!productId) return
    void loadProductGallery(productId, true)
    const refreshGallery = () => {
      if (document.visibilityState === 'visible') void loadProductGallery(productId, true)
    }
    const interval = window.setInterval(refreshGallery, PRODUCT_GALLERY_REFRESH_INTERVAL)
    document.addEventListener('visibilitychange', refreshGallery)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshGallery)
    }
  }, [loadProductGallery, productId])

  useEffect(() => {
    if (!productId) return
    let active = true
    void fetchPublicProductDetails(productId).then((specifications) => {
      if (!active) return
      setProductDetails({ productId, specifications, error: '' })
    }).catch((error: unknown) => {
      if (!active) return
      setProductDetails({
        productId,
        specifications: [],
        error: error instanceof Error ? error.message : 'No se pudieron cargar las especificaciones.',
      })
    })
    return () => { active = false }
  }, [productId])

  useEffect(() => {
    if (!productId) return
    let active = true
    void fetchPublicProductReviews(productId).then((result) => {
      if (active) setReviewsResult({ productId, reviews: result, error: '' })
    }).catch((error: unknown) => {
      if (!active) return
      setReviewsResult({
        productId,
        reviews: [],
        error: error instanceof Error ? error.message : 'No se pudieron cargar las reseñas.',
      })
    })
    return () => { active = false }
  }, [productId])

  useEffect(() => {
    if (!authToken || !productId || ordersLoading) return
    let active = true
    void Promise.all(completedOrders.map(async (orderSummary) => {
      try {
        const order = await loadOrderDetails(orderSummary.id)
        return {
          orderId: orderSummary.id,
          includesProduct: order.items.some((item) => item.product.id === productId),
          error: '',
        }
      } catch (error) {
        return {
          orderId: orderSummary.id,
          includesProduct: false,
          error: error instanceof Error ? error.message : `No se pudo verificar el pedido ${orderSummary.code}.`,
        }
      }
    })).then((results) => {
      if (!active) return
      const errors = results.filter((result) => result.error).map((result) => result.error)
      setEligibleOrdersResult({
        productId,
        orderIds: results.filter((result) => result.includesProduct).map((result) => result.orderId),
        error: errors.length ? `No se pudieron verificar todos tus pedidos: ${errors.join(' ')}` : '',
      })
    })
    return () => { active = false }
  }, [authToken, completedOrderIds, completedOrders, loadOrderDetails, ordersLoading, productId])

  function selectReviewImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (selected.length > 5) {
      setReviewSubmitError('Puedes adjuntar como máximo 5 imágenes por reseña.')
      return
    }
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
    if (selected.some((image) => !allowedTypes.has(image.type))) {
      setReviewSubmitError('Usa imágenes JPEG, PNG, WEBP, GIF o AVIF.')
      return
    }
    if (selected.some((image) => image.size > 10 * 1024 * 1024)) {
      setReviewSubmitError('Cada imagen debe pesar como máximo 10 MB.')
      return
    }
    if (selected.reduce((total, image) => total + image.size, 0) > 11 * 1024 * 1024) {
      setReviewSubmitError('El conjunto de imágenes debe pesar como máximo 11 MB para completar la carga.')
      return
    }
    setReviewSubmitError('')
    setReviewImages(selected)
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || !authToken || !selectedOrderId) return
    setSubmittingReview(true)
    setReviewSubmitError('')
    setReviewSubmitMessage('')
    try {
      const created = await createCustomerReview({
        productoId: product.id,
        pedidoId: selectedOrderId,
        calificacion: rating,
        comentario: comment.trim(),
      }, reviewImages, authToken)
      setReviewsResult((current) => ({
        productId: product.id,
        reviews: [created, ...(current?.productId === product.id ? current.reviews : []).filter((review) => review.id !== created.id)],
        error: '',
      }))
      setComment('')
      setRating(5)
      setReviewImages([])
      setReviewSubmitMessage('Tu reseña se publicó correctamente.')
    } catch (error) {
      setReviewSubmitError(error instanceof Error ? error.message : 'No se pudo publicar tu reseña.')
    } finally {
      setSubmittingReview(false)
    }
  }

  return {
    addToCart, authToken, catalogError, catalogLoading, categories, checkingEligibleOrders, comment, completedOrders,
    detailsError: productDetails && productDetails.productId === productId ? productDetails.error : '',
    favorites, hasReviewedProduct, matchingEligibleOrders, openAuth, orderCheckError, ordersError, ordersLoading, product,
    productCategory: categories.find((category) => category.name === product?.category),
    productReviews, productSpecifications: productDetails && productDetails.productId === productId ? productDetails.specifications : [],
    refreshCatalog, relatedProducts, rating, reviewImages, reviewSubmitError, reviewSubmitMessage,
    reviewsError, reviewsLoading, selectedImage, selectedOrderId, selectReviewImages, setComment,
    setRating, setRequestedOrderId, setReviewImages, setSelectedImage, submitReview, submittingReview, toggleFavorite,
  }
}
