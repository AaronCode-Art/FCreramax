import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { StorePageLayout } from '../../components/layout/StorePageLayout'
import { CheckoutDialog } from '../checkout/CheckoutDialog'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'

export function CompraPage() {
  const store = useStorefrontContext()
  const [orderCompleted, setOrderCompleted] = useState(false)

  return (
    <StorePageLayout>
      {store.session && !store.cartLoaded ? (
        <section className="mx-auto flex min-h-[55vh] w-[92%] max-w-2xl flex-col items-center justify-center py-16 text-center">
          <ShoppingBag size={34} className="text-stone-400" />
          <h1 className="mt-5 font-display text-3xl text-ink">Cargando tu carrito…</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">Estamos consultando tus productos.</p>
        </section>
      ) : store.session && (store.cart.length > 0 || orderCompleted) ? (
        <CheckoutDialog
          customer={store.session}
          items={store.cart}
          apiAvailable={store.apiAvailable}
          pageMode
          onOrderComplete={() => {
            store.setCart([])
            setOrderCompleted(true)
          }}
          onOpenOrders={() => store.navigate('/miperfil')}
          onOpenReceipt={(orderId) => store.navigate(`/boleta/${encodeURIComponent(orderId)}`)}
          onClose={() => store.navigate('/productos')}
        />
      ) : (
        <section className="mx-auto flex min-h-[55vh] w-[92%] max-w-2xl flex-col items-center justify-center py-16 text-center">
          <ShoppingBag size={34} className="text-stone-400" />
          <h1 className="mt-5 font-display text-3xl text-ink">{store.cart.length === 0 ? 'Tu carrito está vacío.' : 'Cargando tu carrito…'}</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">Agrega productos desde el catálogo para continuar con tu compra.</p>
          <button type="button" onClick={() => store.navigate('/productos')} className="primary-button mt-6">Explorar productos</button>
        </section>
      )}
    </StorePageLayout>
  )
}
