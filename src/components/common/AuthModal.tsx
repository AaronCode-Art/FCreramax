import './AuthModal.css'
import { useEffect, useState, type FormEvent } from 'react'
import { departments, districts, provinces } from '@perucode/ubigeo-peru'
import { useStore, type StoreCustomer } from '../../context/StoreContext'
import {
  completeCustomerRegistration,
  lookupCustomerForRegistration,
  loginCustomer,
} from '../../services/customerAuthApi'

const emptyCustomer: StoreCustomer = {
  name: '', firstNames: '', lastNames: '', email: '', phone: '',
  documentType: 'DNI', documentNumber: '', address: '', district: '',
  province: '', department: '', postalCode: '', ubigeo: '', reference: '',
}

const departmentOptions = departments.all()
const locationLabel = (name: string) => name.toLocaleLowerCase('es-PE').replace(/(^|[\s-])([a-záéíóúüñ])/giu, (_, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase('es-PE')}`)

export function AuthModal() {
  const { authOpen, authMode, closeAuth, openAuth, startCustomerSession, setNotice } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [customer, setCustomer] = useState<StoreCustomer>(emptyCustomer)
  const [existingRecord, setExistingRecord] = useState(false)
  const [documentLookup, setDocumentLookup] = useState('')
  const [lookupFailed, setLookupFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const selectedDepartment = departmentOptions.find((option) => option.name.toLocaleLowerCase('es-PE') === customer.department.toLocaleLowerCase('es-PE'))
  const provinceOptions = selectedDepartment ? provinces.byRegionId(selectedDepartment.id) : []
  const selectedProvince = provinceOptions.find((option) => option.name.toLocaleLowerCase('es-PE') === customer.province.toLocaleLowerCase('es-PE'))
  const districtOptions = selectedProvince ? districts.byProvinceId(selectedProvince.id) : []
  const selectedDistrict = districtOptions.find((option) => option.name.toLocaleLowerCase('es-PE') === customer.district.toLocaleLowerCase('es-PE'))

  useEffect(() => {
    if (!authOpen) return
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeAuth() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = oldOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [authOpen, closeAuth])

  useEffect(() => {
    if (!authOpen || authMode !== 'register') return
    setExistingRecord(false)
    setDocumentLookup('')
    setCustomer(emptyCustomer)
    setPassword('')
  }, [authOpen, authMode])

  useEffect(() => {
    if (!authOpen || authMode !== 'register') return
    const number = customer.documentNumber.trim()
    const valid = customer.documentType === 'DNI'
      ? /^[0-9]{8}$/.test(number)
      : customer.documentType === 'RUC'
        ? /^[0-9]{11}$/.test(number)
        : /^[A-Za-z0-9]{1,20}$/.test(number)
    if (!valid) {
      setDocumentLookup('')
      setLookupFailed(false)
      return
    }

    let active = true
    setLookupFailed(false)
    setDocumentLookup('Buscando datos registrados…')
    const timeout = window.setTimeout(() => {
      void lookupCustomerForRegistration(customer.documentType, number).then((profile) => {
        if (!active) return
        if (profile) {
          setCustomer((current) => ({ ...profile, email: profile.email || current.email }))
          setExistingRecord(true)
          setDocumentLookup('Encontramos tus datos registrados. Revísalos y completa tu correo y contraseña.')
          setNotice('Encontramos tus datos registrados para este documento.')
        } else {
          setExistingRecord(false)
          setDocumentLookup('No encontramos datos previos. Completa tus datos para crear tu cuenta.')
        }
      }).catch((lookupError: unknown) => {
        if (!active) return
        setExistingRecord(false)
        setDocumentLookup('')
        setLookupFailed(true)
        showError(lookupError instanceof Error ? lookupError.message : 'No se pudieron buscar tus datos.')
      })
    }, 450)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [authOpen, authMode, customer.documentType, customer.documentNumber])

  if (!authOpen) return null

  const clearRegistration = () => {
    setExistingRecord(false)
    setDocumentLookup('')
    setCustomer(emptyCustomer)
    setPassword('')
  }

  const setField = <K extends keyof StoreCustomer>(key: K, value: StoreCustomer[K]) => {
    setCustomer((current) => ({ ...current, [key]: value }))
  }

  const showError = (message: string) => {
    setError(message)
    setNotice(message)
  }

  const validateDocument = () => {
    const number = customer.documentNumber.trim()
    const valid = customer.documentType === 'DNI'
      ? /^[0-9]{8}$/.test(number)
      : customer.documentType === 'RUC'
        ? /^[0-9]{11}$/.test(number)
        : /^[A-Za-z0-9]{1,20}$/.test(number)
    if (!valid) showError('Verifica el tipo y número de documento antes de continuar.')
    return valid
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (authMode === 'login') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
        showError('Ingresa un correo válido y tu contraseña.')
        return
      }
    } else {
      if (!validateDocument()) return
      if (lookupFailed) {
        showError('No se pudieron consultar los datos del documento. Inténtalo nuevamente antes de crear la cuenta.')
        return
      }
      if (documentLookup.startsWith('Buscando')) {
        showError('Espera a que termine la búsqueda de datos por documento.')
        return
      }
      if (!/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u.test(customer.firstNames.trim())
        || !/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u.test(customer.lastNames.trim())) {
        showError('Ingresa nombres y apellidos válidos.')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
        showError('Ingresa un correo electrónico válido.')
        return
      }
      if (!/^9[0-9]{8}$/.test(customer.phone)) {
        showError('El celular debe empezar con 9 y tener exactamente 9 dígitos.')
        return
      }
      if (password.length < 8 || password.length > 100) {
        showError('La contraseña debe tener entre 8 y 100 caracteres.')
        return
      }
      if (!customer.address.trim() || !customer.department || !customer.province || !customer.district
        || !/^[0-9]{5}$/.test(customer.postalCode) || !customer.reference.trim()) {
        showError('Completa la dirección, ubicación, código postal de 5 dígitos y referencia.')
        return
      }
    }
    setBusy(true)
    try {
      if (authMode === 'login') {
        const session = await loginCustomer(email, password)
        startCustomerSession(session.customer, session.token)
        setPassword('')
        return
      }

      const ubigeo = selectedDistrict?.ineiCode ?? customer.ubigeo
      if (!ubigeo) {
        showError('Selecciona departamento, provincia y distrito para obtener el ubigeo.')
        return
      }
      const registrationData = { ...customer, ubigeo, name: `${customer.firstNames} ${customer.lastNames}`.trim(), password }
      await completeCustomerRegistration(registrationData, existingRecord)
      const session = await loginCustomer(customer.email, password)
      startCustomerSession(session.customer, session.token)
      setPassword('')
    } catch (submitError) {
      showError(submitError instanceof Error ? submitError.message : 'No se pudo completar la solicitud.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeAuth()
    }}>
      <section className={`auth-modal auth-modal-${authMode}`} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close" type="button" aria-label="Cerrar" onClick={closeAuth}>×</button>
        <div className="auth-modal-art">
          <div className="auth-brand-lockup">
            <span>CERÁMAX</span>
            <small>CERÁMICA PERUANA</small>
          </div>
          <div className="auth-art-copy">
            <span>HECHO EN PERÚ</span>
            <h3>Piezas únicas para los momentos de cada día.</h3>
            <p>Diseño artesanal con identidad y carácter propio.</p>
          </div>
          <span className="auth-art-index">COLECCIÓN CERÁMAX · 01</span>
        </div>
        <div className="auth-modal-main">
          <p className="eyebrow">Tu espacio Cerámax</p>
          <h2 id="auth-title">{authMode === 'login' ? 'Qué gusto tenerte de vuelta.' : 'Crea tu cuenta y descubre.'}</h2>
          <p className="auth-modal-description">Guarda tus piezas favoritas y consulta tus pedidos desde un solo lugar.</p>
          <div className="auth-modal-tabs" role="tablist" aria-label="Acceso a la cuenta">
            <button type="button" role="tab" aria-selected={authMode === 'login'} className={authMode === 'login' ? 'auth-tab-active' : ''} onClick={() => { setError(''); openAuth('login') }}>Iniciar sesión</button>
            <button type="button" role="tab" aria-selected={authMode === 'register'} className={authMode === 'register' ? 'auth-tab-active' : ''} onClick={() => { setError(''); clearRegistration(); openAuth('register') }}>Crear cuenta</button>
          </div>
          <form className="auth-form customer-form" noValidate onSubmit={submit}>
            {authMode === 'register' && (
              <div className="register-fields">
                <div className="document-fields">
                  <label>Tipo de documento<select value={customer.documentType} onChange={(event) => {
                    const documentType = event.target.value as StoreCustomer['documentType']
                    setCustomer((current) => existingRecord
                      ? { ...emptyCustomer, documentType, documentNumber: current.documentNumber }
                      : { ...current, documentType })
                    setExistingRecord(false)
                  }}><option>DNI</option><option>RUC</option><option>CE</option><option>PASAPORTE</option></select></label>
                  <label>Número de documento<input required value={customer.documentNumber} onChange={(event) => {
                    const documentNumber = event.target.value
                    setCustomer((current) => existingRecord
                      ? { ...emptyCustomer, documentType: current.documentType, documentNumber }
                      : { ...current, documentNumber })
                    setExistingRecord(false)
                  }} /></label>
                </div>
                {documentLookup && <p className="auth-success" role="status">{documentLookup}</p>}
                <div className="register-name-fields">
                  <label>Nombres<input required autoComplete="given-name" value={customer.firstNames} onChange={(event) => setField('firstNames', event.target.value)} /></label>
                  <label>Apellidos<input required autoComplete="family-name" value={customer.lastNames} onChange={(event) => setField('lastNames', event.target.value)} /></label>
                </div>
                <label>Teléfono<input required autoComplete="tel" inputMode="numeric" maxLength={9} pattern="9[0-9]{8}" title="Ingresa un celular peruano de 9 dígitos que empiece con 9" value={customer.phone} onChange={(event) => setField('phone', event.target.value.replace(/\D/g, '').slice(0, 9))} /></label>
                <label>Dirección<input required autoComplete="street-address" value={customer.address} onChange={(event) => setField('address', event.target.value)} /></label>
                <div className="register-address-fields">
                  <label>Departamento<select required value={locationLabel(customer.department)} onChange={(event) => { setField('department', event.target.value); setField('province', ''); setField('district', ''); setField('ubigeo', '') }}><option value="">Seleccionar</option>{departmentOptions.map((option) => <option key={option.id} value={locationLabel(option.name)}>{locationLabel(option.name)}</option>)}</select></label>
                  <label>Provincia<select required value={locationLabel(customer.province)} disabled={!selectedDepartment} onChange={(event) => { setField('province', event.target.value); setField('district', ''); setField('ubigeo', '') }}><option value="">Seleccionar</option>{provinceOptions.map((option) => <option key={option.id} value={locationLabel(option.name)}>{locationLabel(option.name)}</option>)}</select></label>
                  <label>Distrito<select required value={locationLabel(customer.district)} disabled={!selectedProvince} onChange={(event) => { const district = districtOptions.find((option) => option.name.toLocaleLowerCase('es-PE') === event.target.value.toLocaleLowerCase('es-PE')); setField('district', event.target.value); setField('ubigeo', district?.ineiCode ?? '') }}><option value="">Seleccionar</option>{districtOptions.map((option) => <option key={option.id} value={locationLabel(option.name)}>{locationLabel(option.name)}</option>)}</select></label>
                </div>
                <div className="register-address-codes">
                  <label>Código postal<input required autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} title="Ingresa un código postal de 5 dígitos" value={customer.postalCode} onChange={(event) => setField('postalCode', event.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="Ej. 15001" /></label>
                  <label>Ubigeo (INEI)<input required readOnly value={selectedDistrict?.ineiCode ?? customer.ubigeo} placeholder="Selecciona un distrito" /></label>
                </div>
                <label className="register-reference-field">Referencia<input required autoComplete="address-line2" value={customer.reference} onChange={(event) => setField('reference', event.target.value)} placeholder="Piso, interior o punto de referencia" /></label>
              </div>
            )}
            <div className="register-account-fields">
              <label>Correo electrónico<input required type="email" autoComplete="email" value={authMode === 'login' ? email : customer.email} onChange={(event) => authMode === 'login' ? setEmail(event.target.value) : setField('email', event.target.value)} /></label>
              <label>Contraseña<input required type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={100} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            </div>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="button button-dark auth-submit-button" type="submit" disabled={busy}>
              {busy ? 'Procesando…' : authMode === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'}<span aria-hidden="true">→</span>
            </button>
            <p className="customer-form-note">{authMode === 'login' ? 'Usa el correo y la contraseña de tu cuenta Cerámax.' : 'Tus datos se validan y guardan de forma segura en Cerámax.'}</p>
          </form>
        </div>
      </section>
    </div>
  )
}
