import './CheckoutPage.css'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import { useCheckoutPage } from './useCheckoutPage'

const pickupAddress = 'Jr. Doymer 268, Barranco, Lima, Perú'

export default function CheckoutPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [paymentQr, setPaymentQr] = useState<{ payload: string; image: string } | null>(null)
  const [paymentQrError, setPaymentQrError] = useState('')
  const [paymentToast, setPaymentToast] = useState('')
  const activeFieldsetRef = useRef<HTMLFieldSetElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const {
    address, addressConfirmed, businessName, businessRuc, cart, cartSubtotal,
    confirmDeliveryAddress, confirmDeliveryDetails, completeOrder, customer, delivery, department,
    district, error, openAuth, payment, paymentApproved, paymentNotice, phone, province, quote, quoteError, couponNotice, quoteLoading,
    cardName, cardNumber, cardExpiry, cardSecurityCode,
    receipt, reference, saveAccountData, savingAccount, setAddress, setAddressConfirmed, setBusinessName,
    setBusinessRuc, setCouponInput, setDelivery, setDepartment, setDistrict,
    setCardName, setCardNumber, setCardExpiry, setCardSecurityCode,
    setError, setPhone, setProvince, setReceipt, setReference, setSaveAccountData,
    setShowAddressDialog, showAddressDialog, submitting, couponInput, couponCode, applyCoupon, removeCoupon,
    testPhone, testCode, updateTestPhone, updateTestCode, selectPayment, validateTestPayment,
  } = useCheckoutPage()
  const paymentTotal = quote?.total ?? cartSubtotal
  const paymentQrPayload = `CERAMAX-QR-ILUSTRATIVO|${payment}|S/${paymentTotal.toFixed(2)}`

  useEffect(() => {
    if (!paymentNotice) {
      setPaymentToast('')
      return
    }
    setPaymentToast(paymentNotice)
    const timeout = window.setTimeout(() => setPaymentToast(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [paymentNotice])

  useEffect(() => {
    let active = true
    void import('qrcode').then(({ toDataURL }) => toDataURL(
      paymentQrPayload,
      { errorCorrectionLevel: 'M', margin: 1, width: 180 },
    )).then((qr) => {
      if (active) {
        setPaymentQr({ payload: paymentQrPayload, image: qr })
        setPaymentQrError('')
      }
    }).catch((cause: unknown) => {
      if (active) {
        console.error('No se pudo generar el QR ilustrativo del pago.', cause)
        setPaymentQrError('No se pudo generar el QR ilustrativo. Puedes continuar con la validación manual.')
      }
    })
    return () => { active = false }
  }, [paymentQrPayload])

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
    <form ref={formRef} className="checkout-layout checkout-layout-v2" onSubmit={completeOrder}>
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
          {receipt === 'FACTURA' && <div className="checkout-address"><label>Razón social<input required maxLength={150} value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label><label>RUC (11 dígitos)<input required inputMode="numeric" pattern="[0-9]{11}" maxLength={11} value={businessRuc} onChange={(event) => setBusinessRuc(event.target.value.replace(/\D/g, '').slice(0, 11))} /></label></div>}
        </fieldset>}
        {activeStep === 2 && <fieldset ref={activeFieldsetRef} className="checkout-step-card"><legend><span>03</span> Método de pago</legend>
          <p className="checkout-step-description">Selecciona un medio y valida los datos para registrar el pedido.</p>
          {(['YAPE', 'PLIN', 'TARJETA'] as const).map((option) => <label className={`checkout-choice checkout-delivery-choice${payment === option ? ' is-selected' : ''}`} key={option}><input type="radio" name="payment" checked={payment === option} onChange={() => selectPayment(option)} /><span><strong>{option === 'TARJETA' ? 'Tarjeta' : option}</strong></span></label>)}
          {payment !== 'TARJETA' && <div className="payment-test-panel">
            <div className="payment-qr">
              {paymentQr?.payload === paymentQrPayload ? <img src={paymentQr.image} alt={`QR ilustrativo de ${payment}; no procesa pagos`} /> : <span>Generando QR…</span>}
              <div><strong>{payment}</strong><span>QR; genera una solicitud de cobro.</span></div>
            </div>
            {paymentQrError && <p className="checkout-payment-error" role="alert">{paymentQrError}</p>}
            <div className="checkout-test-credentials">
              <label>Celular<input inputMode="numeric" autoComplete="off" maxLength={9} value={testPhone} onChange={(event) => updateTestPhone(event.target.value)} placeholder="Hasta 9 dígitos" /></label>
              <label>Código<input inputMode="numeric" autoComplete="off" maxLength={9} value={testCode} onChange={(event) => updateTestCode(event.target.value)} placeholder="Hasta 9 dígitos" /></label>
              <small>Ingresa el celular y código asociados a tu pago.</small>
            </div>
          </div>}
          {payment === 'TARJETA' && <div className="checkout-test-credentials checkout-card-credentials">
            <label>Nombre del titular<input autoComplete="off" value={cardName} onChange={(event) => setCardName(event.target.value)} placeholder="Nombre y apellido" /></label>
            <label>Número de tarjeta<input inputMode="numeric" autoComplete="off" maxLength={19} value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} placeholder="Número de tarjeta" /></label>
            <label>Vencimiento<input inputMode="numeric" autoComplete="off" maxLength={5} value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} placeholder="12/30" /></label>
            <label>Código de seguridad<input inputMode="numeric" autoComplete="off" maxLength={4} value={cardSecurityCode} onChange={(event) => setCardSecurityCode(event.target.value)} placeholder="3 o 4 dígitos" /></label>
            <small>Usa los datos de tu cuenta .</small>
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
        <p className="checkout-demo-note"><strong>Seguridad del pago</strong><br />Todo proceso de pago es cofidencial y seguro, no se expondra los datos de tu tarjeta o tu codigo.</p>
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
  </section>
}
