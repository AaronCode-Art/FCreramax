import { ProductCard } from '../../catalog/ProductCard'
import { useProductRecommendations } from '../hooks/useProductRecommendations'
import type { PedidoResponse, Product } from '../../../types/store'
import styles from './ProductRecommendations.module.css'

interface ProductRecommendationsProps {
  products: Product[]
  orders: PedidoResponse[]
  wishlistIds: string[]
  onAddToCart: (product: Product) => void
  onToggleWishlist: (product: Product) => void
  onOpenProductDetail: (product: Product) => void
}

export function ProductRecommendations({
  products,
  orders,
  wishlistIds,
  onAddToCart,
  onToggleWishlist,
  onOpenProductDetail,
}: ProductRecommendationsProps) {
  const recommendations = useProductRecommendations(products, orders)

  if (recommendations.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby="recommendations-title">
      <p className="eyebrow">Inspiración para tu próximo proyecto</p>
      <h2 id="recommendations-title">También te puede interesar</h2>
      <p className={styles.description}>Una selección de productos disponibles para descubrir.</p>
      <div className={styles.grid}>
        {recommendations.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlistIds.includes(product.id)}
            onAdd={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            onOpenDetail={onOpenProductDetail}
          />
        ))}
      </div>
    </section>
  )
}
