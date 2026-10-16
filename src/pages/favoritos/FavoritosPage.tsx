import './FavoritosPage.css'
import { Link } from 'react-router-dom'
import { CatalogStatus } from '../../components/catalogo/CatalogStatus'
import { ProductGrid } from '../../components/catalogo/ProductCard'
import { PageIntro } from '../../components/common/PageIntro'
import { useFavoritosPage } from './useFavoritosPage'

export default function FavoritosPage() {
  const { catalogError, catalogLoading, catalogWarning, favoriteProducts, openAuth, refreshCatalog, customer } = useFavoritosPage()

  return (
    <section className="customer-page page-shell">
      <PageIntro eyebrow="Cuenta" title="Lista de deseos">
        Guarda aquí las piezas que quieres volver a encontrar.
      </PageIntro>
      {!customer ? (
        <div className="customer-empty">
          <h2>Inicia sesión para guardar tus favoritos</h2>
          <p>Al iniciar sesión con tu cuenta de cliente, tus favoritos se sincronizan con tu cuenta.</p>
          <button className="button button-dark" type="button" onClick={() => openAuth('login')}>Iniciar sesión</button>
        </div>
      ) : catalogLoading || catalogError ? (
        <CatalogStatus loading={catalogLoading} error={catalogError} onRetry={() => { void refreshCatalog() }} />
      ) : favoriteProducts.length ? (
        <><CatalogStatus loading={false} error="" warning={catalogWarning} onRetry={() => { void refreshCatalog() }} /><ProductGrid products={favoriteProducts} /></>
      ) : (
        <div className="customer-empty">
          <h2>Tu lista está esperando nuevas piezas</h2>
          <p>Selecciona el corazón en cualquier producto para guardarlo aquí.</p>
          <Link className="button button-dark" to="/productos">Explorar productos</Link>
        </div>
      )}
    </section>
  )
}
