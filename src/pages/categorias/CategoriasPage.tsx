import './CategoriasPage.css'
import '../catalogo/CatalogoPage.css'
import { Link } from 'react-router-dom'
import { ProductGrid } from '../../components/catalogo/ProductCard'
import { CatalogStatus } from '../../components/catalogo/CatalogStatus'
import { PageIntro } from '../../components/common/PageIntro'
import { useCategoriasPage } from './useCategoriasPage'

export default function CategoriasPage() {
  const {
    activeMaxPrice,
    catalogError,
    catalogLoading,
    catalogWarning,
    categories,
    clearFilters,
    filtered,
    inStockOnly,
    maximum,
    products,
    refreshCatalog,
    search,
    selected,
    setInStockOnly,
    setMaxPrice,
    setSearchParams,
    setSort,
    sort,
  } = useCategoriasPage()
  if (catalogLoading || catalogError) return <section className="categories-page page-shell"><CatalogStatus loading={catalogLoading} error={catalogError} onRetry={() => { void refreshCatalog() }} /></section>
  if (selected) {
    return (
      <section className="catalog-page page-shell">
        <CatalogStatus loading={false} error="" warning={catalogWarning} onRetry={() => { void refreshCatalog() }} />
        <div className="breadcrumbs"><Link to="/">Inicio</Link><span>/</span><Link to="/categorias">Categorías</Link><span>/</span><span>{selected.name}</span></div>
        <div className="category-products-hero">
          <img
            src="https://res.cloudinary.com/dfmveqhud/image/upload/v1791741810/lucid-origin_ahora_un_banner_de_categoria_de_ceramacia_decorativo_nada_de_letras_solo_imagen_-0_v5wbxw.jpg"
            alt=""
            aria-hidden="true"
          />
          <div className="category-products-hero-overlay" aria-hidden="true" />
          <PageIntro eyebrow="Piezas hechas a mano" title={selected.name}>
            {selected.note}. Descubre piezas únicas hechas en nuestro taller.
          </PageIntro>
        </div>
        <div className="catalog-toolbar">
          <nav className="catalog-category-filters" aria-label="Filtrar por categoría">
            <Link className="filter-chip" to="/productos">Todo</Link>
            {categories.map((category) => <Link className={`filter-chip${category.slug === selected.slug ? ' filter-chip-active' : ''}`} to={`/categoria/${category.slug}`} key={category.slug}>{category.name}</Link>)}
          </nav>
          <span className="product-count">{filtered.length} {filtered.length === 1 ? 'pieza' : 'piezas'}</span>
        </div>
        <div className="catalog-results-layout">
          <aside className="catalog-sidebar" aria-label={`Filtros de ${selected.name}`}>
            <div className="catalog-sidebar-heading"><span>Refina tu búsqueda</span><button type="button" onClick={clearFilters}>Limpiar</button></div>
            <label className="catalog-search-field"><span>Buscar productos</span><span className="catalog-search-input-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
              <input type="search" placeholder="Nombre, colección..." value={search} onChange={(event) => setSearchParams(event.target.value ? { search: event.target.value } : {})} />
            </span></label>
            <label className="catalog-sort-field"><span>Ordenar por</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recomendados</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option><option value="name">Nombre: A a Z</option></select></label>
            <label className="catalog-price-filter"><span>Precio máximo</span><output>S/ {activeMaxPrice}</output><input type="range" min="0" max={maximum} step="5" value={activeMaxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Filtrar por precio máximo" /><small>Hasta S/ {activeMaxPrice}</small></label>
            <label className="catalog-stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} /><span>Solo disponibles</span></label>
          </aside>
          <ProductGrid products={filtered} />
        </div>
      </section>
    )
  }
  return (
    <section className="categories-page page-shell">
      <CatalogStatus loading={false} error="" warning={catalogWarning} onRetry={() => { void refreshCatalog() }} />
      <PageIntro eyebrow="Encuentra tu forma favorita" title="Explora las categorías">Cada familia reúne piezas hechas a mano en nuestro taller, con formas y acabados propios.</PageIntro>
      <div className="category-directory">
        {categories.map((category, index) => {
          const count = products.filter((product) => product.category === category.name).length
          return <Link className="directory-card" to={`/categoria/${category.slug}`} key={category.slug}>
            <div className="directory-image"><img src={category.image} alt="" loading="lazy" /></div>
            <div className="directory-content">
              <span className="directory-index">{String(index + 1).padStart(2, '0')} · {count} {count === 1 ? 'pieza' : 'piezas'}</span>
              <h2>{category.name}</h2><p>{category.note}. Descubre las piezas de esta colección.</p>
              <span className="text-link">Ver categoría <span aria-hidden="true">→</span></span>
            </div>
          </Link>
        })}
      </div>
    </section>
  )
}
