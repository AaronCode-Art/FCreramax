import './CheckoutPage.css'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { PageIntro } from '../../components/common/PageIntro'
import { detectCardBrand, securityCodeLength } from '../../lib/forms'
import { useCheckoutPage } from './useCheckoutPage'

const paymentMethods = [
  { id: 'YAPE', label: 'Yape', hint: 'Celular y código' },
  { id: 'PLIN', label: 'Plin', hint: 'Celular y código' },
  { id: 'TARJETA', label: 'Tarjeta', hint: 'Crédito o débito' },
] as const

function PaymentMark({ id }: { id: 'YAPE' | 'PLIN' | 'TARJETA' }) {
  if (id === 'TARJETA') return <span className="pay-mark pay-mark-card" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h4" /></svg></span>
  return <span className={`pay-mark pay-mark-${id.toLowerCase()}`} aria-hidden="true">{id === 'YAPE' ? 'Yape' : 'Plin'}</span>
}

const pickupAddress = 'Jr. Doymer 268, Barranco, Lima, Perú'

export default function CheckoutPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [paymentToast, setPaymentToast] = useState('')
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const activeFieldsetRef = useRef<HTMLFieldSetElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const {
    address, addressConfirmed, businessName, businessRuc, cart, cartSubtotal,
    confirmDeliveryAddress, confirmDeliveryDetails, completeOrder, customer, delivery, department,
    district, error, openAuth, payment, paymentApproved, paymentNotice, phone, province, quote, quoteError, couponNotice, quoteLoading,
    cardName, cardNumber, cardExpiry, cardSecurityCode, formatCardNumber,
    receipt, reference, saveAccountData, savingAccount, setAddress, setAddressConfirmed, setBusinessName,
    setBusinessRuc, setCouponInput, setDelivery, setDepartment, setDistrict,
    setCardName, setCardNumber, setCardExpiry, setCardSecurityCode,
    setError, setPhone, setProvince, setReceipt, setReference, setSaveAccountData,
    setShowAddressDialog, showAddressDialog, submitting, couponInput, couponCode, applyCoupon, removeCoupon,
    testPhone, testCode, updateTestPhone, updateTestCode, selectPayment, validateTestPayment,
  } = useCheckoutPage()
  const paymentTotal = quote?.total ?? cartSubtotal

  useEffect(() => {
    if (!paymentNotice) {
      setPaymentToast('')
      return
    }
    setPaymentToast(paymentNotice)
    const timeout = window.setTimeout(() => setPaymentToast(''), 15000)
    return () => window.clearTimeout(timeout)
  }, [paymentNotice])

  function continueToNextStep() {
    const fieldset = activeFieldsetRef.current
    if (!fieldset) return
    if (!fieldset.checkValidity()) {
      fieldset.reportValidity()
      return
    }
    if (activeStep === 0 && delivery === 'DELIVERY' && !addressConfirmed) {
      setError('Confirma los datos de entrega antes de continuar.')
      return
    }
    setError('')
    setActiveStep((step) => Math.min(step + 1, 2))
  }

  function handleCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (activeStep < 2) {
      continueToNextStep()
      return
    }
    setShowOrderConfirmation(true)
  }

  async function confirmAddressAndContinue(saveToAccount?: boolean) {
    const confirmed = saveToAccount === undefined
      ? confirmDeliveryAddress()
      : await confirmDeliveryDetails(saveToAccount)
    if (confirmed) {
      setError('')
      setActiveStep(1)
    }
  }

  if (!customer) return <section className="customer-page page-shell"><PageIntro eyebrow="Compra" title="Finalizar pedido">Inicia sesión para usar los datos guardados en tu cuenta.</PageIntro><button className="button button-dark" type="button" onClick={() => openAuth('login')}>Iniciar sesión</button></section>
  if (!cart.length) return <section className="customer-page page-shell"><PageIntro eyebrow="Compra" title="Tu carrito está vacío">Agrega una pieza antes de continuar con el pedido.</PageIntro><Link className="button button-dark" to="/productos">Ver productos</Link></section>

  return <section className="customer-page page-shell checkout-page">
    <PageIntro eyebrow="Compra" title="Finalizar pedido">Revisa cada detalle. Tu teléfono y dirección solo se usan para coordinar la entrega.</PageIntro>
    <ol className="checkout-progress" aria-label="Etapas de la compra">
      <li className={activeStep === 0 ? 'is-current' : activeStep > 0 ? 'is-complete' : ''} aria-current={activeStep === 0 ? 'step' : undefined}><span>{activeStep > 0 ? '✓' : '01'}</span><div><strong>Entrega</strong><small>Destino y contacto</small></div></li>
      <li className={activeStep === 1 ? 'is-current' : activeStep > 1 ? 'is-complete' : ''} aria-current={activeStep === 1 ? 'step' : undefined}><span>{activeStep > 1 ? '✓' : '02'}</span><div><strong>Comprobante</strong><small>Boleta o factura</small></div></li>
      <li className={activeStep === 2 ? 'is-current' : ''} aria-current={activeStep === 2 ? 'step' : undefined}><span>03</span><div><strong>Pago</strong><small>Método</small></div></li>
    </ol>
    <form ref={formRef} className="checkout-layout checkout-layout-v2" onSubmit={handleCheckoutSubmit} autoComplete="off">
      <div className="checkout-fields">
        {activeStep === 0 && <fieldset ref={activeFieldsetRef} className="checkout-step-card"><legend><span>01</span> Entrega</legend>
          <p className="checkout-step-description">Elige cómo recibir tus piezas.</p>
          <label className={`checkout-choice checkout-delivery-choice${delivery === 'DELIVERY' ? ' is-selected' : ''}`}><input type="radio" name="delivery" checked={delivery === 'DELIVERY'} onChange={() => { setDelivery('DELIVERY'); setAddressConfirmed(false) }} /><span><strong>Delivery a domicilio</strong><small>Coordinaremos contigo por teléfono.</small></span></label>
          <label className={`checkout-choice checkout-delivery-choice${delivery === 'RECOJO_TIENDA' ? ' is-selected' : ''}`}><input type="radio" name="delivery" checked={delivery === 'RECOJO_TIENDA'} onChange={() => { setDelivery('RECOJO_TIENDA'); setAddressConfirmed(true); setError('') }} /><span><strong>Recojo en tienda</strong><small>Recoge tu pedido en nuestro taller.</small></span></label>
          {delivery === 'DELIVERY' ? <div className="checkout-address">
            <label className="checkout-address-wide">Dirección<input autoComplete="street-address" required maxLength={200} value={address} onChange={(event) => { setAddress(event.target.value); setAddressConfirmed(false) }} placeholder="Calle, avenida y número" /></label>
            <label>Distrito<input required maxLength={60} value={district} onChange={(event) => { setDistrict(event.target.value); setAddressConfirmed(false) }} /></label>
            <label>Provincia<input required maxLength={60} value={province} onChange={(event) => { setProvince(event.target.value); setAddressConfirmed(false) }} /></label>
            <label>Departamento<input required maxLength={60} value={department} onChange={(event) => { setDepartment(event.target.value); setAddressConfirmed(false) }} /></label>
            <label>Teléfono de contacto<input required autoComplete="tel" inputMode="numeric" maxLength={9} pattern="9[0-9]{8}" value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 9)); setAddressConfirmed(false) }} placeholder="9 dígitos" /></label>
            <label className="checkout-address-wide">Referencia <span className="checkout-optional">(opcional)</span><input maxLength={250} value={reference} onChange={(event) => { setReference(event.target.value); setAddressConfirmed(false) }} placeholder="Piso, interior o punto de referencia" /></label>
            <button className="button button-light" type="button" onClick={() => void confirmAddressAndContinue()}>Confirmar datos de entrega</button>
            {addressConfirmed && <p className="checkout-confirmed" role="status">Datos de entrega confirmados para este pedido.</p>}
          </div> : <div className="pickup-address"><strong>Dirección de recojo</strong><span>{pickupAddress}</span><small>Te avisaremos cuando el pedido esté listo.</small></div>}
        </fieldset>}
        {activeStep === 1 && <fieldset ref={activeFieldsetRef} className="checkout-step-card"><legend><span>02</span> Comprobante</legend>
          <p className="checkout-step-description">Selecciona el comprobante para tu compra.</p>
          <label className={`checkout-choice checkout-delivery-choice${receipt === 'BOLETA' ? ' is-selected' : ''}`}><input type="radio" name="receipt" checked={receipt === 'BOLETA'} onChange={() => setReceipt('BOLETA')} /><span><strong>Boleta</strong><small>Para consumidor final.</small></span></label>
          <label className={`checkout-choice checkout-delivery-choice${receipt === 'FACTURA' ? ' is-selected' : ''}`}><input type="radio" name="receipt" checked={receipt === 'FACTURA'} onChange={() => setReceipt('FACTURA')} /><span><strong>Factura</strong><small>Para compras con RUC.</small></span></label>
          {receipt === 'FACTURA' && <div className="checkout-address"><label>Razón social<input required maxLength={150} value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label><label>RUC (11 dígitos)<input required inputMode="numeric" pattern="(10|15|16|17|20)[0-9]{9}" title="RUC de 11 dígitos que empiece con 10, 15, 16, 17 o 20" maxLength={11} value={businessRuc} onChange={(event) => setBusinessRuc(event.target.value)} /></label></div>}
        </fieldset>}
        {activeStep === 2 && <fieldset ref={activeFieldsetRef} className="checkout-step-card"><legend><span>03</span> Método de pago</legend>
          <p className="checkout-step-description">Selecciona un medio y valida los datos para registrar el pedido.</p>
          <div className="pay-methods" role="radiogroup" aria-label="Método de pago">
            {paymentMethods.map((option) => <label className={`pay-method pay-method-${option.id.toLowerCase()}${payment === option.id ? ' is-selected' : ''}`} key={option.id}>
              <input type="radio" name="payment" checked={payment === option.id} onChange={() => selectPayment(option.id)} />
              <PaymentMark id={option.id} />
              <span className="pay-method-copy"><strong>{option.label}</strong><small>{option.hint}</small></span>
              <span className="pay-method-check" aria-hidden="true" />
            </label>)}
          </div>
          {payment !== 'TARJETA' && <div className={`wallet-panel wallet-panel-${payment.toLowerCase()}`}>
            <p className="wallet-intro">Ingresa el celular de tu cuenta {payment === 'YAPE' ? 'Yape' : 'Plin'} y el código de 6 dígitos que recibirás para pagar <strong>S/ {paymentTotal.toFixed(2)}</strong>.</p>
            <div className="wallet-fields">
              <label>Celular<input type="tel" inputMode="numeric" autoComplete="off" maxLength={9} pattern="9[0-9]{8}" value={testPhone} onChange={(event) => updateTestPhone(event.target.value)} placeholder="9XX XXX XXX" /></label>
              <label>Código<input inputMode="numeric" autoComplete="off" maxLength={6} pattern="[0-9]{6}" value={testCode} onChange={(event) => updateTestCode(event.target.value)} placeholder="6 dígitos" /></label>
            </div>
          </div>}
          {payment === 'TARJETA' && <div className="card-panel">
            <div className={`card-preview card-brand-${detectCardBrand(cardNumber)}`} aria-hidden="true">
              <span className="card-preview-chip" />
              <span className="card-preview-brand">{{ visa: 'VISA', mastercard: 'Mastercard', amex: 'AMEX', diners: 'Diners', unknown: '' }[detectCardBrand(cardNumber)]}</span>
              <span className="card-preview-number">{(cardNumber + '•'.repeat(Math.max(0, 16 - cardNumber.length))).replace(/(.{4})(?=.)/g, '$1 ')}</span>
              <span className="card-preview-row"><span><small>Titular</small>{cardName || 'NOMBRE APELLIDO'}</span><span><small>Vence</small>{cardExpiry || 'MM/AA'}</span></span>
            </div>
            <div className="card-fields">
              <label className="card-field-wide">Número de tarjeta<input type="text" inputMode="numeric" autoComplete="off" maxLength={23} value={formatCardNumber(cardNumber)} onChange={(event) => setCardNumber(event.target.value)} placeholder="0000 0000 0000 0000" /></label>
              <label className="card-field-wide">Nombre del titular<input type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} value={cardName} onChange={(event) => setCardName(event.target.value)} placeholder="Como aparece en la tarjeta" /></label>
              <label>Vencimiento<input type="text" inputMode="numeric" autoComplete="off" maxLength={5} value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} placeholder="MM/AA" /></label>
              <label>CVV<input type="password" inputMode="numeric" autoComplete="off" maxLength={securityCodeLength(detectCardBrand(cardNumber))} value={cardSecurityCode} onChange={(event) => setCardSecurityCode(event.target.value)} placeholder={'•'.repeat(securityCodeLength(detectCardBrand(cardNumber)))} /></label>
            </div>
            <small className="card-note">Todo datos de información están protegidos.</small>
          </div>}
          <button className="button button-light checkout-validate-payment" type="button" onClick={validateTestPayment} disabled={paymentApproved}>Validar datos</button>
        </fieldset>}
        {error && <p className="auth-error checkout-form-error" role="alert">{error}</p>}
        {activeStep > 0 && <div className="checkout-step-actions">
          <button className="button button-light" type="button" onClick={() => { setError(''); setActiveStep((step) => Math.max(step - 1, 0)) }}>Volver</button>
        </div>}
      </div>
      <aside className="cart-summary checkout-summary checkout-order-summary">
        <span className="checkout-summary-eyebrow">Resumen</span>
        <h2>Tu pedido</h2>
        {cart.map(({ product, quantity }) => (
          <div className="checkout-summary-product checkout-order-line" key={product.slug}>
            <img src={product.image} alt="" />
            <span>{product.name}<small>{quantity} × S/ {product.price.toFixed(2)}</small></span>
            <strong>S/ {(quantity * product.price).toFixed(2)}</strong>
          </div>
        ))}
        <div className="order-detail-total"><span>Subtotal</span><strong>S/ {(quote?.subtotal ?? cartSubtotal).toFixed(2)}</strong></div>
        <div className="checkout-coupon-control">
          <label htmlFor="checkout-coupon">Código de cupón</label>
          <div>
            <input
              id="checkout-coupon"
              type="text"
              maxLength={30}
              autoComplete="off"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
              placeholder="Ej. CERAMAX10"
              aria-describedby={quoteError || couponNotice ? 'checkout-coupon-error' : undefined}
            />
            {couponCode
              ? <button type="button" onClick={removeCoupon}>Quitar</button>
              : <button type="button" onClick={applyCoupon} disabled={quoteLoading}>Aplicar</button>}
          </div>
          {quote?.codigoCupon && <small className="checkout-coupon-success">Cupón {quote.codigoCupon} aplicado.</small>}
          {(couponNotice || quoteError) && <small id="checkout-coupon-error" className="checkout-coupon-error" role="alert">{couponNotice || quoteError}</small>}
        </div>
        {quote && quote.descuentoCupon > 0 && <div className="order-detail-total checkout-coupon-discount"><span>Descuento de cupón</span><strong>− S/ {quote.descuentoCupon.toFixed(2)}</strong></div>}
        {quote && <>
          <div className="order-detail-total"><span>IGV</span><strong>S/ {quote.igv.toFixed(2)}</strong></div>
          <div className="order-detail-total"><span>Envío</span><strong>S/ {quote.costoEnvio.toFixed(2)}</strong></div>
        </>}
        <div className="order-detail-total checkout-grand-total">
          <span>Total</span><strong>{quoteLoading ? 'Calculando…' : `S/ ${(quote?.total ?? cartSubtotal).toFixed(2)}`}</strong>
        </div>
        <p className="checkout-demo-note"><strong>Nota</strong><br />Los datos de tu cuenta están protegidos.</p>
        <button
          className="button button-dark"
          type="button"
          onClick={() => {
            if (activeStep < 2) continueToNextStep()
            else formRef.current?.requestSubmit()
          }}
          disabled={activeStep === 2 && (submitting || quoteLoading || !quote || !paymentApproved)}
        >
          {activeStep === 2
            ? submitting ? 'Registrando pedido…' : paymentApproved && quote ? `Generar pedido · S/ ${quote.total.toFixed(2)}` : 'Valida el pago para continuar'
            : activeStep === 0 ? 'Continuar a comprobante' : 'Continuar a pago'}
        </button>
        <Link className="checkout-back-link" to="/carrito">Volver al carrito</Link>
      </aside>
    </form>
    {paymentToast && <div className="checkout-payment-toast" role="status" aria-live="polite">
      <span className="checkout-payment-toast-check" aria-hidden="true">✓</span>
      <span>{paymentToast}</span>
    </div>}
    {showAddressDialog && <div className="auth-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingAccount) setShowAddressDialog(false) }}><section className="address-confirm-dialog checkout-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="address-confirm-title"><button className="dialog-close" type="button" aria-label="Cerrar" disabled={savingAccount} onClick={() => setShowAddressDialog(false)}>×</button><p className="eyebrow">Confirmar datos</p><h2 id="address-confirm-title">¿Actualizar los datos de tu cuenta?</h2><p>Los cambios se usarán para este pedido. Si lo autorizas, también guardaremos el teléfono y la dirección para tus próximas compras.</p><div className="checkout-dialog-preview"><strong>{phone}</strong><span>{[address, district, province, department].filter(Boolean).join(', ')}</span></div><label className="save-profile-choice"><input type="checkbox" checked={saveAccountData} onChange={(event) => setSaveAccountData(event.target.checked)} /><span><strong>Guardar también en mi cuenta</strong><small>Puedes cambiar esta información nuevamente cuando quieras.</small></span></label><div className="checkout-dialog-actions"><button className="button button-light" type="button" disabled={savingAccount} onClick={() => void confirmAddressAndContinue(false)}>Usar solo en este pedido</button><button className="button button-dark" type="button" disabled={savingAccount} onClick={() => void confirmAddressAndContinue(saveAccountData)}>{savingAccount ? 'Guardando…' : saveAccountData ? 'Guardar y continuar' : 'Continuar'}</button></div></section></div>}
    <ConfirmDialog
      open={showOrderConfirmation}
      title="Revisa tu pedido antes de confirmarlo"
      description="Al confirmar, se registrará un pedido con estos datos. Puedes volver atrás si necesitas corregir algo."
      confirmLabel={submitting ? 'Registrando pedido…' : 'Confirmar pedido'}
      cancelLabel="Seguir revisando"
      pending={submitting}
      error={error}
      onCancel={() => setShowOrderConfirmation(false)}
      onConfirm={() => void completeOrder()}
    >
      <div className="checkout-final-review">
        <div><span>Productos</span><strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
        <div><span>Entrega</span><strong>{delivery === 'DELIVERY' ? 'Delivery' : 'Recojo en tienda'}</strong></div>
        <div><span>Comprobante</span><strong>{receipt === 'FACTURA' ? 'Factura' : 'Boleta'}</strong></div>
        <div><span>Método de pago</span><strong>{payment === 'TARJETA' ? 'Tarjeta' : payment}</strong></div>
        <div className="checkout-final-total"><span>Total</span><strong>S/ {paymentTotal.toFixed(2)}</strong></div>
      </div>
      <p className="checkout-final-simulation" role="note">Pago simulado: no se realizará ningún cargo real.</p>
    </ConfirmDialog>
  </section>
}
