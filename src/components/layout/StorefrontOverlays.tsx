import { AuthDialog } from '../../features/auth/AuthDialog'
import { CartDrawer } from '../../features/cart/CartDrawer'
import { AddedToCartDialog } from '../../features/cart/AddedToCartDialog'
import { WishlistDrawer } from '../../features/wishlist/WishlistDrawer'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'
import { NotificationIsland } from './NotificationIsland'

export function StorefrontOverlays() {
  const storefront = useStorefrontContext()
  const notice = storefront.notice

  return (
    <>
      {storefront.showCart && (
        <CartDrawer
          items={storefront.cart}
          onClose={() => storefront.setShowCart(false)}
          onChangeQuantity={storefront.changeQuantity}
          onRemove={storefront.removeFromCart}
          onCheckout={storefront.openCheckout}
        />
      )}
      {storefront.showWishlist && (
        <WishlistDrawer
          products={storefront.wishlistProducts}
          onClose={() => storefront.setShowWishlist(false)}
          onRemove={(product) => { void storefront.toggleWishlist(product) }}
          onAddToCart={(product) => { void storefront.addToCart(product) }}
        />
      )}
      {storefront.showLogin && (
        <AuthDialog
          onClose={() => storefront.setShowLogin(false)}
          onAuthenticated={storefront.handleAuthenticated}
          onNotify={storefront.notify}
        />
      )}
      {storefront.addedProduct && (
        <AddedToCartDialog
          product={storefront.addedProduct}
          onClose={() => storefront.setAddedProduct(null)}
          onContinueShopping={() => storefront.setAddedProduct(null)}
          onGoToCheckout={() => {
            storefront.setAddedProduct(null)
            storefront.openPurchase()
          }}
        />
      )}
      {notice && (
        <NotificationIsland
          key={notice.id}
          message={notice.message}
          onDismiss={() => storefront.dismissNotice(notice.id)}
        />
      )}
    </>
  )
}
