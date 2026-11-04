export type OrderDelivery = 'DELIVERY' | 'RECOJO_TIENDA'

const LABELS: Record<string, string> = {
  PENDIENTE_PAGO: 'Confirmando tu pago',
  PREPARACION: 'Preparando tu pedido',
  LISTO_DESPACHO: 'Listo para enviarse',
  LISTO_PARA_RECOGER: 'Listo para recoger',
  EN_RUTA: 'En camino a tu dirección',
  EN_CAMINO: 'En camino a tu dirección',
  COMPLETADA: 'Entregado',
  NO_ENTREGADA: 'No se pudo entregar',
  CANCELADO: 'Cancelado',
}

const HELP: Record<string, string> = {
  PENDIENTE_PAGO: 'Recibimos tu pedido y estamos confirmando tu pago. No necesitas hacer nada por ahora.',
  PREPARACION: 'Estamos preparando tus piezas con cuidado. Te avisaremos cuando estén listas.',
  LISTO_DESPACHO: 'Tu pedido ya está embalado y saldrá pronto hacia tu dirección.',
  LISTO_PARA_RECOGER: 'Tu pedido ya está listo. Puedes pasar a recogerlo en la tienda.',
  EN_RUTA: 'Tu pedido va en camino. Mantén tu teléfono a la mano por si te llaman para coordinar la entrega.',
  EN_CAMINO: 'Tu pedido va en camino. Mantén tu teléfono a la mano por si te llaman para coordinar la entrega.',
  COMPLETADA: 'Pedido entregado. ¡Gracias por tu compra!',
  NO_ENTREGADA: 'No pudimos entregar tu pedido. Escríbenos desde Contacto y coordinamos una nueva entrega.',
  CANCELADO: 'Este pedido fue cancelado. Si no lo esperabas, escríbenos desde Contacto.',
}

/** Estados en los que el pedido ya no cambiará más. */
const FINAL = new Set(['COMPLETADA', 'CANCELADO', 'NO_ENTREGADA'])

export function statusLabel(code: string, fallback = 'En proceso') {
  return LABELS[code] ?? fallback
}

export function statusHelp(code: string) {
  return HELP[code] ?? 'Tu pedido está en proceso. Aquí verás cada cambio de estado.'
}

export function isFinalStatus(code: string) {
  return FINAL.has(code)
}

export function isProblemStatus(code: string) {
  return code === 'CANCELADO' || code === 'NO_ENTREGADA'
}

/** Pasos del recorrido normal de un pedido, según cómo se entrega. */
export function orderSteps(delivery: OrderDelivery): string[] {
  return delivery === 'DELIVERY'
    ? ['PENDIENTE_PAGO', 'PREPARACION', 'LISTO_DESPACHO', 'EN_RUTA', 'COMPLETADA']
    : ['PENDIENTE_PAGO', 'PREPARACION', 'LISTO_PARA_RECOGER', 'COMPLETADA']
}

/** Posición (0 = primer paso) del estado dentro del recorrido; -1 si es cancelado o no entregado. */
export function stepPosition(code: string, delivery: OrderDelivery) {
  if (isProblemStatus(code)) return -1
  const normalized = code === 'EN_CAMINO' ? 'EN_RUTA' : code
  return Math.max(0, orderSteps(delivery).indexOf(normalized))
}
