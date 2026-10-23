import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import fallbackProductImage from '../assets/product-image-unavailable.svg'
import { getRandomCategoryImage } from './categoryImages'
import { fetchPublicCatalog, fetchPublicProductGallery, PRODUCT_GALLERY_REFRESH_INTERVAL, STORE_DATA_REFRESH_INTERVAL, type PublicProductGalleryImage, type PublicProductSpecification } from '../services/catalogApi'
import { API_UNAUTHORIZED_EVENT, ApiError } from '../services/api'
import { fetchCustomerProfile, updateCustomerDeliveryProfile } from '../services/customerAuthApi'
import {
  addCustomerCartItem,
  clearCustomerCart,
  fetchCustomerCart,
  removeCustomerCartItem,
  updateCustomerCartItem,
  type CustomerCartItem,
} from '../services/customerCartApi'
import {
  addCustomerWishlistItem,
  fetchCustomerWishlist,
  removeCustomerWishlistItem,
} from '../services/customerWishlistApi'
import {
  createCustomerOrder as postCustomerOrder,
  fetchCustomerOrder,
  fetchCustomerOrders,
  type CustomerCheckoutRequest,
  type CustomerOrderDetail,
  type CustomerOrderSummary,
} from '../services/customerOrdersApi'

export type StoreCategory = {
  slug: string
  name: string
  note: string
  image: string
}

export type StoreProduct = {
  id: string
  name: string
  slug: string
  category: string
  collection: string
  description: string
  price: number
  originalPrice?: number
  discountPercent?: number
  stock: number
  image: string
  badge?: string
  material: string
  dimensions: string
  technique: string
  specifications?: PublicProductSpecification[]
  gallery: PublicProductGalleryImage[]
}

export type StoreCustomer = {
  id?: string
  name: string
  firstNames: string
  lastNames: string
  email: string
  phone: string
  documentType: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE'
  documentNumber: string
  address: string
  district: string
  province: string
  department: string
  postalCode: string
  ubigeo: string
  reference: string
}

export type StoreAccount = StoreCustomer & { password: string }
export type StoreCartLine = { product: StoreProduct; quantity: number }
export type StoreOrder = {
  id: string
  code: string
  serie: string | null
  numeroComprobante: string | null
  createdAt: string
  statusCode: string
  status: string
  delivery: 'DELIVERY' | 'RECOJO_TIENDA'
  customer: StoreCustomer
  deliveryRecipient: string
  deliveryPhone: string
  storeBranchName: string
  storeBranchAddress: string
  address: string
  deliveryAddress: Pick<StoreCustomer, 'address' | 'district' | 'province' | 'department' | 'postalCode' | 'ubigeo' | 'reference'>
  receiptType: 'BOLETA' | 'FACTURA'
  businessRuc: string
  businessName: string
  payment: string
  items: StoreCartLine[]
  subtotal?: number
  igv?: number
  shippingCost?: number
  total: number
  couponCode?: string | null
  couponDiscount?: number
}

function mapOrderSummary(order: CustomerOrderSummary, customer: StoreCustomer): StoreOrder {
  const deliveryAddress = order.datosEntrega
  const delivery = order.tipoEntrega === 'DELIVERY' ? 'DELIVERY' : 'RECOJO_TIENDA'
  const address = delivery === 'DELIVERY'
    ? [deliveryAddress?.direccion, deliveryAddress?.distrito, deliveryAddress?.provincia, deliveryAddress?.departamento].filter(Boolean).join(', ')
    : deliveryAddress?.sucursalDireccion ?? ''
  return {
    id: order.id,
    code: order.codigo,
    serie: order.serie,
    numeroComprobante: order.numeroComprobante,
    createdAt: order.createdAt,
    statusCode: order.estadoCodigo,
    status: order.estadoNombre,
    delivery,
    customer,
    deliveryRecipient: deliveryAddress?.destinatario ?? '',
    deliveryPhone: deliveryAddress?.telefono ?? '',
    storeBranchName: deliveryAddress?.sucursalNombre ?? '',
    storeBranchAddress: deliveryAddress?.sucursalDireccion ?? '',
    address,
    deliveryAddress: {
      address: deliveryAddress?.direccion ?? '',
      district: deliveryAddress?.distrito ?? '',
      province: deliveryAddress?.provincia ?? '',
      department: deliveryAddress?.departamento ?? '',
      postalCode: deliveryAddress?.codigoPostal ?? '',
      ubigeo: '',
      reference: deliveryAddress?.referencia ?? '',
    },
    receiptType: order.tipoComprobante === 'FACTURA' ? 'FACTURA' : 'BOLETA',
    businessRuc: '',
    businessName: '',
    payment: 'YAPE',
    items: [],
    total: order.total,
  }
}

