import styles from './ProductFilters.module.css'

export type ProductSortOrder = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc'

export interface ProductFilterValues {
  category: string
  minimumPrice: string
  maximumPrice: string
  inStockOnly: boolean
  sortOrder: ProductSortOrder
}

function isProductSortOrder(value: string): value is ProductSortOrder {
  return value === 'relevance' || value === 'price-asc' || value === 'price-desc' || value === 'name-asc'
}

interface ProductFiltersProps {
  categories: string[]
  values: ProductFilterValues
  minimumAvailablePrice: number
  maximumAvailablePrice: number
  onChange: (values: ProductFilterValues) => void
  onClear: () => void
}

export function ProductFilters({
  categories,
  values,
  minimumAvailablePrice,
  maximumAvailablePrice,
  onChange,
  onClear,
}: ProductFiltersProps) {
  return (
    <form className={styles.filters} aria-label="Filtros de productos" onSubmit={(event) => event.preventDefault()}>
      <label className={styles.field}>
        Categoría
        <select
          className={styles.input}
          value={values.category}
          onChange={(event) => onChange({ ...values, category: event.target.value })}
        >
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </label>

      <fieldset className={styles.field}>
        <legend>Precio (S/)</legend>
        <div className={styles.priceRange}>
          <input
            aria-label="Precio mínimo"
            className={styles.input}
            type="number"
            min={minimumAvailablePrice}
            max={maximumAvailablePrice}
            step="0.01"
            placeholder={`Desde ${minimumAvailablePrice.toFixed(2)}`}
            value={values.minimumPrice}
            onChange={(event) => onChange({ ...values, minimumPrice: event.target.value })}
          />
          <input
            aria-label="Precio máximo"
            className={styles.input}
            type="number"
            min={minimumAvailablePrice}
            max={maximumAvailablePrice}
            step="0.01"
            placeholder={`Hasta ${maximumAvailablePrice.toFixed(2)}`}
            value={values.maximumPrice}
            onChange={(event) => onChange({ ...values, maximumPrice: event.target.value })}
          />
        </div>
      </fieldset>

      <label className={styles.field}>
        Ordenar por
        <select
          className={styles.input}
          value={values.sortOrder}
          onChange={(event) => {
            const sortOrder = event.target.value
            if (isProductSortOrder(sortOrder)) onChange({ ...values, sortOrder })
          }}
        >
          <option value="relevance">Relevancia</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A a Z</option>
        </select>
      </label>

      <div className={styles.field}>
        <span>Disponibilidad</span>
        <label className={styles.availability}>
          <input
            type="checkbox"
            checked={values.inStockOnly}
            onChange={(event) => onChange({ ...values, inStockOnly: event.target.checked })}
          />
          Solo productos en stock
        </label>
      </div>

      <div className={styles.filterActions}>
        <button type="button" className={styles.clearButton} onClick={onClear}>
          Limpiar filtros
        </button>
      </div>
    </form>
  )
}
