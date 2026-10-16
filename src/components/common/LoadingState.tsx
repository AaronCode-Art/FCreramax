import './LoadingState.css'
import { Vase3D } from '../motion/Vase3D'

export function LoadingState({
  title = 'Preparando la tienda',
  description = 'Estamos cargando las piezas para ti.',
}: {
  title?: string
  description?: string
}) {
  return (
    <section className="store-loading" role="status" aria-live="polite">
      <div className="store-loading-vase"><Vase3D size={104} /></div>
      <div className="store-loading-copy">
        <strong>{title}</strong>
        <p>{description}</p>
        <span className="store-loading-track" aria-hidden="true"><span /></span>
      </div>
    </section>
  )
}
