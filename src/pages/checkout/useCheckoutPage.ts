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
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')
  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [quoteError, setQuoteError] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const cartSubtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

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
    void quoteCustomerCheckout(delivery, token).then((result) => {
      if (active) setQuote(result)
    }).catch((cause: unknown) => {
      if (active) {
        console.error('No se pudo cotizar el checkout en el servidor.', cause)
        setQuoteError(cause instanceof Error ? cause.message : 'No se pudo calcular el total del pedido.')
      }
    }).finally(() => {
      if (active) setQuoteLoading(false)
    })
    return () => { active = false }
  }, [customer, cart, delivery])

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
    if (payment === 'TARJETA' && (!cardName.trim() || cardNumber.replace(/\D/g, '').length < 13 || !expiry.trim() || cvv.length < 3)) {
      setError('Completa los datos de tarjeta para continuar. No se almacenarán.')
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

  return {
    address, addressConfirmed, businessName, businessRuc, cardName, cardNumber, cart, cartSubtotal,
    confirmDeliveryAddress, confirmDeliveryDetails, completeOrder, customer, cvv, delivery, department,
    district, error, expiry, openAuth, payment, phone, province, quote, quoteError, quoteLoading,
    receipt, reference, saveAccountData, savingAccount, setAddress, setAddressConfirmed, setBusinessName,
    setBusinessRuc, setCardName, setCardNumber, setCvv, setDelivery, setDepartment, setDistrict,
    setError, setExpiry, setPayment, setPhone, setProvince, setReceipt, setReference, setSaveAccountData,
    setShowAddressDialog, showAddressDialog, submitting,
  }
}
