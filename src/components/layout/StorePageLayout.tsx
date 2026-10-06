import type { ReactNode } from 'react'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'

export function StorePageLayout({ children }: { children: ReactNode }) {
  const store = useStorefrontContext()

  function updateSearch(value: string) {
    store.setSearch(value)
    if (value && store.pathname !== '/productos') store.navigate('/productos')
  }

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-ink">
      <SiteHeader
        cartCount={store.cartCount}
        wishlistCount={store.wishlistProducts.length}
        customer={store.session}
        categories={store.categories}
        search={store.search}
        onSearchChange={updateSearch}
        onOpenCart={store.openCart}
        onOpenWishlist={store.openWishlist}
        onOpenOrders={store.openOrders}
        onOpenAccount={store.openAccount}
        onNavigate={store.navigate}
        onSelectCategory={store.selectCategory}
      />
      <main>{children}</main>
      <SiteFooter onNavigate={store.navigate} />
    </div>
  )
}
