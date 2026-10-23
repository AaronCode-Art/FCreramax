import { useStore } from '../../context/StoreContext'

export function useContactoPage() {
  const { customer, orders, openAuth } = useStore()
  return { customer, orders, openAuth }
}
