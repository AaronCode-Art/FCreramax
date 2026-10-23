import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
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
    setTestPhone(value.replace(/\D/g, '').slice(0, 9))
    setApprovedPaymentFingerprint('')
    setPaymentNotice('')
  }

  function updateTestCode(value: string) {
    setTestCode(value.replace(/\D/g, '').slice(0, 9))
    setApprovedPaymentFingerprint('')
    setPaymentNotice('')
  }

  function updateCardDetails(update: () => void) {
    update()
    setApprovedPaymentFingerprint('')
    setPaymentNotice('')
  }

  function validateTestPayment() {
    const validMobilePayment = payment === 'TARJETA'
      || (/^[0-9]{1,9}$/.test(testPhone) && /^[0-9]{1,9}$/.test(testCode))
    const validCardPayment = payment !== 'TARJETA' || (
      cardName.trim().length > 0
      && /^[0-9]{13,19}$/.test(cardNumber)
      && cardExpiry.trim().length > 0
      && /^[0-9]{3,4}$/.test(cardSecurityCode)
    )
    if (!validMobilePayment || !validCardPayment) {
      setApprovedPaymentFingerprint('')
      setPaymentNotice('')
      setError(payment === 'TARJETA'
        ? 'Completa los datos de tarjeta correctamente.'
        : 'Ingresa un celular y un código numéricos de hasta 9 dígitos.')
      return
    }
    setError('')
    setApprovedPaymentFingerprint(paymentFingerprint)
    setPaymentNotice(`Validación completada para ${payment === 'TARJETA' ? 'tarjeta' : payment}`)
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
      setQuoteError('Inicia sesión con una cuenta conectada a la API para cotizar y registrar tu pedido.')
      return
    }
    let active = true
    setQuote(null)
    setQuoteError('')
    setQuoteLoading(true)
    void quoteCustomerCheckout(delivery, couponCode || null, token).then((result) => {
      if (active) setQuote(result)
    }).catch((cause: unknown) => {
      if (active) {
        console.error('No se pudo cotizar el checkout en el servidor.', cause)
        if (couponCode && cause instanceof Error
          && cause.message.startsWith('El cupón requiere una compra mínima de S/ ')) {
          setQuote(null)
          setCouponInput('')
          setCouponCode('')
          setCouponNotice(`${cause.message}. Se quitó el cupón; puedes continuar con el precio normal.`)
          return
        }
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

  async function completeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
    if (receipt === 'FACTURA' && (!businessName.trim() || businessRuc.trim().length !== 11)) {
      setError('Ingresa la razón social y un RUC de 11 dígitos para la factura.')
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
      setQuote(null)
      return
    }
    setCouponNotice('')
    setQuoteError('')
    setQuote(null)
    setCouponCode(code)
  }

  function removeCoupon() {
    setCouponInput('')
    setCouponCode('')
    setCouponNotice('')
    setQuoteError('')
    setQuote(null)
  }

  function updateCouponInput(value: string) {
    setCouponInput(value)
    setCouponNotice('')
  }

  return {
    address, addressConfirmed, businessName, businessRuc, cart, cartSubtotal,
    confirmDeliveryAddress, confirmDeliveryDetails, completeOrder, customer, delivery, department,
    district, error, openAuth, payment, paymentApproved,
    paymentNotice: paymentApproved ? paymentNotice : '', phone, province, quote, quoteError, couponNotice, quoteLoading,
    receipt, reference, saveAccountData, savingAccount, setAddress, setAddressConfirmed, setBusinessName,
    setBusinessRuc, setCouponInput: updateCouponInput, setDelivery, setDepartment, setDistrict,
    setError, setPhone, setProvince, setReceipt, setReference, setSaveAccountData,
    setShowAddressDialog, showAddressDialog, submitting, couponInput, couponCode, applyCoupon, removeCoupon,
    testPhone, testCode, updateTestPhone, updateTestCode,
    cardName, cardNumber, cardExpiry, cardSecurityCode,
    setCardName: (value: string) => updateCardDetails(() => setCardName(value)),
    setCardNumber: (value: string) => updateCardDetails(() => setCardNumber(value.replace(/\D/g, '').slice(0, 19))),
    setCardExpiry: (value: string) => updateCardDetails(() => setCardExpiry(value.replace(/[^\d/]/g, '').slice(0, 5))),
    setCardSecurityCode: (value: string) => updateCardDetails(() => setCardSecurityCode(value.replace(/\D/g, '').slice(0, 4))),
    selectPayment, validateTestPayment,
  }
}
