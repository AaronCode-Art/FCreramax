import './Catalog.css'
import { EmptyState } from '../common/EmptyState'
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
    return <EmptyState
      title="No pudimos cargar el catálogo"
      description={error}
      action={<button className="button button-dark" type="button" onClick={onRetry}>Reintentar</button>}
    />
  }
  if (warning) return <p className="catalog-warning" role="status">{warning}</p>
  return null
}
