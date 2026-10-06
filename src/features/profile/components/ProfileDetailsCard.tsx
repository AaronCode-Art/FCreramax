import { LogOut, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import type { CustomerProfile } from '../../../types/profile'
import styles from './ProfileDetailsCard.module.css'

interface ProfileDetailsCardProps {
  profile: CustomerProfile | null
  fallbackName: string
  fallbackEmail: string
  loading: boolean
  error: string
  onRetry: () => void
  onSignOut: () => void
}

export function ProfileDetailsCard({
  profile,
  fallbackName,
  fallbackEmail,
  loading,
  error,
  onRetry,
  onSignOut,
}: ProfileDetailsCardProps) {
  const address = profile
    ? [profile.direccion, profile.distrito, profile.provincia, profile.departamento]
        .filter(Boolean)
        .join(', ')
    : ''

  return (
    <section className={styles.card} aria-labelledby="profile-details-title">
      <div className={styles.identity}>
        <span className={styles.avatar}><UserRound size={25} /></span>
        <div className={styles.identityText}>
          <h2 id="profile-details-title">{profile ? `${profile.nombres} ${profile.apellidos}` : fallbackName}</h2>
          <p><Mail size={15} /> {profile?.email ?? fallbackEmail}</p>
        </div>
        <button type="button" className={styles.signOut} onClick={onSignOut}>
          <LogOut size={15} /> Salir
        </button>
      </div>

      {loading ? (
        <div className={styles.message} role="status">Cargando datos del perfil…</div>
      ) : error ? (
        <div className={`${styles.message} ${styles.error}`} role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>Reintentar</button>
        </div>
      ) : profile ? (
        <dl className={styles.details}>
          <div>
            <dt>Documento</dt>
            <dd>{profile.tipoDocumento} · {profile.numeroDocumento}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd><Phone size={14} /> {profile.telefono}</dd>
          </div>
          <div className={styles.address}>
            <dt>Dirección</dt>
            <dd><MapPin size={15} /> {address}{profile.codigoPostal ? ` · CP ${profile.codigoPostal}` : ''}</dd>
            {profile.referencia && <p>Referencia: {profile.referencia}</p>}
          </div>
        </dl>
      ) : null}
    </section>
  )
}
