import { CLIENTA_DEMO } from '@/lib/demo'
import { registrarEventoPixelUnaVez } from '@/lib/tracking'
import type { CheckoutIndividual } from '../datos'
import type { useDeliveryPresentacion } from './useDeliveryPresentacion'
import type { useDeliveryProductos } from './useDeliveryProductos'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'demo'
    | 'cartItems'
    | 'setEsPedidoHabitual'
    | 'restaurante'
    | 'metodoPagoHabitualRef'
    | 'checkoutDeliveryData'
    | 'canjeEnvioGratis'
    | 'canjeDescuento'
    | 'setCheckoutDeliveryData'
    | 'checkoutDataRef'
    | 'setMostrarCheckoutEnCarrito'
    | 'setExpandido'
> &
    Pick<ReturnType<typeof useDeliveryProductos>, 'itemsTotalCheckout' | 'totalPedido'> &
    Pick<ReturnType<typeof useDeliveryPresentacion>, 'direccionClienta' | 'checkoutCerrado'>

export function usePrepararCheckout({
    checkoutCerrado,
    demo,
    cartItems,
    totalPedido,
    setEsPedidoHabitual,
    restaurante,
    metodoPagoHabitualRef,
    direccionClienta,
    checkoutDeliveryData,
    itemsTotalCheckout,
    canjeEnvioGratis,
    canjeDescuento,
    setCheckoutDeliveryData,
    checkoutDataRef,
    setMostrarCheckoutEnCarrito,
    setExpandido,
}: Contexto) {
    const iniciarCheckout = () => {
        if (checkoutCerrado) return
        // Meta cuenta el inicio de checkout una vez por sesión: ir y
        // volver del carrito no puede inflar el paso del embudo.
        if (!demo)
            registrarEventoPixelUnaVez('InitiateCheckout', 'checkout', {
                items: cartItems,
                valor: Number(totalPedido),
            })
        setEsPedidoHabitual(false)
        // El checkout pre-completado necesita un medio de pago válido del
        // local: el alta pública rechaza el pedido sin él. Se prioriza el
        // habitual que trae el token y si no el primero habilitado.
        const metodosDisponibles = new Set((restaurante?.metodosPago || []).map((m) => m.id))
        const metodoPagoHabitual = metodoPagoHabitualRef.current
        const metodoPagoInicial =
            metodoPagoHabitual && metodosDisponibles.has(metodoPagoHabitual)
                ? metodoPagoHabitual
                : (restaurante?.metodosPago?.[0]?.id ?? null)
        // Los datos de quien ya pidió desde este navegador; en la
        // demo, los de Martina, que vuelve a pedir.
        const guardado = direccionClienta
            ? {
                  nombre: CLIENTA_DEMO.nombre,
                  telefono: CLIENTA_DEMO.telefono,
                  ...direccionClienta,
                  tipoDomicilio: 'casa' as const,
              }
            : {
                  nombre: localStorage.getItem('cliente_nombre') || '',
                  telefono: localStorage.getItem('cliente_telefono') || '',
                  direccion: localStorage.getItem('cliente_direccion') || '',
                  lat: localStorage.getItem('cliente_lat')
                      ? Number(localStorage.getItem('cliente_lat'))
                      : null,
                  lng: localStorage.getItem('cliente_lng')
                      ? Number(localStorage.getItem('cliente_lng'))
                      : null,
                  tipoDomicilio: null,
              }
        const checkout: CheckoutIndividual = checkoutDeliveryData
            ? {
                  ...checkoutDeliveryData,
                  itemsTotal: itemsTotalCheckout,
                  canjeEnvioGratis,
                  canjeDescuento,
                  metodoPago: checkoutDeliveryData.metodoPago ?? metodoPagoInicial,
              }
            : {
                  tipoPedido: restaurante?.deliveryEnabled !== false ? 'delivery' : 'takeaway',
                  ...guardado,
                  notas: '',
                  deliveryFee: Number(restaurante?.deliveryFee || 0),
                  zonaNombre: null,
                  itemsTotal: itemsTotalCheckout,
                  total: itemsTotalCheckout,
                  codigoDescuentoId: null,
                  montoDescuento: 0,
                  metodoPago: metodoPagoInicial,
                  horarioProgramado: '',
                  sucursalId: null,
                  canjeEnvioGratis,
                  canjeDescuento,
              }
        // El estado que dibuja el formulario y la referencia que se envía nacen juntos.
        checkoutDataRef.current = checkout
        setCheckoutDeliveryData(checkout)
        setMostrarCheckoutEnCarrito(true)
        setExpandido(false)
    }
    return { iniciarCheckout }
}
