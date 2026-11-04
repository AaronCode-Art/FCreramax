/** Utilidades de saneamiento y validación para formularios. */

// Quita caracteres de control y marcadores que se usan para inyectar HTML.
export function cleanText(value: string, max = 200): string {
  return value
    .replace(/[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, max)
}

// Nombres de personas: solo letras, espacios, apóstrofe, punto y guion.
export function cleanPersonName(value: string, max = 80): string {
  return value.replace(/[^\p{L}\s'.-]/gu, '').replace(/\s{2,}/g, ' ').replace(/^\s+/, '').slice(0, max)
}

export const digitsOnly = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max)

export function formatCardNumber(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

// MM/YY con la barra automática: "1230" -> "12/30"; "1" -> "1"; "12" -> "12/".
export function formatExpiry(raw: string, previous = ''): string {
  let digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`
  if (digits.length < 2) return digits
  const deleting = raw.length < previous.length
  if (digits.length === 2) return deleting ? digits : `${digits}/`
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function isValidExpiry(value: string, now = new Date()): boolean {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value)
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (year < currentYear || (year === currentYear && month < currentMonth)) return false
  return year <= currentYear + 20
}

export function isValidLuhn(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index])
    if (index % 2 === 1) { digit *= 2; if (digit > 9) digit -= 9 }
    sum += digit
  }
  return sum % 10 === 0
}

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'diners' | 'unknown'

export function detectCardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^3(0[0-5]|[68])/.test(digits)) return 'diners'
  return 'unknown'
}

export const securityCodeLength = (brand: CardBrand) => (brand === 'amex' ? 4 : 3)

// RUC peruano: 11 dígitos, prefijo válido y dígito verificador (módulo 11).
export function isValidRuc(ruc: string): boolean {
  if (!/^(10|15|16|17|20)\d{9}$/.test(ruc)) return false
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce((total, weight, index) => total + weight * Number(ruc[index]), 0)
  const check = (11 - (sum % 11)) % 10
  return check === Number(ruc[10])
}