function mapOrderDetail(order: CustomerOrderDetail, customer: StoreCustomer, products: StoreProduct[]): StoreOrder {
  const summary = mapOrderSummary(order, customer)
  const payment = order.pagos[0]?.metodoPago
  return {
    ...summary,
    customer,
    businessRuc: order.ruc ?? '',
    businessName: order.razonSocial ?? '',
    payment: payment ?? 'No registrado',
    couponCode: order.codigoCupon,
    couponDiscount: order.descuentoCupon,
    subtotal: order.subtotal,
    igv: order.igv,
    shippingCost: order.costoEnvio,
    items: order.detalles.map((line) => {
      const product = products.find((item) => item.id === line.productoId)
      return {
        quantity: line.cantidad,
        product: product
          ? { ...product, price: line.precioUnitario }
          : {
              id: line.productoId ?? line.id,
              slug: line.productoCodigo ?? line.id,
              name: line.productoNombre,
              category: line.categoriaNombre ?? 'Producto',
              collection: line.productoCodigo ?? '',
              description: '',
              price: line.precioUnitario,
              stock: 0,
              image: line.imagenUrl ?? fallbackProductImage,
              gallery: [],
              material: 'Cerámica artesanal',
              dimensions: 'Consulta los detalles de la pieza',
              technique: 'Elaboración artesanal',
            },
      }
    }),
  }
}
export type StoreReview = {
  id: string
  productId: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

const categoryPresets: Pick<StoreCategory, 'name' | 'note'>[] = [
  { name: 'Baños', note: 'Detalles de cerámica para renovar el baño' },
  { name: 'Tazas', note: 'Rituales de cada mañana' },
  { name: 'Platos', note: 'Mesas con identidad' },
  { name: 'Vajillas', note: 'Piezas para vestir tu mesa' },
  { name: 'Bowls', note: 'Formas para compartir' },
  { name: 'Jarrones', note: 'Volúmenes con presencia' },
  { name: 'Velas', note: 'Luz cálida para tus espacios' },
  { name: 'Portavelas', note: 'Cerámica que acompaña la luz' },
  { name: 'Velas y portavelas', note: 'Luz cálida en piezas de cerámica' },
  { name: 'Macetas', note: 'Naturaleza dentro de casa' },
  { name: 'Decoración', note: 'Objetos que guardan memoria' },
]

type StoreContextValue = {
  products: StoreProduct[]
  categories: StoreCategory[]
  catalogLoading: boolean
  catalogError: string
  catalogWarning: string
  refreshCatalog: (silent?: boolean) => Promise<void>
  loadProductGallery: (productId: string, force?: boolean) => Promise<void>
  customer: StoreCustomer | null
  cart: StoreCartLine[]
  favorites: string[]
  orders: StoreOrder[]
  ordersLoading: boolean
  ordersError: string
  reviews: StoreReview[]
  accounts: StoreAccount[]
  authOpen: boolean
  authMode: 'login' | 'register'
  notice: string
  setNotice: (message: string) => void
  openAuth: (mode?: 'login' | 'register') => void
  closeAuth: () => void
  login: (email: string, password: string) => string | null
  register: (account: StoreAccount) => string | null
  startCustomerSession: (customer: StoreCustomer, token: string) => void
  logout: () => void
  updateCustomer: (customer: StoreCustomer) => void
  updateCustomerDeliveryData: (customer: StoreCustomer) => Promise<void>
  addToCart: (product: StoreProduct, quantity?: number) => void
  setCartQuantity: (slug: string, quantity: number) => void
  removeFromCart: (slug: string) => void
  clearCart: () => void
  toggleFavorite: (product: StoreProduct) => void
  refreshOrders: (silent?: boolean) => Promise<void>
  loadOrderDetails: (orderId: string) => Promise<StoreOrder>
  createCustomerOrder: (request: CustomerCheckoutRequest) => Promise<StoreOrder>
  addReview: (review: StoreReview) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)
const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch (error) {
    console.error(`No se pudieron recuperar los datos locales de ${key}.`, error)
    return fallback
  }
}
const customerKey = (email: string, key: string) => `ceramax:${key}:${email.trim().toLowerCase()}`
const sessionTokenKey = 'ceramax:auth-token'
const sessionProfileKey = 'ceramax:auth-profile'
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const normalizeCategory = (value: string) => slugify(value)
function mapCatalogProduct(
  product: Awaited<ReturnType<typeof fetchPublicCatalog>>[number],
  gallery: PublicProductGalleryImage[],
): StoreProduct {
  const price = product.precioFinal ?? product.precio
  const image = gallery.find((item) => item.isPrimary)?.url ?? gallery[0]?.url ?? product.imagenUrl
  return {
    id: product.id,
    slug: `${slugify(product.nombre) || 'producto'}-${product.id.slice(0, 8)}`,
    name: product.nombre,
    category: product.categoria,
    collection: product.codigo,
    description: product.descripcion ?? '',
    price,
    originalPrice: product.precio,
    discountPercent: product.descuentoPorcentaje ?? 0,
    stock: product.stockDisponible,
    image: image ?? fallbackProductImage,
    gallery,
    ...(product.descuentoPorcentaje && product.descuentoPorcentaje > 0
      ? { badge: `-${product.descuentoPorcentaje}%` }
      : {}),
    material: 'Cerámica artesanal',
    dimensions: 'Consulta los detalles de la pieza',
    technique: 'Elaboración artesanal',
  }
}

