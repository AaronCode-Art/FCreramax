import { apiRequest } from './api'
import type { StoreCustomer } from '../context/StoreContext'

type DocumentType = StoreCustomer['documentType']
type CustomerProfile = {
  id: string
  nombres: string
  apellidos: string
  email?: string | null
  tipoDocumento: DocumentType
  numeroDocumento: string
  telefono?: string | null
  departamento?: string | null
  provincia?: string | null
  distrito?: string | null
  direccion?: string | null
  codigoPostal?: string | null
  referencia?: string | null
  idUbigeo?: string | null
}

type AuthResponse = {
  token: string
  email: string
  nombres: string
  apellidos: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readProfile(value: unknown): CustomerProfile {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.nombres !== 'string'
    || typeof value.apellidos !== 'string'
    || typeof value.tipoDocumento !== 'string'
    || !['DNI', 'RUC', 'CE', 'PASAPORTE'].includes(value.tipoDocumento)
    || typeof value.numeroDocumento !== 'string') {
    throw new Error('La API devolvió datos de cliente incompletos o no válidos.')
  }
  const optionalText = (field: string): string => {
    const fieldValue = value[field]
    return typeof fieldValue === 'string' ? fieldValue : ''
  }
  return {
    id: value.id,
    nombres: value.nombres,
    apellidos: value.apellidos,
    email: optionalText('email'),
    tipoDocumento: value.tipoDocumento as DocumentType,
    numeroDocumento: value.numeroDocumento,
    telefono: optionalText('telefono'),
    departamento: optionalText('departamento'),
    provincia: optionalText('provincia'),
    distrito: optionalText('distrito'),
    direccion: optionalText('direccion'),
    codigoPostal: optionalText('codigoPostal'),
    referencia: optionalText('referencia'),
    idUbigeo: optionalText('idUbigeo'),
  }
}

function readAuthResponse(value: unknown): AuthResponse {
  if (!isRecord(value)
    || typeof value.token !== 'string'
    || typeof value.email !== 'string'
    || typeof value.nombres !== 'string'
    || typeof value.apellidos !== 'string') {
    throw new Error('La API devolvió una respuesta de inicio de sesión no válida.')
  }
  return {
    token: value.token,
    email: value.email,
    nombres: value.nombres,
    apellidos: value.apellidos,
  }
}

export function toStoreCustomer(profile: CustomerProfile): StoreCustomer {
  return {
    id: profile.id,
    name: `${profile.nombres} ${profile.apellidos}`.trim(),
    firstNames: profile.nombres,
    lastNames: profile.apellidos,
    email: profile.email ?? '',
    phone: profile.telefono ?? '',
    documentType: profile.tipoDocumento,
    documentNumber: profile.numeroDocumento,
    address: profile.direccion ?? '',
    district: profile.distrito ?? '',
    province: profile.provincia ?? '',
    department: profile.departamento ?? '',
    postalCode: profile.codigoPostal ?? '',
    ubigeo: profile.idUbigeo ?? '',
    reference: profile.referencia ?? '',
  }
}

export async function fetchCustomerProfile(token: string): Promise<StoreCustomer> {
  return toStoreCustomer(readProfile(await apiRequest('/api/v1/clientes/mio', {}, token)))
}

export async function updateCustomerDeliveryProfile(
  customer: StoreCustomer,
  token: string,
): Promise<StoreCustomer> {
  const response = await apiRequest('/api/v1/clientes/mio/datos-entrega', {
    method: 'PATCH',
    body: JSON.stringify({
      telefono: customer.phone.trim(),
      departamento: customer.department.trim(),
      provincia: customer.province.trim(),
      distrito: customer.district.trim(),
      direccion: customer.address.trim(),
      codigoPostal: customer.postalCode.trim(),
      referencia: customer.reference.trim(),
      idUbigeo: customer.ubigeo.trim(),
    }),
  }, token)
  return toStoreCustomer(readProfile(response))
}

export async function lookupCustomerForRegistration(
  tipoDocumento: DocumentType,
  numeroDocumento: string,
): Promise<StoreCustomer | null> {
  const result = await apiRequest('/api/v1/clientes/registro/buscar', {
    method: 'POST',
    body: JSON.stringify({ tipoDocumento, numeroDocumento }),
  })
  if (result === null || result === undefined) return null
  return toStoreCustomer(readProfile(result))
}

type CustomerForm = StoreCustomer & { password: string }

function customerPayload(customer: CustomerForm) {
  return {
    tipoDocumento: customer.documentType,
    numeroDocumento: customer.documentNumber.trim(),
    nombres: customer.firstNames.trim(),
    apellidos: customer.lastNames.trim(),
    email: customer.email.trim().toLowerCase(),
    password: customer.password,
    telefono: customer.phone.trim(),
    departamento: customer.department,
    provincia: customer.province,
    distrito: customer.district,
    direccion: customer.address.trim(),
    codigoPostal: customer.postalCode,
    referencia: customer.reference.trim(),
    idUbigeo: customer.ubigeo,
  }
}

export async function completeCustomerRegistration(
  customer: CustomerForm,
  existingRecord: boolean,
): Promise<void> {
  const payload = customerPayload(customer)
  if (existingRecord) {
    await apiRequest('/api/v1/clientes/registro/completar', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return
  }

  await apiRequest('/api/v1/clientes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function loginCustomer(email: string, password: string): Promise<{ token: string; customer: StoreCustomer }> {
  const auth = readAuthResponse(await apiRequest('/api/auth/cliente/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  }))
  const profile = readProfile(await apiRequest('/api/v1/clientes/mio', {}, auth.token))
  return { token: auth.token, customer: toStoreCustomer(profile) }
}
