import { useEffect, useRef } from 'react'
import { useStore } from '../../context/StoreContext'

export function useCarritoPage() {
  const { customer, cart, setCartQuantity, removeFromCart, openAuth } = useStore()
  const promptedForLogin = useRef(false)
  const total = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  useEffect(() => {
    if (customer) {
      promptedForLogin.current = false
    } else if (!promptedForLogin.current) {
      promptedForLogin.current = true
      openAuth('login')
    }
  }, [customer, openAuth])

  return { cart, customer, openAuth, removeFromCart, setCartQuantity, total }
}
