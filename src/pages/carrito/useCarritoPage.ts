import { useEffect, useRef } from 'react'
import { useStore } from '../../context/StoreContext'

export function useCarritoPage() {
  const { customer, cart, setCartQuantity, removeFromCart, addToCart, notify, openAuth } = useStore()
  const promptedForLogin = useRef(false)
  const total = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const units = cart.reduce((sum, line) => sum + line.quantity, 0)

  useEffect(() => {
    if (customer) {
      promptedForLogin.current = false
    } else if (!promptedForLogin.current) {
      promptedForLogin.current = true
      openAuth('login')
    }
  }, [customer, openAuth])

  return { addToCart, cart, customer, notify, openAuth, removeFromCart, setCartQuantity, total, units }
}
