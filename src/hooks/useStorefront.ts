import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { storeApi } from '../lib/api'
import type { CartItem, CustomerSession, Product } from '../types/store'

const DEFAULT_CATEGORY = 'Todo'

export function useStorefront() {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartLoaded, setCartLoaded] = useState(false)
  const [session, setSession] = useState<CustomerSession | null>(null)
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORY)
  const [showCart, setShowCart] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [addedProduct, setAddedProduct] = useState<Product | null>(null)
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [continueAfterLogin, setContinueAfterLogin] = useState(false)
  const [continueToCartAfterLogin, setContinueToCartAfterLogin] = useState(false)
  const [continueToProfileAfterLogin, setContinueToProfileAfterLogin] = useState(false)
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null)
  const noticeId = useRef(0)
  const pendingWishlistProductId = useRef<string | null>(null)
  const pendingCartProductId = useRef<string | null>(null)

  const notify = useCallback((message: string) => {
    noticeId.current += 1
    setNotice({ id: noticeId.current, message })
  }, [])

  const dismissNotice = useCallback((id: number) => {
    setNotice((current) => current?.id === id ? null : current)
  }, [])

  useEffect(() => {
    window.localStorage.removeItem('ceramax.customer')
    window.localStorage.removeItem('ceramax.cart')
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
      const category = new URLSearchParams(window.location.search).get('categoria')
      setActiveCategory(category || DEFAULT_CATEGORY)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((path: string) => {
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` === path) return
    window.history.pushState({}, '', path)
    setPathname(window.location.pathname)
    const category = new URLSearchParams(window.location.search).get('categoria')
    setActiveCategory(category || DEFAULT_CATEGORY)
  }, [])

  const selectCategory = useCallback((category: string) => {
    setActiveCategory(category)
    const query = category === DEFAULT_CATEGORY ? '' : `?categoria=${encodeURIComponent(category)}`
    navigate(`/productos${query}`)
  }, [navigate, notify])

  useEffect(() => {
    let active = true
    storeApi.getCatalog()
      .then((items) => {
        if (!active) return
        setProducts(items)
        setApiAvailable(true)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setProducts([])
        setApiAvailable(false)
        setCatalogError(cause instanceof Error ? cause.message : 'No pudimos conectar con la tienda. Inténtalo nuevamente.')
      })
      .finally(() => {
        if (active) setLoadingCatalog(false)
      })
    return () => {
      active = false
    }
  }, [])

  function retryCatalog() {
    setLoadingCatalog(true)
    setCatalogError('')
    storeApi.getCatalog()
      .then((items) => {
        setProducts(items)
        setApiAvailable(true)
      })
      .catch((cause: unknown) => {
        setProducts([])
        setApiAvailable(false)
        setCatalogError(cause instanceof Error ? cause.message : 'No pudimos conectar con la tienda. Inténtalo nuevamente.')
      })
      .finally(() => setLoadingCatalog(false))
  }

  useEffect(() => {
    if (!session || !apiAvailable) return
    const customer = session
    let active = true
    async function syncCustomerStore() {
      setCartLoaded(false)
      try {
        let serverCart = await storeApi.getCart(customer.token)
        const pendingCartProduct = pendingCartProductId.current
        if (pendingCartProduct) {
          serverCart = await storeApi.addCartItem(customer.token, {
            productoId: pendingCartProduct,
            cantidad: 1,
          })
          pendingCartProductId.current = null
        }

        if (!active) return
        setCart(serverCart)
        setCartLoaded(true)
        if (pendingCartProduct) {
          const product = products.find((item) => item.id === pendingCartProduct)
          if (product) setAddedProduct(product)
        }

        let savedWishlist = await storeApi.getWishlist(customer.token)
        const pendingProduct = pendingWishlistProductId.current
        if (pendingProduct) {
          savedWishlist = await storeApi.addWishlistItem(customer.token, pendingProduct)
          pendingWishlistProductId.current = null
        }
        if (!active) return
        setWishlistIds(savedWishlist)
        if (continueAfterLogin) {
          setContinueAfterLogin(false)
          navigate('/compra')
        }
        if (continueToCartAfterLogin) {
          setContinueToCartAfterLogin(false)
          setShowCart(true)
        }
      } catch (cause) {
        if (active) {
          setCartLoaded(true)
          notify(cause instanceof Error ? cause.message : 'No se pudo sincronizar tu carrito.')
        }
      }
    }
    void syncCustomerStore()
    return () => {
      active = false
    }
  }, [apiAvailable, continueAfterLogin, continueToCartAfterLogin, navigate, notify, products, session])

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es')
    return products.filter((product) => {
      const matchesCategory = activeCategory === DEFAULT_CATEGORY || product.categoria === activeCategory
      const matchesSearch = !normalizedSearch
        || `${product.nombre} ${product.categoria} ${product.descripcion ?? ''}`
          .toLocaleLowerCase('es')
          .includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, products, search])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const wishlistProducts = products.filter((product) => wishlistIds.includes(product.id))

  async function addToCart(product: Product) {
    if (Number(product.stockDisponible ?? 0) <= 0) {
      notify('Este producto no tiene stock disponible por el momento.')
      return
    }
    if (!session) {
      pendingCartProductId.current = product.id
      setShowWishlist(false)
      setShowLogin(true)
      notify('Inicia sesiÃ³n para agregar productos a tu pedido.')
      return
    }
    if (!apiAvailable) {
      notify('No pudimos conectar con la tienda. Inténtalo nuevamente. IntÃ©ntalo de nuevo mÃ¡s tarde.')
      return
    }
    try {
      setCart(await storeApi.addCartItem(session.token, { productoId: product.id, cantidad: 1 }))
      setAddedProduct(product)
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'No se pudo agregar al carrito.')
    }
  }

  async function changeQuantity(productId: string, amount: number) {
    const item = cart.find((current) => current.product.id === productId)
    if (!item) return
    const quantity = Math.min(
      Math.max(item.quantity + amount, 0),
      Number(item.product.stockDisponible ?? item.quantity + amount),
    )
    if (session && apiAvailable) {
      try {
        setCart(quantity === 0
          ? await storeApi.removeCartItem(session.token, productId)
          : await storeApi.updateCartItem(session.token, productId, quantity))
        if (quantity === 0) notify('Producto eliminado del carrito.')
      } catch (cause) {
        notify(cause instanceof Error ? cause.message : 'No se pudo actualizar el carrito.')
      }
      return
    }
    notify('Inicia sesiÃ³n y conecta con el backend para modificar el carrito.')
  }

  async function removeFromCart(productId: string) {
    if (session && apiAvailable) {
      try {
        setCart(await storeApi.removeCartItem(session.token, productId))
        notify('Producto eliminado del carrito.')
      } catch (cause) {
        notify(cause instanceof Error ? cause.message : 'No se pudo quitar el producto.')
      }
      return
    }
    notify('Inicia sesiÃ³n y conecta con el backend para modificar el carrito.')
  }

  async function toggleWishlist(product: Product) {
    if (!session) {
      pendingWishlistProductId.current = product.id
      setShowLogin(true)
      notify('Inicia sesiÃ³n para guardar productos en tu lista de deseos.')
      return
    }
    try {
      const saved = wishlistIds.includes(product.id)
        ? await storeApi.removeWishlistItem(session.token, product.id)
        : await storeApi.addWishlistItem(session.token, product.id)
      setWishlistIds(saved)
      notify(saved.includes(product.id) ? 'Producto guardado en tu lista de deseos.' : 'Producto eliminado de la lista de deseos.')
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'No se pudo actualizar tu lista de deseos.')
    }
  }

  function openCheckout() {
    if (!apiAvailable) {
      setShowCart(false)
      notify('No pudimos registrar el pedido. Inténtalo nuevamente.')
      return
    }
    if (!session) {
      setContinueAfterLogin(true)
      setShowCart(false)
      setShowLogin(true)
      return
    }
    setShowCart(false)
    navigate('/compra')
  }

  function openCart() {
    if (!session) {
      setContinueToCartAfterLogin(true)
      setShowLogin(true)
      notify('Inicia sesiÃ³n para consultar tu carrito.')
      return
    }
    if (!apiAvailable) {
      notify('No pudimos cargar tu carrito. Inténtalo nuevamente.')
      return
    }
    setShowCart(true)
  }

  const handleAuthenticated = useCallback((customer: CustomerSession) => {
    setSession(customer)
    if (continueToProfileAfterLogin) {
      setContinueToProfileAfterLogin(false)
      navigate('/miperfil')
    }
  }, [continueToProfileAfterLogin, navigate])

  const signOut = useCallback(() => {
    setSession(null)
    setCart([])
    setAddedProduct(null)
    setCartLoaded(false)
    setWishlistIds([])
    setContinueAfterLogin(false)
    setContinueToCartAfterLogin(false)
    setContinueToProfileAfterLogin(false)
    navigate('/')
    notify('SesiÃ³n cerrada.')
  }, [navigate])

  function openWishlist() {
    if (!session) {
      setShowLogin(true)
      notify('Inicia sesiÃ³n para ver tu lista de deseos.')
      return
    }
    setShowWishlist(true)
  }

  const openOrders = useCallback(() => {
    if (!session) {
      setContinueToProfileAfterLogin(true)
      setShowLogin(true)
      notify('Inicia sesiÃ³n para consultar tus pedidos.')
      return
    }
    navigate('/miperfil')
  }, [navigate, notify, session])

  const openAccount = useCallback(() => {
    if (session) {
      navigate('/miperfil')
      return
    }
    setContinueToProfileAfterLogin(true)
    setShowLogin(true)
  }, [navigate, session])

  const openProducts = useCallback(() => {
    navigate('/productos')
  }, [navigate])

  const openPurchase = useCallback(() => {
    if (!apiAvailable) {
      notify('No pudimos preparar el pago. Inténtalo nuevamente.')
      return
    }
    if (!session) {
      setContinueAfterLogin(true)
      setShowLogin(true)
      return
    }
    navigate('/compra')
  }, [apiAvailable, navigate, notify, session])

  function clearCatalogFilters() {
    setSearch('')
    setActiveCategory(DEFAULT_CATEGORY)
    if (window.location.pathname === '/productos') navigate('/productos')
  }

  return {
    activeCategory,
    addToCart,
    addedProduct,
    apiAvailable,
    cart,
    cartLoaded,
    cartCount,
    catalogError,
    categories: [DEFAULT_CATEGORY, ...new Set(products.map((product) => product.categoria))],
    changeQuantity,
    clearCatalogFilters,
    handleAuthenticated,
    loadingCatalog,
    allProducts: products,
    openCheckout,
    openCart,
    openAccount,
    openOrders,
    openProducts,
    openPurchase,
    openWishlist,
    openProfile: openAccount,
    navigate,
    pathname,
    products: visibleProducts,
    retryCatalog,
    removeFromCart,
    search,
    session,
    selectCategory,
    signOut,
    setActiveCategory,
    setAddedProduct,
    setCart,
    setSearch,
    setShowCart,
    setShowLogin,
    setShowWishlist,
    showCart,
    showLogin,
    showWishlist,
    toggleWishlist,
    notice,
    notify,
    dismissNotice,
    wishlistIds,
    wishlistProducts,
  }
}
