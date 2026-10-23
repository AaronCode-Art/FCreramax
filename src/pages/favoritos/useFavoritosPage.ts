import { useEffect, useRef } from 'react'
import { useStore } from '../../context/StoreContext'

export function useFavoritosPage() {
  const { customer, favorites, openAuth, products, catalogLoading, catalogError, catalogWarning, refreshCatalog } = useStore()
  const promptedForLogin = useRef(false)
  const favoriteProducts = products.filter((product) => favorites.includes(product.slug))

  useEffect(() => {
    if (customer) {
      promptedForLogin.current = false
    } else if (!promptedForLogin.current) {
      promptedForLogin.current = true
      openAuth('login')
    }
  }, [customer, openAuth])

  return {
    catalogError,
    catalogLoading,
    catalogWarning,
    favoriteProducts,
    openAuth,
    refreshCatalog,
    customer,
  }
}