function mapCustomerCart(items: CustomerCartItem[], products: StoreProduct[]): StoreCartLine[] {
  return items.map(({ product, quantity }) => {
    const catalogProduct = products.find((item) => item.id === product.id)
    const storeProduct: StoreProduct = catalogProduct
      ? {
          ...catalogProduct,
          price: product.precioFinal ?? product.precio,
          originalPrice: product.precio,
          discountPercent: product.descuentoPorcentaje ?? 0,
          stock: product.stockDisponible,
        }
      : {
          id: product.id,
          name: product.nombre,
          slug: `${slugify(product.nombre) || 'producto'}-${product.id.slice(0, 8)}`,
          category: product.categoria,
          collection: product.codigo,
          description: product.descripcion,
          price: product.precioFinal ?? product.precio,
          originalPrice: product.precio,
          discountPercent: product.descuentoPorcentaje ?? 0,
          stock: product.stockDisponible,
          image: fallbackProductImage,
          gallery: [],
          material: 'Cerámica artesanal',
          dimensions: 'Consulta los detalles de la pieza',
          technique: 'Elaboración artesanal',
        }
    return { product: storeProduct, quantity }
  })
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const productsRef = useRef<StoreProduct[]>([])
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const categoryImages = useRef(new Map<string, string>())
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const catalogWarning = ''
  const galleryRequests = useRef(new Map<string, Promise<PublicProductGalleryImage[]>>())
  const loadedGalleries = useRef(new Map<string, number>())
  const galleryQueue = useRef<Promise<void>>(Promise.resolve())
  const galleryLastRequestAt = useRef(0)
  const catalogRefreshInProgress = useRef(false)
  const ordersRefreshInProgress = useRef(false)
  const [accounts, setAccounts] = useState<StoreAccount[]>(() => read('ceramax:accounts', []))
  const [customer, setCustomer] = useState<StoreCustomer | null>(() => {
    if (localStorage.getItem(sessionTokenKey)) {
      const profile = read<StoreCustomer | null>(sessionProfileKey, null)
      if (profile) return profile
    }
    const email = localStorage.getItem('ceramax:current-email')
    const account = email ? read<StoreAccount[]>('ceramax:accounts', []).find((item) => item.email.toLowerCase() === email.toLowerCase()) : undefined
    if (!account) return null
    const { password: _password, ...profile } = account
    return { ...profile, postalCode: account.postalCode ?? '', ubigeo: account.ubigeo ?? '' }
  })
  const [cart, setCart] = useState<StoreCartLine[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [reviews, setReviews] = useState<StoreReview[]>(() => read('ceramax:reviews', []))
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [notice, setNotice] = useState('')
  const openAuth = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])
  const refreshCatalog = useCallback(async (silent = false) => {
    if (catalogRefreshInProgress.current) return
    catalogRefreshInProgress.current = true
    if (!silent) {
      setCatalogLoading(true)
      setCatalogError('')
    }
    try {
      const apiProducts = await fetchPublicCatalog()
      const catalog = apiProducts.map((product) => {
        const refreshedProduct = mapCatalogProduct(product, [])
        const currentProduct = productsRef.current.find((item) => item.id === product.id)
        if (!currentProduct) return refreshedProduct
        if (currentProduct.image !== fallbackProductImage || !product.imagenUrl) {
          refreshedProduct.image = currentProduct.image
        }
        refreshedProduct.gallery = currentProduct.gallery
        const unchanged = currentProduct.slug === refreshedProduct.slug
          && currentProduct.image === refreshedProduct.image
          && currentProduct.name === refreshedProduct.name
          && currentProduct.category === refreshedProduct.category
          && currentProduct.collection === refreshedProduct.collection
          && currentProduct.description === refreshedProduct.description
          && currentProduct.price === refreshedProduct.price
          && currentProduct.originalPrice === refreshedProduct.originalPrice
          && currentProduct.discountPercent === refreshedProduct.discountPercent
          && currentProduct.stock === refreshedProduct.stock
          && currentProduct.badge === refreshedProduct.badge
        return unchanged ? currentProduct : refreshedProduct
      })
      const categoryNames = [...new Set(catalog.map((product) => product.category))]
      const currentProducts = productsRef.current
      if (catalog.length !== currentProducts.length
        || catalog.some((product, index) => product !== currentProducts[index])) {
        setProducts(catalog)
      }
      setCatalogError('')
      setCategories(categoryNames.map((name) => {
        const preset = categoryPresets.find((category) => normalizeCategory(category.name) === normalizeCategory(name))
        const categoryKey = normalizeCategory(name)
        let image = categoryImages.current.get(categoryKey)
        if (!image) {
          image = getRandomCategoryImage(name)
          categoryImages.current.set(categoryKey, image)
        }
        return {
          slug: slugify(name),
          name,
          note: preset?.note ?? 'Piezas de cerámica peruana hechas para tus espacios',
          image,
        }
      }))
    } catch (error) {
      if (silent) {
        console.error('No se pudo actualizar el catálogo en segundo plano.', error)
      } else {
        setProducts([])
        setCategories([])
        setCatalogError(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.')
      }
    } finally {
      catalogRefreshInProgress.current = false
      if (!silent) setCatalogLoading(false)
    }
  }, [])

  const loadProductGallery = useCallback(async (productId: string, force = false) => {
    const loadedAt = loadedGalleries.current.get(productId)
    const cacheDuration = force ? 60 * 1000 : PRODUCT_GALLERY_REFRESH_INTERVAL
    if (loadedAt && Date.now() - loadedAt < cacheDuration) return
    const existingRequest = galleryRequests.current.get(productId)
    if (existingRequest) {
      await existingRequest
      return
    }

    const request = galleryQueue.current.then(async () => {
      const waitForThrottle = 250 - (Date.now() - galleryLastRequestAt.current)
      if (waitForThrottle > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, waitForThrottle))
      }
      galleryLastRequestAt.current = Date.now()
      return fetchPublicProductGallery(productId)
    })
    galleryQueue.current = request.then(() => undefined, () => undefined)
    galleryRequests.current.set(productId, request)
    try {
      const gallery = await request
      loadedGalleries.current.set(productId, Date.now())
      if (gallery.length) {
        const image = gallery.find((item) => item.isPrimary)?.url ?? gallery[0].url
        setProducts((current) => current.map((item) => {
          if (item.id !== productId) return item
          const unchanged = item.image === image
            && item.gallery.length === gallery.length
            && item.gallery.every((oldImage, index) =>
              oldImage.url === gallery[index].url && oldImage.isPrimary === gallery[index].isPrimary,
            )
          return unchanged ? item : { ...item, gallery, image }
        }))
      }
    } catch (error) {
      console.error(`No se pudo cargar la galería del producto ${productId}.`, error)
    } finally {
      galleryRequests.current.delete(productId)
    }
  }, [])

  useEffect(() => {
    productsRef.current = products
  }, [products])

  useEffect(() => {
    void refreshCatalog()
  }, [refreshCatalog])

  useEffect(() => {
    const refreshVisibleData = () => {
      if (document.visibilityState === 'visible') void refreshCatalog(true)
    }
    const interval = window.setInterval(refreshVisibleData, STORE_DATA_REFRESH_INTERVAL)
    document.addEventListener('visibilitychange', refreshVisibleData)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshVisibleData)
    }
  }, [refreshCatalog])

  useEffect(() => {
    const token = localStorage.getItem(sessionTokenKey)
    if (!token) return

    let active = true
    void fetchCustomerProfile(token).then((profile) => {
      if (!active) return
      localStorage.setItem(sessionProfileKey, JSON.stringify(profile))
      localStorage.setItem('ceramax:current-email', profile.email)
      setCustomer(profile)
    }).catch((error: unknown) => {
      if (!active || (error instanceof ApiError && error.status === 401)) return
      console.error('No se pudo validar la sesión del cliente.', error)
      setNotice('No se pudo validar tu sesión con Cerámax. Comprueba tu conexión.')
    })

    return () => { active = false }
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(sessionTokenKey)
      localStorage.removeItem(sessionProfileKey)
      localStorage.removeItem('ceramax:current-email')
      setCustomer(null)
      setNotice('Tu sesión venció. Inicia sesión nuevamente.')
    }
    window.addEventListener(API_UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(API_UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  useEffect(() => {
    if (!customer) {
      setCart([])
      setFavorites([])
      setOrders([])
      setOrdersLoading(false)
      setOrdersError('')
      return
    }
    const token = localStorage.getItem(sessionTokenKey)
    if (token) {
      let active = true
      setFavorites([])
      void fetchCustomerCart(token).then((items) => {
        if (active) setCart(mapCustomerCart(items, products))
      }).catch((error: unknown) => {
        if (!active || (error instanceof ApiError && error.status === 401)) return
        console.error('No se pudo recuperar el carrito del cliente.', error)
        setNotice(error instanceof Error ? error.message : 'No se pudo cargar el carrito desde la API.')
      })
      void fetchCustomerWishlist(token).then((productIds) => {
        if (active) setFavorites(products.filter((product) => productIds.includes(product.id)).map((product) => product.slug))
      }).catch((error: unknown) => {
        if (!active || (error instanceof ApiError && error.status === 401)) return
        console.error('No se pudo recuperar la lista de deseos del cliente.', error)
        setNotice(error instanceof Error ? error.message : 'No se pudo cargar la lista de deseos desde la API.')
      })
      setOrdersLoading(true)
      setOrdersError('')
      void fetchCustomerOrders(token).then((result) => {
        if (active) setOrders(result.map((order) => mapOrderSummary(order, customer)))
      }).catch((error: unknown) => {
        if (!active || (error instanceof ApiError && error.status === 401)) return
        console.error('No se pudo recuperar el historial de pedidos del cliente.', error)
        if (active) setOrdersError(error instanceof Error ? error.message : 'No se pudo cargar el historial de pedidos.')
      }).finally(() => {
        if (active) setOrdersLoading(false)
      })
      return () => { active = false }
    }
    setCart(read(customerKey(customer.email, 'cart'), []))
    setFavorites(read(customerKey(customer.email, 'favorites'), []))
    setOrders([])
    setOrdersError('')
    setOrdersLoading(false)
  }, [customer, products])

  const refreshOrders = useCallback(async (silent = false) => {
    const token = localStorage.getItem(sessionTokenKey)
    if (!token || !customer) {
      setOrders([])
      return
    }
    if (ordersRefreshInProgress.current) return
    ordersRefreshInProgress.current = true
    if (!silent) {
      setOrdersLoading(true)
      setOrdersError('')
    }
    try {
      const result = await fetchCustomerOrders(token)
      setOrders(result.map((order) => mapOrderSummary(order, customer)))
      setOrdersError('')
    } catch (error) {
      console.error('No se pudo actualizar el historial de pedidos del cliente.', error)
      const message = error instanceof Error ? error.message : 'No se pudo cargar el historial de pedidos.'
      setOrdersError(message)
      throw error
    } finally {
      ordersRefreshInProgress.current = false
      if (!silent) setOrdersLoading(false)
    }
  }, [customer])

  const loadOrderDetails = useCallback(async (orderId: string) => {
    const token = localStorage.getItem(sessionTokenKey)
    if (!token || !customer) throw new Error('Inicia sesión para consultar el detalle del pedido.')
    return mapOrderDetail(await fetchCustomerOrder(orderId, token), customer, products)
  }, [customer, products])

  const submitCustomerOrder = useCallback(async (request: CustomerCheckoutRequest) => {
    const token = localStorage.getItem(sessionTokenKey)
    if (!token || !customer) throw new Error('Inicia sesión con tu cuenta para registrar el pedido.')
    const created = await postCustomerOrder(request, token)
    const order = mapOrderDetail(created, customer, products)
    setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)])
    setCart([])
    setNotice(`Pedido ${order.code} registrado correctamente. Puedes consultar su estado en Mis pedidos.`)
    return order
  }, [customer, products])

  const persist = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`No se pudieron guardar los datos locales de ${key}.`, error)
      setNotice('No se pudieron guardar los cambios en este navegador.')
      return false
    }
  }

  const value = useMemo<StoreContextValue>(() => ({
    products, categories, catalogLoading, catalogError, catalogWarning, refreshCatalog, loadProductGallery,
    customer, cart, favorites, orders, ordersLoading, ordersError, reviews, accounts, authOpen, authMode, notice, setNotice,
    openAuth,
    closeAuth: () => setAuthOpen(false),
    login: (email, password) => {
      const account = accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password)
      if (!account) return 'Correo o contraseña incorrectos.'
      const { password: _password, ...profile } = account
      const compatibleProfile = { ...profile, postalCode: account.postalCode ?? '', ubigeo: account.ubigeo ?? '' }
      localStorage.setItem('ceramax:current-email', compatibleProfile.email)
      setCustomer(compatibleProfile)
      setAuthOpen(false)
      setNotice(`¡Bienvenido, ${compatibleProfile.firstNames || compatibleProfile.name}!`)
      return null
    },
    register: (account) => {
      if (accounts.some((item) => item.email.toLowerCase() === account.email.trim().toLowerCase())) return 'Ya existe una cuenta con ese correo.'
      if (accounts.some((item) => item.documentNumber === account.documentNumber && item.documentType === account.documentType)) return 'Ya existe una cuenta con ese documento.'
      const updated = [...accounts, account]
      if (!persist('ceramax:accounts', updated)) return 'No se pudo guardar la cuenta en este navegador.'
      setAccounts(updated)
      const { password: _password, ...profile } = account
      localStorage.setItem('ceramax:current-email', profile.email)
      setCustomer(profile)
      setAuthOpen(false)
      setNotice('Tu cuenta local se creó correctamente.')
      return null
    },
    startCustomerSession: (profile, token) => {
      localStorage.setItem(sessionTokenKey, token)
      localStorage.setItem(sessionProfileKey, JSON.stringify(profile))
      localStorage.setItem('ceramax:current-email', profile.email)
      setCustomer(profile)
      setAuthOpen(false)
      setNotice(`¡Bienvenido, ${profile.firstNames}!`)
    },
    logout: () => {
      localStorage.removeItem(sessionTokenKey)
      localStorage.removeItem(sessionProfileKey)
      localStorage.removeItem('ceramax:current-email')
      setCustomer(null)
      setNotice('Se cerró tu sesión.')
    },
    updateCustomer: (profile) => {
      const updated = accounts.map((account) => account.email.toLowerCase() === profile.email.toLowerCase() ? { ...account, ...profile } : account)
      if (persist('ceramax:accounts', updated)) {
        setAccounts(updated)
        setCustomer(profile)
        setNotice('Tus datos se actualizaron en este navegador.')
      }
    },
    updateCustomerDeliveryData: async (profile) => {
      const token = localStorage.getItem(sessionTokenKey)
      const savedProfile = token
        ? await updateCustomerDeliveryProfile(profile, token)
        : profile
      const updated = accounts.map((account) => account.email.toLowerCase() === savedProfile.email.toLowerCase()
        ? { ...account, ...savedProfile }
        : account)
      if (persist('ceramax:accounts', updated)) setAccounts(updated)
      if (token) localStorage.setItem(sessionProfileKey, JSON.stringify(savedProfile))
      setCustomer(savedProfile)
    },
    addToCart: (product, quantity = 1) => {
      if (!customer) { setAuthMode('login'); setAuthOpen(true); return }
      const token = localStorage.getItem(sessionTokenKey)
      if (token) {
        void addCustomerCartItem(product.id, quantity, token).then((items) => {
          setCart(mapCustomerCart(items, products))
          setNotice(`${product.name} se agregó a tu carrito.`)
        }).catch((error: unknown) => {
          console.error('No se pudo agregar el producto al carrito de la API.', error)
          setNotice(error instanceof Error ? error.message : 'No se pudo agregar el producto al carrito.')
        })
        return
      }
      const next = cart.some((line) => line.product.slug === product.slug)
        ? cart.map((line) => line.product.slug === product.slug ? { ...line, quantity: Math.min(product.stock, line.quantity + quantity) } : line)
        : [...cart, { product, quantity: Math.min(product.stock, quantity) }]
      if (persist(customerKey(customer.email, 'cart'), next)) {
        setCart(next)
        setNotice(`${product.name} se agregó a tu carrito.`)
      }
    },
    setCartQuantity: (slug, quantity) => {
      if (!customer) return
      const token = localStorage.getItem(sessionTokenKey)
      const line = cart.find((item) => item.product.slug === slug)
      if (token && line) {
        void updateCustomerCartItem(line.product.id, quantity, token).then((items) => {
          setCart(mapCustomerCart(items, products))
        }).catch((error: unknown) => {
          console.error('No se pudo actualizar la cantidad del carrito de la API.', error)
          setNotice(error instanceof Error ? error.message : 'No se pudo actualizar el carrito.')
        })
        return
      }
      const next = cart.map((line) => line.product.slug === slug ? { ...line, quantity: Math.max(1, Math.min(line.product.stock, quantity)) } : line)
      if (persist(customerKey(customer.email, 'cart'), next)) setCart(next)
    },
    removeFromCart: (slug) => {
      if (!customer) return
      const token = localStorage.getItem(sessionTokenKey)
      const line = cart.find((item) => item.product.slug === slug)
      if (token && line) {
        void removeCustomerCartItem(line.product.id, token).then((items) => {
          setCart(mapCustomerCart(items, products))
        }).catch((error: unknown) => {
          console.error('No se pudo eliminar el producto del carrito de la API.', error)
          setNotice(error instanceof Error ? error.message : 'No se pudo eliminar el producto del carrito.')
        })
        return
      }
      const next = cart.filter((line) => line.product.slug !== slug)
      if (persist(customerKey(customer.email, 'cart'), next)) setCart(next)
    },
    clearCart: () => {
      if (!customer) return
      const token = localStorage.getItem(sessionTokenKey)
      if (token) {
        void clearCustomerCart(token).then(() => setCart([])).catch((error: unknown) => {
          console.error('No se pudo vaciar el carrito de la API.', error)
          setNotice(error instanceof Error ? error.message : 'No se pudo vaciar el carrito.')
        })
        return
      }
      if (persist(customerKey(customer.email, 'cart'), [])) setCart([])
    },
    toggleFavorite: (product) => {
      if (!customer) { setAuthMode('login'); setAuthOpen(true); return }
      const exists = favorites.includes(product.slug)
      const token = localStorage.getItem(sessionTokenKey)
      if (token) {
        const updateWishlist = exists
          ? removeCustomerWishlistItem(product.id, token)
          : addCustomerWishlistItem(product.id, token)
        void updateWishlist.then((productIds) => {
          setFavorites(products.filter((item) => productIds.includes(item.id)).map((item) => item.slug))
          setNotice(exists ? 'Se quitó de tu lista de deseos.' : 'Se agregó a tu lista de deseos.')
        }).catch((error: unknown) => {
          console.error('No se pudo actualizar la lista de deseos en la API.', error)
          setNotice(error instanceof Error ? error.message : 'No se pudo actualizar la lista de deseos.')
        })
        return
      }
      const next = exists ? favorites.filter((slug) => slug !== product.slug) : [...favorites, product.slug]
      if (persist(customerKey(customer.email, 'favorites'), next)) {
        setFavorites(next)
        setNotice(exists ? 'Se quitó de tu lista de deseos.' : 'Se agregó a tu lista de deseos.')
      }
    },
    refreshOrders,
    loadOrderDetails,
    createCustomerOrder: submitCustomerOrder,
    addReview: (review) => {
      const next = [review, ...reviews]
      if (persist('ceramax:reviews', next)) setReviews(next)
    },
  }), [products, categories, catalogLoading, catalogError, catalogWarning, refreshCatalog, loadProductGallery, customer, cart, favorites, orders, ordersLoading, ordersError, reviews, accounts, authOpen, authMode, notice, openAuth, refreshOrders, loadOrderDetails, submitCustomerOrder])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore debe usarse dentro de StoreProvider.')
  return context
}
