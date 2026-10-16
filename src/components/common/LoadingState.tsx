import './LoadingState.css'
export function LoadingState({
  title = 'Preparando la tienda',
  description = 'Estamos cargando las piezas para ti.',
}: {
  title?: string
  description?: string
}) {
  return (
    <section className="store-loading" role="status" aria-live="polite">
      <span className="store-loading-mark" aria-hidden="true">C</span>
      <div className="store-loading-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <span className="store-loading-track" aria-hidden="true"><span /></span>
    </section>
  )
}
