import './MiCuentaPage.css'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import { useMiCuentaPage } from './useMiCuentaPage'

export default function MiCuentaPage() {
  const { cancelEditing, customer, editing, error, logout, openAuth, orders, profile, saveProfile, setField, startEditing } = useMiCuentaPage()

  if (!customer) {
    return (
      <section className="customer-page page-shell">
        <PageIntro eyebrow="Cuenta" title="Mi cuenta">Accede para consultar y actualizar tus datos.</PageIntro>
        <div className="customer-empty"><h2>Tu espacio Cerámax</h2><p>Inicia sesión o crea una cuenta para guardar tus favoritos y pedidos en este navegador.</p><button className="button button-dark" type="button" onClick={() => openAuth('login')}>Iniciar sesión</button></div>
      </section>
    )
  }

  return (
    <section className="customer-page page-shell">
      <PageIntro eyebrow="Cuenta" title="Mi cuenta">Administra tus datos y vuelve rápidamente a tus compras.</PageIntro>
      <div className="account-page-actions"><Link className="text-link" to="/pedidos">Ver mis pedidos ({orders.length})</Link><button className="text-button" type="button" onClick={logout}>Cerrar sesión</button></div>
      {editing && profile ? (
        <form className="customer-form account-edit-form" onSubmit={saveProfile}>
          <label>Nombres<input required autoComplete="given-name" value={profile.firstNames} onChange={(event) => setField('firstNames', event.target.value)} /></label>
          <label>Apellidos<input required autoComplete="family-name" value={profile.lastNames} onChange={(event) => setField('lastNames', event.target.value)} /></label>
          <label>Correo electrónico<input readOnly type="email" autoComplete="email" value={profile.email} /></label>
          <label>Teléfono<input required autoComplete="tel" value={profile.phone} onChange={(event) => setField('phone', event.target.value)} /></label>
          <label>Tipo de documento<input readOnly value={profile.documentType} /></label>
          <label>Número de documento<input readOnly value={profile.documentNumber} /></label>
          <label className="account-address-field">Dirección<input autoComplete="street-address" value={profile.address} onChange={(event) => setField('address', event.target.value)} /></label>
          <label>Distrito<input value={profile.district} onChange={(event) => setField('district', event.target.value)} /></label>
          <label>Provincia<input value={profile.province} onChange={(event) => setField('province', event.target.value)} /></label>
          <label>Departamento<input value={profile.department} onChange={(event) => setField('department', event.target.value)} /></label>
          <label>Código postal<input inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={profile.postalCode} onChange={(event) => setField('postalCode', event.target.value.replace(/\D/g, '').slice(0, 5))} /></label>
          <label>Ubigeo (INEI)<input readOnly value={profile.ubigeo} /></label>
          <label className="account-address-field">Referencia<input value={profile.reference} onChange={(event) => setField('reference', event.target.value)} /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="account-form-actions"><button className="button button-dark" type="submit">Guardar cambios</button><button className="button button-light" type="button" onClick={cancelEditing}>Cancelar</button></div>
        </form>
      ) : (
        <div className="profile-card">
          <div><span>Nombre</span><strong>{customer.name}</strong></div>
          <div><span>Correo electrónico</span><strong>{customer.email}</strong></div>
          <div><span>Teléfono</span><strong>{customer.phone || 'Sin registrar'}</strong></div>
          <div><span>Documento</span><strong>{customer.documentType} · {customer.documentNumber}</strong></div>
          <div><span>Dirección de entrega</span><strong>{[customer.address, customer.district, customer.province, customer.department].filter(Boolean).join(', ') || 'Sin registrar'}</strong></div>
          <div><span>Código postal · Ubigeo</span><strong>{[customer.postalCode, customer.ubigeo].filter(Boolean).join(' · ') || 'Sin registrar'}</strong></div>
          <div><span>Referencia</span><strong>{customer.reference || 'Sin referencia'}</strong></div>
          <button className="button button-light" type="button" onClick={startEditing}>Editar mis datos</button>
        </div>
      )}
    </section>
  )
}
