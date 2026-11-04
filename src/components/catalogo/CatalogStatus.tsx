import './Catalog.css'
import { LoadingState } from '../common/LoadingState'

export function CatalogStatus({
  loading,
  error,
  warning,
  onRetry,
}: {
  loading: boolean
  error: string
  warning?: string
  onRetry: () => void
}) {
  if (loading) {
    return <LoadingState title="Cargando catálogo" description="Estamos preparando las piezas disponibles." />
  }
  if (error) {
    return <section className="catalog-error" role="alert">
      <span className="catalog-error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 8v5M12 16.5v.01" /><path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /></svg>
      </span>
      <p>No se cargaron los datos. Inténtalo de nuevo.</p>
      <button className="button button-dark" type="button" onClick={onRetry}>Intentar de nuevo</button>
    </section>
  }
  if (warning) return <p className="catalog-warning" role="status">{warning}</p>
  return null
}
