import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { cleanPersonName, cleanText, detectCardBrand, digitsOnly, formatCardNumber, formatExpiry, isValidExpiry, isValidLuhn, isValidRuc, securityCodeLength } from '../../lib/forms'
import { ApiError } from '../../services/api'
import { quoteCustomerCheckout, type CheckoutQuote, type CustomerCheckoutRequest } from '../../services/customerOrdersApi'

export function useCheckoutPage() {
  const { customer, cart, updateCustomerDeliveryData, createCustomerOrder, openAuth, setNotice } = useStore()
  const navigate = useNavigate()
  const [delivery, setDelivery] = useState<'DELIVERY' | 'RECOJO_TIENDA'>('DELIVERY')
  const [payment, setPayment] = useState<'YAPE' | 'PLIN' | 'TARJETA'>('YAPE')
  const [receipt, setReceipt] = useState<'BOLETA' | 'FACTURA'>('BOLETA')
  const [address, setAddress] = useState(customer?.address ?? '')
  const [district, setDistrict] = useState(customer?.district ?? '')
  const [province, setProvince] = useState(customer?.province ?? '')
  const [department, setDepartment] = useState(customer?.department ?? '')
  const [reference, setReference] = useState(customer?.reference ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [saveAccountData, setSaveAccountData] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessRuc, setBusinessRuc] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testCode, setTestCode] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardSecurityCode, setCardSecurityCode] = useState('')
  const [approvedPaymentFingerprint, setApprovedPaymentFingerprint] = useState('')
  const [paymentNotice, setPaymentNotice] = useState('')
  const [error, setError] = useState('')
  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [quoteError, setQuoteError] = useState('')
  const [couponNotice, setCouponNotice] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const cartSubtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const paymentFingerprint = `${payment}:${(quote?.total ?? cartSubtotal).toFixed(2)}`
  const paymentApproved = approvedPaymentFingerprint === paymentFingerprint

  function selectPayment(method: 'YAPE' | 'PLIN' | 'TARJETA') {
    setPayment(method)
    setApprovedPaymentFingerprint('')
    setPaymentNotice('')
    setError('')
  }

  function updateTestPhone(value: string) {
    setTestPhone(digitsOnly(value, 9))
    setApprovedPaymentFingerprint('')
    setPaymentNotice('')
  }

  function updateTestCode(value: string) {
    setTestCode(digitsOnly(value, 6))
    setApprovedPaymentFingerprint('')
    setPaymentNotice('')
  }

  function updateCardDetails(update: () => void) {
    update()
    setApprovedPaymentFingerprint('')
    setPaymentNotice('')
  }

  function validateTestPayment() {
    if (payment === 'TARJETA') {
      const brand = detectCardBrand(cardNumber)
      if (cardName.trim().length < 3) return rejectPayment('Escribe el nombre tal como aparece en la tarjeta.')
      if (!isValidLuhn(cardNumber)) return rejectPayment('Revisa el número de tarjeta.')
      if (!isValidExpiry(cardExpiry)) return rejectPayment('La fecha de vencimiento no es válida o ya venció.')
      if (cardSecurityCode.length !== securityCodeLength(brand)) return rejectPayment(`El código de seguridad debe tener ${securityCodeLength(brand)} dígitos.`)
    } else if (!/^9\d{8}$/.test(testPhone) || !/^\d{6}$/.test(testCode)) {
      return rejectPayment(`Ingresa el celular de 9 dígitos de ${payment === 'YAPE' ? 'Yape' : 'Plin'} y el código de 6 dígitos.`)
    }
    setError('')
    setApprovedPaymentFingerprint(paymentFingerprint)
    setPaymentNotice(`Validación completada para ${payment === 'TARJETA' ? 'tarjeta' : payment}`)
  }

  function rejectPayment(message: string) {
    setApprovedPaymentFingerprint('')
    setPaymentNotice('')
    setError(message)
  }

  useEffect(() => {
    if (!customer || !cart.length) {
      setQuote(null)
      setQuoteError('')
      setQuoteLoading(false)
      return
    }
    const token = localStorage.getItem('ceramax:auth-token')
    if (!token) {
      setQuote(null)
      setQuoteError('Inicia sesión de nuevo para cotizar y registrar tu pedido.')
      return
    }
    let active = true
    setQuoteError('')
    setQuoteLoading(true)
    void quoteCustomerCheckout(delivery, couponCode || null, token).then((result) => {
      if (active) setQuote(result)
    }).catch((cause: unknown) => {
      if (active) {
        console.error('No se pudo cotizar el checkout en el servidor.', cause)
        if (couponCode && cause instanceof Error
          && cause.message.startsWith('El cupón requiere una compra mínima de S/ ')) {
          setCouponCode('')
          setCouponNotice(`${cause.message}. Se quitó el cupón; puedes continuar con el precio normal.`)
          return
        }
        if (couponCode && cause instanceof ApiError
          && cause.status >= 400 && cause.status < 500
          && cause.status !== 401 && cause.status !== 403) {
          setCouponCode('')
          setCouponNotice(`${cause.message}. Se quitó el cupón; se muestra el precio normal.`)
          return
        }
        setQuote(null)
        setCouponNotice('')
        setQuoteError(cause instanceof Error ? cause.message : 'No se pudo calcular el total del pedido.')
      }
    }).finally(() => {
      if (active) setQuoteLoading(false)
    })
    return () => { active = false }
  }, [customer, cart, couponCode, delivery])

  useEffect(() => {
    if (!customer) return
    setAddress(customer.address)
    setDistrict(customer.district)
    setProvince(customer.province)
    setDepartment(customer.department)
    setReference(customer.reference)
    setPhone(customer.phone)
  }, [customer])

  function confirmDeliveryAddress(): boolean {
    if (!address.trim() || !district.trim() || !province.trim() || !department.trim() || !/^9\d{8}$/.test(phone)) {
      setError('Completa la dirección y los datos de contacto. El teléfono debe tener 9 dígitos y empezar con 9.')
      return false
    }
    const changed = address !== customer?.address
      || district !== customer?.district
      || province !== customer?.province
      || department !== customer?.department
      || reference !== customer?.reference
      || phone !== customer?.phone
    setError('')
    if (changed) {
      setSaveAccountData(false)
      setShowAddressDialog(true)
      return false
    }
    setAddressConfirmed(true)
    return true
  }

  async function confirmDeliveryDetails(saveToAccount = saveAccountData): Promise<boolean> {
    if (saveToAccount && customer) {
      setSavingAccount(true)
      try {
        await updateCustomerDeliveryData({ ...customer, address, district, province, department, reference, phone })
      } catch (saveError) {
        console.error('No se pudieron actualizar los datos de entrega de la cuenta.', saveError)
        setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los datos de la cuenta.')
        setSavingAccount(false)
        return false
      }
      setSavingAccount(false)
      setNotice('Los datos de entrega se actualizaron en tu cuenta.')
    }
    setAddressConfirmed(true)
    setShowAddressDialog(false)
    setError('')
    return true
  }

  async function completeOrder() {
    if (!customer) return
    if (!quote) {
      setError(quoteError || 'Espera a que se calcule el total del pedido.')
      return
    }
    if (delivery === 'DELIVERY') {
      if (!/^9\d{8}$/.test(phone)) {
        setError('Ingresa un teléfono válido de 9 dígitos para coordinar la entrega.')
        return
      }
      if (!addressConfirmed) {
        setError('Confirma la dirección y el teléfono de entrega antes de generar tu pedido.')
        return
      }
    }
    if (receipt === 'FACTURA' && (!businessName.trim() || !isValidRuc(businessRuc))) {
      setError('Ingresa la razón social y un RUC válido de 11 dígitos para la factura.')
      return
    }
    if (approvedPaymentFingerprint !== paymentFingerprint) {
      setError('Valida los datos del método seleccionado antes de crear el pedido.')
      return
    }
    const request: CustomerCheckoutRequest = {
      tipoEntrega: delivery,
      tipoComprobante: receipt,
      ruc: receipt === 'FACTURA' ? businessRuc : null,
      razonSocial: receipt === 'FACTURA' ? businessName.trim() : null,
      envioDepartamento: delivery === 'DELIVERY' ? department.trim() : null,
      envioProvincia: delivery === 'DELIVERY' ? province.trim() : null,
      envioDistrito: delivery === 'DELIVERY' ? district.trim() : null,
      envioDireccion: delivery === 'DELIVERY' ? address.trim() : null,
      envioTelefono: delivery === 'DELIVERY' ? phone : null,
      envioCodigoPostal: delivery === 'DELIVERY' ? customer.postalCode || null : null,
      envioReferencia: delivery === 'DELIVERY' ? reference.trim() || null : null,
      envioIdUbigeo: delivery === 'DELIVERY' && /^[0-9]{6}$/.test(customer.ubigeo) ? customer.ubigeo : null,
      metodoPago: 'SIMULADO',
      medioPagoSimulado: payment,
      detalles: cart.map(({ product, quantity }) => ({ productoId: product.id, cantidad: quantity })),
      codigoCupon: couponCode || null,
    }
    setSubmitting(true)
    setError('')
    try {
      await createCustomerOrder(request)
      navigate('/pedidos')
    } catch (cause) {
      console.error('No se pudo registrar el pedido en el servidor.', cause)
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar el pedido. Inténtalo nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      setQuoteError('Ingresa un código de cupón válido (3 a 30 letras o números).')
      setCouponCode('')
      return
    }
    setCouponNotice('')
    setQuoteError('')
    setCouponCode(code)
  }

  function removeCoupon() {
    setCouponInput('')
    setCouponCode('')
    setCouponNotice('')
    setQuoteError('')
  }

  function updateCouponInput(value: string) {
    setCouponInput(value)
    setCouponNotice('')
    setQuoteError('')
  }

  return {
    address: address, setAddress: (value: string) => setAddress(cleanText(value, 200)), addressConfirmed, businessName, businessRuc, cart, cartSubtotal,
    confirmDeliveryAddress, confirmDeliveryDetails, completeOrder, customer, delivery, department,
    district, error, openAuth, payment, paymentApproved,
    paymentNotice: paymentApproved ? paymentNotice : '', phone, province, quote, quoteError, couponNotice, quoteLoading,
    receipt, reference, saveAccountData, savingAccount, setAddressConfirmed,
    setBusinessName: (value: string) => setBusinessName(cleanText(value, 150)),
    setBusinessRuc: (value: string) => setBusinessRuc(digitsOnly(value, 11)),
    setCouponInput: updateCouponInput, setDelivery, setDepartment: (value: string) => setDepartment(cleanText(value, 60)), setDistrict: (value: string) => setDistrict(cleanText(value, 60)),
    setError, setPhone: (value: string) => setPhone(digitsOnly(value, 9)), setProvince: (value: string) => setProvince(cleanText(value, 60)), setReceipt, setReference: (value: string) => setReference(cleanText(value, 250)), setSaveAccountData,
    setShowAddressDialog, showAddressDialog, submitting, couponInput, couponCode, applyCoupon, removeCoupon,
    testPhone, testCode, updateTestPhone, updateTestCode,
    cardName, cardNumber, cardExpiry, cardSecurityCode,
    setCardName: (value: string) => updateCardDetails(() => setCardName(cleanPersonName(value.toUpperCase(), 40))),
    setCardNumber: (value: string) => updateCardDetails(() => setCardNumber(digitsOnly(value, 19))),
    setCardExpiry: (value: string) => updateCardDetails(() => setCardExpiry((previous) => formatExpiry(value, previous))),
    setCardSecurityCode: (value: string) => updateCardDetails(() => setCardSecurityCode(digitsOnly(value, 4))),
    formatCardNumber,
    selectPayment, validateTestPayment,
  }
}
