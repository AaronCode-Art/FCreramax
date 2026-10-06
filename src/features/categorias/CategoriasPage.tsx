import { ArrowRight } from 'lucide-react'
import { StorePageLayout } from '../../components/layout/StorePageLayout'
import { useStorefrontContext } from '../../hooks/useStorefrontContext'
import styles from './CategoriasPage.module.css'

export function CategoriasPage() {
  const store = useStorefrontContext()
  const categories = store.categories.slice(1)

  return (
    <StorePageLayout>
      <section className={`mx-auto w-[92%] py-16 lg:py-20 ${styles.page}`}>
        <p className="eyebrow">Encuentra tu estilo</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Explora por categoría.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">Elige una colección para descubrir todos sus productos.</p>
        {store.loadingCatalog ? (
          <p className="mt-10 text-sm text-stone-500">Cargando categorías…</p>
        ) : store.catalogError ? (
          <div className="mt-10 rounded bg-white p-8 text-sm text-red-700" role="alert">
            <p>No se pudieron cargar las categorías: {store.catalogError}</p>
            <button type="button" onClick={store.retryCatalog} className="secondary-button mt-4">Reintentar</button>
          </div>
        ) : categories.length ? (
          <div className={styles.grid}>
            {categories.map((category) => {
              const count = store.allProducts.filter((product) => product.categoria === category).length
              return (
                <button key={category} type="button" onClick={() => store.selectCategory(category)} className={styles.card}>
                  <span className={styles.cardTitle}>{category}</span>
                  <span className={styles.cardMeta}>{count} {count === 1 ? 'producto' : 'productos'} <ArrowRight size={16} /></span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="mt-10 rounded bg-white p-8 text-sm text-stone-500">No hay categorías disponibles en el catálogo.</p>
        )}
      </section>
    </StorePageLayout>
  )
}
