import './AuthModal.css'
import { useEffect, useState, type FormEvent } from 'react'
import { departments, districts, provinces } from '@perucode/ubigeo-peru'
import { useStore, type StoreCustomer } from '../../context/StoreContext'
import {
  completeCustomerRegistration,
  lookupCustomerForRegistration,
  loginCustomer,
  requestCustomerPasswordRecovery,
  resetCustomerPassword,
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
  const [recoveryMode, setRecoveryMode] = useState<'request' | 'reset' | null>(null)
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [recoveryNotice, setRecoveryNotice] = useState('')
  const registrationPasswordHasSixDigits = (password.match(/[0-9]/g) ?? []).length >= 6
  const registrationPasswordHasUppercase = /[A-Z]/.test(password)
  const registrationPasswordHasSymbol = /[^\p{L}\p{N}]/u.test(password)
  const registrationPasswordHasNoDigitSequence = !/(?:012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(password)
  const passwordHasSixDigits = (newPassword.match(/[0-9]/g) ?? []).length >= 6
  const passwordHasUppercase = /[A-Z]/.test(newPassword)
  const passwordHasSymbol = /[^\p{L}\p{N}]/u.test(newPassword)
  const passwordHasNoDigitSequence = !/(?:012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(newPassword)
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

  const changeAuthMode = (mode: 'login' | 'register') => {
    setRecoveryMode(null)
    setRecoveryNotice('')
    setError('')
    openAuth(mode)
  }

  async function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setRecoveryNotice('')
    if (recoveryMode === 'request') {
      const identifier = recoveryIdentifier.trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) && !/^[0-9]{8}$/.test(identifier)) {
        setError('Ingresa un correo válido o un DNI de 8 dígitos.')
        return
      }
      setBusy(true)
      try {
        await requestCustomerPasswordRecovery(identifier)
        setRecoveryMode('reset')
        setRecoveryNotice('Si la cuenta existe y tiene un correo registrado, enviamos un código. Revisa también la carpeta de correo no deseado.')
      } catch (recoveryError) {
        setError(recoveryError instanceof Error ? recoveryError.message : 'No se pudo solicitar el código.')
      } finally {
        setBusy(false)
      }
      return
    }

    if (!/^[0-9]{6}$/.test(recoveryCode)) {
      setError('Ingresa el código de 6 dígitos recibido por correo.')
      return
    }
    if (newPassword.length > 100) {
      setError('La nueva contraseña no puede superar 100 caracteres.')
      return
    }
    if (!passwordHasSixDigits || !passwordHasUppercase || !passwordHasSymbol || !passwordHasNoDigitSequence) {
      setError('La contraseña debe tener al menos 6 dígitos, una mayúscula y un símbolo, sin secuencias numéricas como 123 o 321.')
      return
    }
    setBusy(true)
    try {
      await resetCustomerPassword(recoveryIdentifier, recoveryCode, newPassword)
      setEmail(recoveryIdentifier.includes('@') ? recoveryIdentifier.trim() : '')
      setPassword('')
      setRecoveryMode(null)
      setRecoveryCode('')
      setNewPassword('')
      setRecoveryNotice('Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.')
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setBusy(false)
    }
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
      if (password.length > 100
        || !registrationPasswordHasSixDigits
        || !registrationPasswordHasUppercase
        || !registrationPasswordHasSymbol
        || !registrationPasswordHasNoDigitSequence) {
        showError('La contraseña debe tener al menos 6 dígitos, una mayúscula y un símbolo, sin secuencias numéricas como 123 o 321.')
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
      <section className={`auth-modal auth-modal-${authMode}${recoveryMode ? ' auth-modal-recovery' : ''}`} role="dialog" aria-modal="true" aria-labelledby="auth-title">
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
          <p className="eyebrow">{recoveryMode ? 'RECUPERACIÓN SEGURA' : 'Tu espacio Cerámax'}</p>
          <h2 id="auth-title">{recoveryMode ? 'Recupera el acceso a tu cuenta.' : authMode === 'login' ? 'Qué gusto tenerte de vuelta.' : 'Crea tu cuenta y descubre.'}</h2>
          <p className="auth-modal-description">{recoveryMode ? 'Verificaremos tu identidad antes de permitirte crear una contraseña nueva.' : 'Guarda tus piezas favoritas y consulta tus pedidos desde un solo lugar.'}</p>
          {!recoveryMode && <div className="auth-modal-tabs" role="tablist" aria-label="Acceso a la cuenta">
            <button type="button" role="tab" aria-selected={authMode === 'login'} className={authMode === 'login' ? 'auth-tab-active' : ''} onClick={() => changeAuthMode('login')}>Iniciar sesión</button>
            <button type="button" role="tab" aria-selected={authMode === 'register'} className={authMode === 'register' ? 'auth-tab-active' : ''} onClick={() => { clearRegistration(); changeAuthMode('register') }}>Crear cuenta</button>
          </div>}
          {recoveryMode ? (
            <form className="auth-form customer-form" noValidate onSubmit={submitRecovery}>
              <div className="recovery-progress" aria-label={recoveryMode === 'request' ? 'Paso 1 de 2: verificar cuenta' : 'Paso 2 de 2: crear contraseña'}>
                <span className="recovery-progress-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M4 6.75h16A1.75 1.75 0 0 1 21.75 8.5v9A1.75 1.75 0 0 1 20 19.25H4A1.75 1.75 0 0 1 2.25 17.5v-9A1.75 1.75 0 0 1 4 6.75Z" /><path d="m3 8 9 6.25L21 8" /></svg>
                </span>
                <span className="recovery-step">PASO {recoveryMode === 'request' ? '1' : '2'} DE 2</span>
                <strong>{recoveryMode === 'request' ? 'Verifica tu cuenta' : 'Crea una contraseña nueva'}</strong>
                <span className="recovery-progress-track" aria-hidden="true"><i className={recoveryMode === 'reset' ? 'is-complete' : ''} /></span>
              </div>
              <label>Correo electrónico o DNI<input required autoComplete="username" disabled={recoveryMode === 'reset'} value={recoveryIdentifier} onChange={(event) => setRecoveryIdentifier(event.target.value)} /></label>
              {recoveryMode === 'reset' && <>
                <div className="recovery-delivery-note"><span aria-hidden="true">✉</span><p>Si la cuenta existe, enviamos el código al correo registrado. Revisa también spam.</p></div>
                <label>Código de verificación<input className="recovery-code-input" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="······" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /><small>Es de 6 dígitos y vence en 10 minutos.</small></label>
                <label>Nueva contraseña<input required type="password" autoComplete="new-password" minLength={6} maxLength={100} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
                <ul className="recovery-password-rules" aria-label="Requisitos de contraseña">
                  <li className={passwordHasSixDigits ? 'is-met' : ''}>Al menos 6 dígitos numéricos</li>
                  <li className={passwordHasUppercase ? 'is-met' : ''}>Al menos una letra mayúscula</li>
                  <li className={passwordHasSymbol ? 'is-met' : ''}>Al menos un símbolo, por ejemplo ?</li>
                  <li className={passwordHasNoDigitSequence ? 'is-met' : ''}>Sin secuencias como 123 o 321</li>
                </ul>
              </>}
              {recoveryNotice && <p className="auth-success" role="status">{recoveryNotice}</p>}
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="button button-dark auth-submit-button" type="submit" disabled={busy}>
                {busy ? 'Procesando…' : recoveryMode === 'request' ? 'Enviar código seguro' : 'Guardar nueva contraseña'}<span aria-hidden="true">→</span>
              </button>
              <div className="recovery-secondary-actions">
                {recoveryMode === 'reset' && <button className="auth-recovery-back" type="button" onClick={() => { setRecoveryMode('request'); setRecoveryCode(''); setNewPassword(''); setRecoveryNotice(''); setError('') }}>Cambiar correo o DNI</button>}
                <button className="auth-recovery-back" type="button" onClick={() => { setRecoveryMode(null); setRecoveryNotice(''); setError('') }}>Volver al inicio de sesión</button>
              </div>
            </form>
          ) : <form className="auth-form customer-form" noValidate onSubmit={submit}>
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
              <label>Contraseña<input required type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={authMode === 'login' ? undefined : 6} maxLength={100} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            </div>
            {authMode === 'register' && <ul className="recovery-password-rules" aria-label="Requisitos de contraseña">
              <li className={registrationPasswordHasSixDigits ? 'is-met' : ''}>Al menos 6 dígitos numéricos</li>
              <li className={registrationPasswordHasUppercase ? 'is-met' : ''}>Al menos una letra mayúscula</li>
              <li className={registrationPasswordHasSymbol ? 'is-met' : ''}>Al menos un símbolo, por ejemplo ?</li>
              <li className={registrationPasswordHasNoDigitSequence ? 'is-met' : ''}>Sin secuencias como 123 o 321</li>
            </ul>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            {recoveryNotice && <p className="auth-success" role="status">{recoveryNotice}</p>}
            <button className="button button-dark auth-submit-button" type="submit" disabled={busy}>
              {busy ? 'Procesando…' : authMode === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'}<span aria-hidden="true">→</span>
            </button>
            {authMode === 'login' && <button className="auth-recovery-back" type="button" onClick={() => { setRecoveryMode('request'); setRecoveryIdentifier(email); setRecoveryNotice(''); setError('') }}>¿Olvidaste tu contraseña?</button>}
            <p className="customer-form-note">{authMode === 'login' ? 'Usa el correo y la contraseña de tu cuenta Cerámax.' : 'Tus datos se validan y guardan de forma segura en Cerámax.'}</p>
          </form>}
        </div>
      </section>
    </div>
  )
}
