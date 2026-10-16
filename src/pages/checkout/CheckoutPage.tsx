import './CheckoutPage.css'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/common/PageIntro'
import { useCheckoutPage } from './useCheckoutPage'

const pickupAddress = 'Jr. Doymer 268, Barranco, Lima, Perú'

export default function CheckoutPage() {
  const [activeStep, setActiveStep] = useState(0)
  const activeFieldsetRef = useRef<HTMLFieldSetElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const {
    address, addressConfirmed, businessName, businessRuc, cardName, cardNumber, cart, cartSubtotal,
    confirmDeliveryAddress, confirmDeliveryDetails, completeOrder, customer, cvv, delivery, department,
    district, error, expiry, openAuth, payment, phone, province, quote, quoteError, quoteLoading,
    receipt, reference, saveAccountData, savingAccount, setAddress, setAddressConfirmed, setBusinessName,
    setBusinessRuc, setCardName, setCardNumber, setCvv, setDelivery, setDepartment, setDistrict,
    setError, setExpiry, setPayment, setPhone, setProvince, setReceipt, setReference, setSaveAccountData,
    setShowAddressDialog, showAddressDialog, submitting,
  } = useCheckoutPage()

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

  if (!customer) return <section className="customer-page page-shell"><PageIntro eyebrow="Compra segura" title="Finalizar pedido">Inicia sesión para usar los datos guardados en tu cuenta.</PageIntro><button className="button button-dark" type="button" onClick={() => openAuth('login')}>Iniciar sesión</button></section>
  if (!cart.length) return <section className="customer-page page-shell"><PageIntro eyebrow="Compra" title="Tu carrito está vacío">Agrega una pieza antes de continuar con el pedido.</PageIntro><Link className="button button-dark" to="/productos">Ver productos</Link></section>

  return <section className="customer-page page-shell checkout-page">
    <PageIntro eyebrow="Compra segura · Pago simulado" title="Finalizar pedido">Revisa cada detalle. Tu teléfono y dirección solo se usan para coordinar la entrega.</PageIntro>
    <ol className="checkout-progress" aria-label="Etapas de la compra">
      <li className={activeStep === 0 ? 'is-current' : activeStep > 0 ? 'is-complete' : ''} aria-current={activeStep === 0 ? 'step' : undefined}><span>{activeStep > 0 ? '✓' : '01'}</span><div><strong>Entrega</strong><small>Destino y contacto</small></div></li>
      <li className={activeStep === 1 ? 'is-current' : activeStep > 1 ? 'is-complete' : ''} aria-current={activeStep === 1 ? 'step' : undefined}><span>{activeStep > 1 ? '✓' : '02'}</span><div><strong>Comprobante</strong><small>Boleta o factura</small></div></li>
      <li className={activeStep === 2 ? 'is-current' : ''} aria-current={activeStep === 2 ? 'step' : undefined}><span>03</span><div><strong>Pago</strong><small>Simulación</small></div></li>
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
          <p className="checkout-step-description">Elige un método para simular el pago.</p>
          {(['YAPE', 'PLIN', 'TARJETA'] as const).map((option) => <label className={`checkout-choice checkout-delivery-choice${payment === option ? ' is-selected' : ''}`} key={option}><input type="radio" name="payment" checked={payment === option} onChange={() => setPayment(option)} /><span><strong>{option === 'TARJETA' ? 'Tarjeta' : option}</strong><small>{option === 'TARJETA' ? 'Datos de prueba' : 'Pago móvil de demostración'}</small></span></label>)}
          {payment !== 'TARJETA' ? <div className="payment-qr" aria-label={`Código QR ilustrativo de ${payment}`}><span>QR</span><strong>{payment}</strong><small>Imagen ilustrativa de demostración</small></div> : <div className="checkout-address card-fields"><label>Nombre del titular<input autoComplete="cc-name" value={cardName} onChange={(event) => setCardName(event.target.value)} /></label><label>Número de tarjeta<input autoComplete="cc-number" inputMode="numeric" value={cardNumber} onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 19))} /></label><label>Vencimiento<input autoComplete="cc-exp" placeholder="MM/AA" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></label><label>CVV<input autoComplete="cc-csc" inputMode="numeric" maxLength={4} value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, ''))} /></label><small>Datos de prueba; nunca se guardan ni se envían.</small></div>}
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
        {quote && <>
          <div className="order-detail-total"><span>IGV</span><strong>S/ {quote.igv.toFixed(2)}</strong></div>
          <div className="order-detail-total"><span>Envío</span><strong>S/ {quote.costoEnvio.toFixed(2)}</strong></div>
        </>}
        <div className="order-detail-total checkout-grand-total">
          <span>Total</span><strong>{quoteLoading ? 'Calculando…' : `S/ ${(quote?.total ?? cartSubtotal).toFixed(2)}`}</strong>
        </div>
        {quoteError && <p className="auth-error checkout-form-error" role="alert">{quoteError}</p>}
        <p className="checkout-demo-note"><strong>Pago simulado</strong><br />El pedido y su pago de prueba se registrarán en tu cuenta y en el sistema de gestión.</p>
        <button
          className="button button-dark"
          type="button"
          onClick={() => {
            if (activeStep < 2) continueToNextStep()
            else formRef.current?.requestSubmit()
          }}
          disabled={activeStep === 2 && (submitting || quoteLoading || !quote)}
        >
          {activeStep === 2
            ? submitting ? 'Registrando pedido…' : `Generar pedido${quote ? ` · S/ ${quote.total.toFixed(2)}` : ''}`
            : activeStep === 0 ? 'Continuar a comprobante' : 'Continuar a pago'}
        </button>
        <Link className="checkout-back-link" to="/carrito">Volver al carrito</Link>
      </aside>
    </form>
    {showAddressDialog && <div className="auth-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingAccount) setShowAddressDialog(false) }}><section className="address-confirm-dialog checkout-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="address-confirm-title"><button className="dialog-close" type="button" aria-label="Cerrar" disabled={savingAccount} onClick={() => setShowAddressDialog(false)}>×</button><p className="eyebrow">Confirmar datos</p><h2 id="address-confirm-title">¿Actualizar los datos de tu cuenta?</h2><p>Los cambios se usarán para este pedido. Si lo autorizas, también guardaremos el teléfono y la dirección para tus próximas compras.</p><div className="checkout-dialog-preview"><strong>{phone}</strong><span>{[address, district, province, department].filter(Boolean).join(', ')}</span></div><label className="save-profile-choice"><input type="checkbox" checked={saveAccountData} onChange={(event) => setSaveAccountData(event.target.checked)} /><span><strong>Guardar también en mi cuenta</strong><small>Puedes cambiar esta información nuevamente cuando quieras.</small></span></label><div className="checkout-dialog-actions"><button className="button button-light" type="button" disabled={savingAccount} onClick={() => void confirmAddressAndContinue(false)}>Usar solo en este pedido</button><button className="button button-dark" type="button" disabled={savingAccount} onClick={() => void confirmAddressAndContinue(saveAccountData)}>{savingAccount ? 'Guardando…' : saveAccountData ? 'Guardar y continuar' : 'Continuar'}</button></div></section></div>}
  </section>
}
