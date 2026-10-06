import { StorePageLayout } from '../../components/layout/StorePageLayout'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'
import { ProductCatalogSection } from '../catalog/ProductCatalogSection'
import { HeroSection } from '../storefront/components/HeroSection'
import { InspirationSection } from '../storefront/components/InspirationSection'
import type { Product } from '../../types/store'

export function InicioPage() {
  const store = useStorefrontContext()
  const openDetail = (product: Product) => store.navigate(`/detalleproducto/${encodeURIComponent(product.id)}`)

  return (
    <StorePageLayout>
      <HeroSection onExplore={() => store.navigate('/productos')} />
      <ProductCatalogSection
        categories={store.categories}
        activeCategory={store.activeCategory}
        products={store.allProducts}
        loading={store.loadingCatalog}
        error={store.catalogError}
        wishlistIds={store.wishlistIds}
        onRetry={store.retryCatalog}
        onCategoryChange={store.selectCategory}
        onAddToCart={store.addToCart}
        onToggleWishlist={store.toggleWishlist}
        onClearFilters={store.clearCatalogFilters}
        onOpenDetail={openDetail}
      />
      <InspirationSection onExplore={() => store.navigate('/productos')} />
    </StorePageLayout>
  )
}
