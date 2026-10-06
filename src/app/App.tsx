import { useEffect, type ReactNode } from 'react'
import { StorefrontOverlays } from '../components/layout/StorefrontOverlays'
import { StorefrontProvider } from '../context/StorefrontProvider'
import { useStorefrontContext } from '../hooks/useStorefrontContext'
import { InicioPage } from '../features/inicio/InicioPage'
import { ProductosPage } from '../features/productos/ProductosPage'
import { CategoriasPage } from '../features/categorias/CategoriasPage'
import { DetalleProductoPage } from '../features/detalleproducto/DetalleProductoPage'
import { ContactoPage } from '../features/contacto/ContactoPage'
import { MiPerfilPage } from '../features/miperfil/MiPerfilPage'
import { CompraPage } from '../features/compra/CompraPage'
import { BoletaPage } from '../features/boleta/BoletaPage'

function AppContent() {
  const storefront = useStorefrontContext()
  const { pathname, session, openProfile, openPurchase } = storefront
  const route = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
  const isProfilePage = route === '/miperfil'
  const isPurchasePage = route === '/compra'
  const isReceiptPage = route.startsWith('/boleta/')
  const isProtectedPage = isProfilePage || isPurchasePage || isReceiptPage

  useEffect(() => {
    if (!isProtectedPage || session) return
    if (isPurchasePage) {
      openPurchase()
      return
    }
    openProfile()
  }, [isProtectedPage, isPurchasePage, openProfile, openPurchase, session])

  let page: ReactNode
  if (isProtectedPage && !session) page = <InicioPage />
  else if (route === '/productos') page = <ProductosPage />
  else if (route === '/categorias') page = <CategoriasPage />
  else if (route === '/contacto' || route === '/quienessomos') page = <ContactoPage />
  else if (route === '/miperfil') page = <MiPerfilPage />
  else if (route === '/compra') page = <CompraPage />
  else if (route.startsWith('/detalleproducto/')) {
    page = <DetalleProductoPage productId={route.slice('/detalleproducto/'.length)} />
  } else if (route.startsWith('/boleta/')) {
    page = <BoletaPage orderId={route.slice('/boleta/'.length)} />
  } else page = <InicioPage />

  return (
    <>
      {page}
      <StorefrontOverlays />
    </>
  )
}

export default function App() {
  return (
    <StorefrontProvider>
      <AppContent />
    </StorefrontProvider>
  )
}
