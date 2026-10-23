import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/common/EmptyState'

export default function NoEncontradoPage() {
  return (
    <section className="customer-page page-shell">
      <EmptyState
        title="No encontramos esta página"
        description="La dirección puede haber cambiado o no estar disponible."
        action={<Link className="button button-dark" to="/">Ir al inicio</Link>}
      />
    </section>
  )
}
