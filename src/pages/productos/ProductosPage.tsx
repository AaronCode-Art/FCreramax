import './ProductosPage.css'
import '../catalogo/CatalogoPage.css'
import { Link } from 'react-router-dom'
import { ProductGrid } from '../../components/catalogo/ProductCard'
import { CatalogStatus } from '../../components/catalogo/CatalogStatus'
import { PageIntro } from '../../components/common/PageIntro'
import { useProductosPage } from './useProductosPage'

export default function ProductosPage() {
  const {
    activeMaxPrice,
    catalogError,
    catalogLoading,
    catalogWarning,
    categories,
    category,
    clearFilters,
    filtered,
    inStockOnly,
    maximum,
    refreshCatalog,
    search,
    setInStockOnly,
    setMaxPrice,
    setSearchParams,
    setSort,
    sort,
  } = useProductosPage()

  return (
    <section className="catalog-page page-shell">
      {category ? <div className="breadcrumbs"><Link to="/">Inicio</Link><span>/</span><Link to="/categorias">Categorías</Link><span>/</span><span>{category.name}</span></div> : null}
      <div className="products-hero">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwlQPemJcOJnlBVuOfe_0hZsWT2n5K-gMqB8JarkG9TQdT4M5T1540ZO8&s=10"
          alt=""
          aria-hidden="true"
        />
        <div className="products-hero-overlay" aria-hidden="true" />
        <PageIntro eyebrow={category ? 'Piezas hechas a mano' : 'Piezas hechas para durar'} title={category?.name ?? 'Todos los productos'}>
          {category?.note ?? 'Encuentra piezas de cerámica peruana para acompañar tu mesa y tus espacios.'}
        </PageIntro>
      </div>
      <div className="catalog-toolbar">
        <nav className="catalog-category-filters" aria-label="Filtrar por categoría">
          <Link className={`filter-chip${!category ? ' filter-chip-active' : ''}`} to="/productos">Todo</Link>
          {categories.map((item) => <Link className={`filter-chip${item.slug === category?.slug ? ' filter-chip-active' : ''}`} to={`/categoria/${item.slug}`} key={item.slug}>{item.name}</Link>)}
        </nav>
        <span className="product-count">{filtered.length} {filtered.length === 1 ? 'pieza' : 'piezas'}</span>
      </div>
      <div className="catalog-results-layout">
        <aside className="catalog-sidebar" aria-label="Filtros de productos">
          <div className="catalog-sidebar-heading"><span>Refina tu búsqueda</span><button type="button" onClick={clearFilters}>Limpiar</button></div>
          <label className="catalog-search-field"><span>Buscar productos</span><span className="catalog-search-input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input type="search" placeholder="Nombre, colección..." value={search} onChange={(event) => setSearchParams(event.target.value ? { search: event.target.value } : {})} />
          </span></label>
          <label className="catalog-sort-field"><span>Ordenar por</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recomendados</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option><option value="name">Nombre: A a Z</option></select></label>
          <label className="catalog-price-filter"><span>Precio máximo</span><output>S/ {activeMaxPrice}</output><input type="range" min="0" max={maximum} step="5" value={activeMaxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Filtrar por precio máximo" /><small>Hasta S/ {activeMaxPrice}</small></label>
          <label className="catalog-stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} /><span>Solo disponibles</span></label>
        </aside>
        {catalogLoading || catalogError
          ? <CatalogStatus loading={catalogLoading} error={catalogError} onRetry={() => { void refreshCatalog() }} />
          : <><CatalogStatus loading={false} error="" warning={catalogWarning} onRetry={() => { void refreshCatalog() }} /><ProductGrid products={filtered} /></>}
      </div>
    </section>
  )
}
