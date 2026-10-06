import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, X } from 'lucide-react'
import overlayStyles from '../../components/ui/Overlay.module.css'
import type { CreateCustomerRequest, CustomerSession, UbigeoDepartment } from '../../types/store'
import { storeApi } from '../../lib/api'

interface AuthDialogProps {
  onClose: () => void
  onAuthenticated: (session: CustomerSession) => void
  onNotify: (message: string) => void
}

export function AuthDialog({ onClose, onAuthenticated, onNotify }: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [tipoDocumento, setTipoDocumento] = useState<CreateCustomerRequest['tipoDocumento']>('DNI')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [telefono, setTelefono] = useState('')
  const [departamentoCodigo, setDepartamentoCodigo] = useState('')
  const [provinciaCodigo, setProvinciaCodigo] = useState('')
  const [idUbigeo, setIdUbigeo] = useState('')
  const [direccion, setDireccion] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [referencia, setReferencia] = useState('')
  const [departments, setDepartments] = useState<UbigeoDepartment[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const loadingUbigeos = mode === 'register' && departments.length === 0 && !error

  useEffect(() => {
    if (mode !== 'register' || departments.length > 0) return

    let active = true
    storeApi.getUbigeos()
      .then((result) => {
        if (!active) return
        if (!Array.isArray(result)) {
          const message = 'El backend devolvió un catálogo de ubicaciones inválido.'
          setError(message)
          onNotify(message)
          return
        }
        setDepartments(result)
      })
      .catch((cause: unknown) => {
        if (active) {
          const message = cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo de ubicaciones.'
          setError(message)
          onNotify(message)
        }
      })

    return () => {
      active = false
    }
  }, [mode, departments.length, onNotify])

  const departamento = departments.find((item) => item.id === departamentoCodigo)
  const provincias = departamento?.childrens ?? []
  const provincia = provincias.find((item) => item.id === provinciaCodigo)
  const distritos = provincia?.childrens ?? []

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    let registrationCompleted = false
    try {
      if (mode === 'register') {
        await storeApi.registerCustomer({
          tipoDocumento,
          numeroDocumento: numeroDocumento.trim(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          email: email.trim(),
          password,
          telefono: telefono.trim(),
          departamento: departamento?.name ?? '',
          provincia: provincia?.name ?? '',
          distrito: distritos.find((item) => item.id === idUbigeo)?.name ?? '',
          direccion: direccion.trim(),
          codigoPostal: codigoPostal.trim(),
          referencia: referencia.trim(),
          idUbigeo,
        })
        registrationCompleted = true
      }
      const result = await storeApi.login(email.trim(), password)
      const session: CustomerSession = {
        token: result.token,
        email: result.email,
        nombres: result.nombres,
        apellidos: result.apellidos,
      }
      onAuthenticated(session)
      onClose()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo completar el acceso.'
      const errorMessage = registrationCompleted
        ? 'La cuenta se registró, pero no se pudo iniciar sesión automáticamente. Vuelve a ingresar con tus credenciales.'
        : message
      setError(errorMessage)
      onNotify(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={overlayStyles.dialogBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`${overlayStyles.dialogPanel} max-w-md p-6 sm:p-8`} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="icon-button" aria-label="Volver a la tienda"><ArrowLeft size={19} /></button>
          <span className="grid size-11 place-items-center rounded-full bg-terracotta/10 text-terracotta"><LockKeyhole size={19} /></span>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Cerrar"><X size={19} /></button>
        </div>
        <p className="eyebrow mt-7">{mode === 'login' ? 'Bienvenido de nuevo' : 'Únete a Cerámax'}</p>
        <h2 id="auth-title" className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
          {mode === 'login' ? 'Tu próximo espacio empieza aquí.' : 'Crea tu cuenta de cliente.'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          {mode === 'login'
            ? 'Inicia sesión con tu cuenta para usar favoritos, administrar tu carrito, comprar y seguir tus pedidos.'
            : 'Regístrate para guardar tus favoritos, completar compras y consultar el estado de tus pedidos.'}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">
                  Tipo de documento
                  <select
                    value={tipoDocumento}
                    onChange={(event) => {
                      const value = event.target.value
                      if (value === 'DNI' || value === 'RUC' || value === 'CE' || value === 'PASAPORTE') {
                        setTipoDocumento(value)
                      }
                      setNumeroDocumento('')
                    }}
                    className="form-input"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">Carné de extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </label>
                <label className="form-label">
                  Número de documento
                  <input
                    required
                    type="text"
                    value={numeroDocumento}
                    onChange={(event) => {
                      const value = event.target.value
                      setNumeroDocumento(tipoDocumento === 'DNI' || tipoDocumento === 'RUC'
                        ? value.replace(/\D/g, '').slice(0, 20)
                        : value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20))
                    }}
                    maxLength={20}
                    pattern={tipoDocumento === 'DNI'
                      ? '\\d{8}'
                      : tipoDocumento === 'RUC' ? '\\d{11}' : '[A-Za-z0-9]{1,20}'}
                    title={tipoDocumento === 'DNI'
                      ? 'El DNI debe tener 8 dígitos.'
                      : tipoDocumento === 'RUC' ? 'El RUC debe tener 11 dígitos.' : 'Usa entre 1 y 20 letras o números.'}
                    inputMode={tipoDocumento === 'DNI' || tipoDocumento === 'RUC' ? 'numeric' : 'text'}
                    autoComplete="off"
                    className="form-input"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">
                  Nombres
                  <input required maxLength={80} pattern={"\\p{L}+(?:(?: |-|')\\p{L}+)*"} title="Usa solo letras, espacios, apóstrofes o guiones." value={nombres} onChange={(event) => setNombres(event.target.value.replace(/[^\p{L} '-]/gu, ''))} autoComplete="given-name" className="form-input" />
                </label>
                <label className="form-label">
                  Apellidos
                  <input required maxLength={80} pattern={"\\p{L}+(?:(?: |-|')\\p{L}+)*"} title="Usa solo letras, espacios, apóstrofes o guiones." value={apellidos} onChange={(event) => setApellidos(event.target.value.replace(/[^\p{L} '-]/gu, ''))} autoComplete="family-name" className="form-input" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">
                  Teléfono
                  <input
                    required
                    type="tel"
                    maxLength={9}
                    value={telefono}
                    onChange={(event) => setTelefono(event.target.value.replace(/\D/g, '').slice(0, 9))}
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="9[0-9]{8}"
                    title="El teléfono debe empezar con 9 y tener exactamente 9 dígitos."
                    placeholder="Tu número de contacto"
                    className="form-input"
                  />
                </label>
                <label className="form-label">
                  Departamento
                  <select
                    required
                    value={departamentoCodigo}
                    onChange={(event) => {
                      setDepartamentoCodigo(event.target.value)
                      setProvinciaCodigo('')
                      setIdUbigeo('')
                    }}
                    autoComplete="address-level1"
                    className="form-input"
                  >
                    <option value="">{loadingUbigeos ? 'Cargando departamentos…' : 'Selecciona un departamento'}</option>
                    {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">
                  Provincia
                  <select
                    required
                    value={provinciaCodigo}
                    onChange={(event) => {
                      setProvinciaCodigo(event.target.value)
                      setIdUbigeo('')
                    }}
                    autoComplete="address-level2"
                    className="form-input"
                    disabled={!departamento}
                  >
                    <option value="">Selecciona una provincia</option>
                    {provincias.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label className="form-label">
                  Distrito
                  <select
                    required
                    value={idUbigeo}
                    onChange={(event) => setIdUbigeo(event.target.value)}
                    autoComplete="address-level3"
                    className="form-input"
                    disabled={!provincia}
                  >
                    <option value="">Selecciona un distrito</option>
                    {distritos.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              </div>
              <label className="form-label">
                Dirección
                <input
                  required
                  maxLength={200}
                  value={direccion}
                  onChange={(event) => setDireccion(event.target.value)}
                  autoComplete="street-address"
                  placeholder="Avenida, calle y número"
                  className="form-input"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">
                  Código postal
                  <input
                    required
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{1,10}"
                    title="Ingresa solo números, hasta 10 dígitos."
                    value={codigoPostal}
                    onChange={(event) => setCodigoPostal(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoComplete="postal-code"
                    className="form-input"
                  />
                </label>
                <label className="form-label">
                  Código UBIGEO
                  <input
                    required
                    readOnly
                    value={idUbigeo}
                    placeholder="Se completa al elegir el distrito"
                    className="form-input"
                  />
                </label>
              </div>
              <label className="form-label">
                Referencia
                <input
                  required
                  maxLength={250}
                  value={referencia}
                  onChange={(event) => setReferencia(event.target.value)}
                  placeholder="Indicaciones para ubicar tu domicilio"
                  className="form-input"
                />
              </label>
            </>
          )}
          <label className="form-label">
            Correo electrónico
            <input
              required
              type="email"
              maxLength={120}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              className="form-input"
            />
          </label>
          <label className="form-label">
            Contraseña
            <span className="relative block">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'register' ? 8 : undefined}
                maxLength={mode === 'register' ? 100 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                className="form-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 grid place-items-center text-stone-400 hover:text-ink"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <button disabled={loading || loadingUbigeos} className="primary-button w-full disabled:cursor-wait disabled:opacity-60">
            {loading
              ? mode === 'login' ? 'Validando…' : 'Creando cuenta…'
              : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-stone-500">
          {mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
          {' '}
          <button
            type="button"
            onClick={() => {
              setMode((current) => current === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="font-semibold text-terracotta hover:text-ink"
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </section>
    </div>
  )
}
