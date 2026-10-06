import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, MapPin, Smartphone, Store, X } from 'lucide-react'
import overlayStyles from '../../components/ui/Overlay.module.css'
import { storeApi } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import type { CartItem, CheckoutQuote, CustomerSession, SimulatedCheckoutResponse, SimulatedPaymentMethod } from '../../types/store'
import styles from './CheckoutDialog.module.css'

interface CheckoutDialogProps {
  customer: CustomerSession
  items: CartItem[]
  apiAvailable: boolean
  onOrderComplete: () => void
  onOpenOrders: () => void
  onOpenReceipt: (orderId: string) => void
  onClose: () => void
  pageMode?: boolean
}

type DeliveryType = 'DELIVERY' | 'RECOJO_TIENDA'
type ReceiptType = 'BOLETA' | 'FACTURA'

const paymentMethods: Array<{ value: SimulatedPaymentMethod; label: string }> = [
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'TARJETA', label: 'Tarjeta' },
]

const paymentDescriptions: Record<SimulatedPaymentMethod, string> = {
  YAPE: 'Medio seleccionado',
  PLIN: 'Medio seleccionado',
  TARJETA: 'Medio seleccionado',
}

export function CheckoutDialog({ customer, items, apiAvailable, onOrderComplete, onOpenOrders, onOpenReceipt, onClose, pageMode = false }: CheckoutDialogProps) {
  const [checkoutItems] = useState(items)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DELIVERY')
  const [receiptType, setReceiptType] = useState<ReceiptType>('BOLETA')
  const [paymentMethod, setPaymentMethod] = useState<SimulatedPaymentMethod>('YAPE')
  const [cardDetails, setCardDetails] = useState({
    holder: '',
    number: '',
    expiration: '',
    securityCode: '',
  })
  const [address, setAddress] = useState({
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    referencia: '',
  })
  const [ruc, setRuc] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [quoteError, setQuoteError] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(apiAvailable)
  const [placedOrder, setPlacedOrder] = useState<SimulatedCheckoutResponse | null>(null)

  useEffect(() => {
    if (!apiAvailable) return
    let current = true
    storeApi.quoteCheckout(customer.token, { tipoEntrega: deliveryType })
      .then((result) => {
        if (current) setQuote(result)
      })
      .catch((cause: unknown) => {
        if (current) setQuoteError(cause instanceof Error ? cause.message : 'No se pudo calcular la cotización.')
      })
      .finally(() => {
        if (current) setQuoteLoading(false)
      })
    return () => {
      current = false
    }
  }, [apiAvailable, customer.token, deliveryType])

  const subtotal = checkoutItems.reduce(
    (total, item) => total + Number(item.product.precioFinal ?? item.product.precio) * item.quantity,
    0,
  )

  function changeDeliveryType(type: DeliveryType) {
    if (type === deliveryType) return
    setDeliveryType(type)
    setQuote(null)
    setQuoteError('')
    setQuoteLoading(apiAvailable)
  }

  function changePaymentMethod(method: SimulatedPaymentMethod) {
    setPaymentMethod(method)
    if (method !== 'TARJETA') {
      setCardDetails({ holder: '', number: '', expiration: '', securityCode: '' })
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (receiptType === 'FACTURA' && !/^\d{11}$/.test(ruc)) {
        throw new Error('Ingresa un RUC de 11 dígitos para emitir factura.')
      }
      if (paymentMethod === 'TARJETA') {
        const digits = cardDetails.number.replace(/\D/g, '')
        const [monthText, yearText] = cardDetails.expiration.split('/')
        const month = Number(monthText)
        const year = Number(`20${yearText}`)
        const now = new Date()
        const expired = year < now.getFullYear()
          || (year === now.getFullYear() && month < now.getMonth() + 1)
        if (cardDetails.holder.trim().length < 2) {
          throw new Error('Ingresa el nombre del titular de la tarjeta.')
        }
        if (digits.length < 13 || digits.length > 19) {
          throw new Error('Revisa el número de tarjeta.')
        }
        if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiration) || month < 1 || month > 12 || expired) {
          throw new Error('Ingresa una fecha de vencimiento válida (MM/AA).')
        }
        if (!/^\d{3,4}$/.test(cardDetails.securityCode)) {
          throw new Error('Ingresa un código de seguridad válido.')
        }
      }
      const order = await storeApi.createCheckout(customer.token, {
        tipoEntrega: deliveryType,
        tipoComprobante: receiptType,
        ...(receiptType === 'FACTURA' ? { ruc, razonSocial: businessName } : {}),
        ...(deliveryType === 'DELIVERY'
          ? {
              envioDepartamento: address.departamento || undefined,
              envioProvincia: address.provincia || undefined,
              envioDistrito: address.distrito,
              envioDireccion: address.direccion,
              envioReferencia: address.referencia || undefined,
            }
          : {}),
        metodoPago: 'SIMULADO',
        medioPagoSimulado: paymentMethod,
        detalles: checkoutItems.map(({ product, quantity }) => ({
          productoId: product.id,
          cantidad: quantity,
        })),
      })
      setCardDetails({ holder: '', number: '', expiration: '', securityCode: '' })
      setPlacedOrder(order)
      onOrderComplete()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo continuar con el pago.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={pageMode ? 'mx-auto min-h-[55vh] w-[92%] py-10' : overlayStyles.dialogBackdrop}
      role={pageMode ? undefined : 'presentation'}
      onMouseDown={(event) => !pageMode && event.target === event.currentTarget && onClose()}
    >
      <section
        className={pageMode
          ? 'mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm'
          : `${overlayStyles.dialogPanel} max-w-5xl overflow-hidden`}
        role={pageMode ? undefined : 'dialog'}
        aria-modal={pageMode ? undefined : true}
        aria-labelledby="checkout-title"
      >
        <div className="grid md:grid-cols-[1.3fr_0.7fr]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between">
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-ink">
                <ArrowLeft size={16} /> {pageMode ? 'Seguir comprando' : 'Volver al carrito'}
              </button>
              <button type="button" onClick={onClose} className="inline-grid size-10 place-items-center rounded-full text-stone-500 transition hover:bg-stone-100 md:hidden" aria-label="Cerrar">
                <X size={19} />
              </button>
            </div>
            <p className="eyebrow mt-7">Pedido</p>
            <h2 id="checkout-title" className="mt-2 font-display text-3xl text-ink">
              Confirmar pedido
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Continuaremos como {customer.email}.
            </p>

            {!apiAvailable && (
              <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                La tienda no está disponible temporalmente. Vuelve a intentarlo más tarde.
              </div>
            )}

            {placedOrder ? (
              <div className="mt-7 rounded border border-emerald-200 bg-emerald-50 p-5" role="status">
                <h3 className="font-semibold text-emerald-950">Tu pedido quedó registrado</h3>
                <p className="mt-2 text-sm text-emerald-900">
                  Pedido {placedOrder.codigo} por {formatPrice(placedOrder.total)}. Método: {paymentMethods.find(({ value }) => value === paymentMethod)?.label}.
                </p>
                <p className="mt-2 text-sm text-emerald-900">
                  Estado: {placedOrder.estadoNombre || placedOrder.estadoCodigo}
                  {placedOrder.serie && placedOrder.numeroComprobante
                    ? ` · ${placedOrder.tipoComprobante} ${placedOrder.serie}-${placedOrder.numeroComprobante}`
                    : ''}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={onOpenOrders} className="primary-button">
                    Ver mis pedidos
                  </button>
                  <button type="button" onClick={() => onOpenReceipt(placedOrder.id)} className="secondary-button">
                    Ver boleta / factura
                  </button>
                  <button type="button" onClick={onClose} className="secondary-button">
                    Seguir comprando
                  </button>
                </div>
              </div>
            ) : (
              <>
            <form id="checkout-form" onSubmit={submit} className="mt-7 space-y-6">
                <fieldset>
                  <legend className="text-sm font-semibold text-ink">¿Cómo recibes tu compra?</legend>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      aria-pressed={deliveryType === 'DELIVERY'}
                      onClick={() => changeDeliveryType('DELIVERY')}
                      className={`${styles.choiceCard} ${deliveryType === 'DELIVERY' ? styles.choiceCardActive : ''}`}
                    >
                      <MapPin size={18} />
                      <span><strong>Envío a domicilio</strong><small>Tarifa calculada para delivery</small></span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={deliveryType === 'RECOJO_TIENDA'}
                      onClick={() => changeDeliveryType('RECOJO_TIENDA')}
                      className={`${styles.choiceCard} ${deliveryType === 'RECOJO_TIENDA' ? styles.choiceCardActive : ''}`}
                    >
                      <Store size={18} />
                      <span><strong>Recojo en tienda</strong><small>Sin costo de envío</small></span>
                    </button>
                  </div>
                </fieldset>

                {deliveryType === 'DELIVERY' && (
                  <fieldset>
                    <legend className="text-sm font-semibold text-ink">Dirección de entrega</legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        required
                        value={address.distrito}
                        onChange={(event) => setAddress({ ...address, distrito: event.target.value })}
                        placeholder="Distrito *"
                        className="form-input"
                      />
                      <input
                        required
                        value={address.direccion}
                        onChange={(event) => setAddress({ ...address, direccion: event.target.value })}
                        placeholder="Dirección *"
                        className="form-input"
                      />
                      <input
                        value={address.provincia}
                        onChange={(event) => setAddress({ ...address, provincia: event.target.value })}
                        placeholder="Provincia"
                        className="form-input"
                      />
                      <input
                        value={address.departamento}
                        onChange={(event) => setAddress({ ...address, departamento: event.target.value })}
                        placeholder="Departamento"
                        className="form-input"
                      />
                      <input
                        value={address.referencia}
                        onChange={(event) => setAddress({ ...address, referencia: event.target.value })}
                        placeholder="Referencia (opcional)"
                        className="form-input sm:col-span-2"
                      />
                    </div>
                  </fieldset>
                )}

                <fieldset>
                  <legend className="text-sm font-semibold text-ink">Comprobante</legend>
                  <div className="mt-3 flex gap-3">
                    {(['BOLETA', 'FACTURA'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setReceiptType(type)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          receiptType === type ? 'border-ink bg-ink text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        {type === 'BOLETA' ? 'Boleta' : 'Factura'}
                      </button>
                    ))}
                  </div>
                  {receiptType === 'FACTURA' && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input required inputMode="numeric" maxLength={11} value={ruc} onChange={(event) => setRuc(event.target.value.replace(/\D/g, ''))} placeholder="RUC (11 dígitos)" className="form-input" />
                      <input required value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Razón social" className="form-input" />
                    </div>
                  )}
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-semibold text-ink">Medio de pago</legend>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {paymentMethods.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={paymentMethod === value}
                        onClick={() => changePaymentMethod(value)}
                        className={`${styles.choiceCard} relative min-h-24 flex-col justify-center gap-2 px-2 py-3 text-center ${paymentMethod === value ? styles.choiceCardActive : ''}`}
                      >
                        {value === 'TARJETA' ? <CreditCard size={19} /> : <Smartphone size={19} />}
                        <span>
                          <strong>{label}</strong>
                          <small>{paymentDescriptions[value]}</small>
                        </span>
                        {paymentMethod === value && <Check size={14} className="absolute right-2 top-2" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    El pedido se registrará, pero el cobro no se procesa desde esta tienda.
                  </p>
                  {paymentMethod === 'TARJETA' && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input
                        required
                        autoComplete="off"
                        value={cardDetails.holder}
                        onChange={(event) => setCardDetails({ ...cardDetails, holder: event.target.value })}
                        placeholder="Nombre del titular"
                        aria-label="Nombre del titular de la tarjeta"
                        className="form-input sm:col-span-2"
                      />
                      <input
                        required
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={23}
                        value={cardDetails.number}
                        onChange={(event) => setCardDetails({
                          ...cardDetails,
                          number: event.target.value.replace(/\D/g, '').slice(0, 19),
                        })}
                        placeholder="Número de tarjeta"
                        aria-label="Número de tarjeta"
                        className="form-input sm:col-span-2"
                      />
                      <input
                        required
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={5}
                        value={cardDetails.expiration}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
                          setCardDetails({
                            ...cardDetails,
                            expiration: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
                          })
                        }}
                        placeholder="Vencimiento (MM/AA)"
                        aria-label="Vencimiento de la tarjeta, mes y año"
                        className="form-input"
                      />
                      <input
                        required
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={4}
                        value={cardDetails.securityCode}
                        onChange={(event) => setCardDetails({
                          ...cardDetails,
                          securityCode: event.target.value.replace(/\D/g, '').slice(0, 4),
                        })}
                        placeholder="Código de seguridad"
                        aria-label="Código de seguridad de la tarjeta"
                        className="form-input"
                      />
                    </div>
                  )}
                  {paymentMethod === 'TARJETA' && (
                    <p className="mt-3 text-xs leading-5 text-stone-500">
                      No ingreses datos de una tarjeta real. Esta información solo se valida en el formulario y no se envía ni se guarda.
                    </p>
                  )}
                </fieldset>
            </form>

            {error && (
              <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700" role="alert">
                {error}
              </div>
            )}

            <button
              form="checkout-form"
              type="submit"
              disabled={loading || !apiAvailable}
              className="primary-button mt-7 w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-64"
            >
              {loading ? 'Procesando pedido…' : 'Comprar'}
              <ArrowRight size={17} />
            </button>
            <p className="mt-3 flex items-center gap-2 text-[11px] text-stone-500">
              <LockKeyhole size={13} /> Revisa los datos de tu pedido antes de comprar.
            </p>
              </>
            )}
          </div>

          <aside className="border-t border-stone-200 bg-stone-50 p-5 sm:p-8 md:border-l md:border-t-0 lg:p-9">
            <button type="button" onClick={onClose} className="hidden size-10 place-items-center rounded-full text-stone-500 transition hover:bg-stone-100 md:inline-grid" aria-label="Cerrar checkout">
              <X size={19} />
            </button>
            <p className="eyebrow mt-0 md:mt-7">Resumen del pedido</p>
            <div className="mt-5 space-y-4">
              {checkoutItems.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-600">{product.nombre} <span className="text-stone-400">× {quantity}</span></span>
                  <span className="shrink-0 font-medium text-ink">{formatPrice(Number(product.precioFinal ?? product.precio) * quantity)}</span>
                </div>
              ))}
            </div>
            <div className="my-5 border-t border-stone-200" />
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Subtotal</span>
              <span className="font-medium text-ink">{formatPrice(quote?.subtotal ?? subtotal)}</span>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-stone-500">IGV</span>
              <span className="text-ink">{quote ? formatPrice(quote.igv) : '—'}</span>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-stone-500">Envío</span>
              <span className="font-medium text-ink">
                {quote
                  ? quote.costoEnvio === 0 ? 'Sin costo' : formatPrice(quote.costoEnvio)
                  : quoteLoading ? 'Calculando…' : '—'}
              </span>
            </div>
            <div className="my-5 border-t border-stone-200" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-ink">Total final</span>
              <span className="font-display text-2xl text-ink">
                {placedOrder
                  ? formatPrice(placedOrder.total)
                  : quote
                    ? formatPrice(quote.total)
                    : quoteLoading ? 'Calculando…' : '—'}
              </span>
            </div>
            {quoteError ? (
              <p className="mt-2 text-xs leading-5 text-red-700" role="alert">
                No se pudo cotizar: {quoteError} Puedes reintentar cambiando la entrega; el pedido volverá a calcularse al confirmar.
              </p>
            ) : (
              <p className="mt-2 text-right text-[10px] text-stone-400">
                {quote ? 'Cotización calculada por el servidor' : 'El servidor calcula y confirma el total'}
              </p>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}
