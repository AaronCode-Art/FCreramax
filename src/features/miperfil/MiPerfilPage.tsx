import { StorePageLayout } from '../../components/layout/StorePageLayout'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'
import { OrderHistorySection } from '../orders/components/OrderHistorySection'
import { useCustomerOrders } from '../orders/hooks/useCustomerOrders'
import { ProfileDetailsCard } from '../profile/components/ProfileDetailsCard'
import { useCustomerProfile } from '../profile/hooks/useCustomerProfile'
import { ProductRecommendations } from '../storefront/components/ProductRecommendations'
import type { CustomerSession } from '../../types/store'
import styles from './MiPerfilPage.module.css'

export function MiPerfilPage() {
  const storefront = useStorefrontContext()
  if (!storefront.session) return null
  return <AuthenticatedProfilePage customer={storefront.session} />
}

function AuthenticatedProfilePage({ customer }: { customer: CustomerSession }) {
  const storefront = useStorefrontContext()
  const profile = useCustomerProfile(customer)
  const orderHistory = useCustomerOrders(customer)

  return (
    <StorePageLayout>
      <main className={styles.main}>
        <header className={styles.pageHeading}>
          <p className="eyebrow">Cerámax · Mi cuenta</p>
          <h1>Mi perfil</h1>
          <p>Consulta tus datos, revisa tus compras y sigue cada pedido hasta su entrega.</p>
        </header>
        <div className={styles.accountGrid}>
          <ProfileDetailsCard
            profile={profile.profile}
            fallbackName={`${customer.nombres} ${customer.apellidos}`}
            fallbackEmail={customer.email}
            loading={profile.loading}
            error={profile.error}
            onRetry={profile.refresh}
            onSignOut={storefront.signOut}
          />
          <OrderHistorySection
            orders={orderHistory.orders}
            loading={orderHistory.loading}
            error={orderHistory.error}
            downloadingOrderId={orderHistory.downloadingOrderId}
            onRefresh={() => { void orderHistory.refresh() }}
            onDownloadReceipt={(order) => { void orderHistory.downloadReceipt(order) }}
            onViewReceipt={(order) => storefront.navigate(`/boleta/${encodeURIComponent(order.id)}`)}
          />
        </div>
        <ProductRecommendations
          products={storefront.allProducts}
          orders={orderHistory.orders}
          wishlistIds={storefront.wishlistIds}
          onAddToCart={(product) => { void storefront.addToCart(product) }}
          onToggleWishlist={(product) => { void storefront.toggleWishlist(product) }}
          onOpenProductDetail={(product) => storefront.navigate(`/detalleproducto/${encodeURIComponent(product.id)}`)}
        />
      </main>
    </StorePageLayout>
  )
}
