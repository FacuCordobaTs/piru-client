/**
 * La demo de la tienda: `/:username?demo`, el link que se le manda a un local en la prospección.
 *
 * Sobre su tienda de verdad (su carta, su logo, sus colores), un recorrido le cuenta lo que Piru
 * hace además de tomar pedidos (components/demo/) y la tienda queda como la ve Martina, una
 * clienta de ejemplo que vuelve a pedir: con sus datos guardados, sus puntos y el 10% del mensaje
 * de recompra que la trajo. Es una simulación en el navegador: no registra visitas ni eventos (ni
 * GTM ni pixel), no consulta ni guarda nada de Martina y el pedido no se crea.
 *
 * Repite reglas del dominio, como las ilustraciones de la guía de marketers: la escalera de
 * recompra (el 2º mensaje va con 10%), el club de puntos (1 punto cada $100, se acreditan al
 * cobrar) y el "se está yendo" (1,5 veces su ritmo sin pedir). Si cambia una regla, se actualiza
 * también acá y en las escenas.
 */

import { buildWhatsappOrderMessage } from './whatsappOrderMessage'

export const URL_PANEL: string = import.meta.env.VITE_ADMIN_URL || 'https://admin.piru.app'

/**
 * A donde lleva el botón "Ver tu panel de administrador": la entrada de la demo del admin para este
 * local (`/demo/:username`). Ahí se entra al panel sin login, con datos de ejemplo y un recorrido
 * de bienvenida. Es el único momento en que la demo habla con el backend, y recién cuando el local
 * lo toca: sólo hay sesión mientras la tienda no tenga dueño; si ya lo tiene, el admin lo manda a
 * entrar con su cuenta.
 */
export function urlPanelDemo(username: string): string {
  return `${URL_PANEL.replace(/\/+$/, '')}/demo/${encodeURIComponent(username)}`
}

/** La clienta de la demo: la misma de la landing y del recorrido de marketers. */
export const CLIENTA_DEMO = {
  nombre: 'Martina González',
  corto: 'Martina',
  iniciales: 'MG',
  telefono: '341 555-0182',
  puntos: 740,
  pedidos: 7,
  cadencia: 12,
  diasSinPedir: 21,
  llego: 'Historia de Instagram',
} as const

/** El beneficio del mensaje que la trajo de vuelta: el 2º de la escalera de recompra (0/10/20 %). */
export const DESCUENTO_DEMO = 10

/** El número del pedido de prueba (el mismo que la ficha de Martina en las escenas). */
export const PEDIDO_DEMO = 1284

/**
 * El club de puntos de los locales que todavía no tienen el suyo: la regla por defecto (1 punto
 * cada $100) y los dos canjes del checkout. Con 740 puntos, Martina alcanza cualquiera de los dos,
 * pero no los dos juntos.
 */
export const CONFIG_PUNTOS_DEMO = {
  activo: true,
  modoAcumulacion: 'monto',
  pesosPorPunto: 100,
  puntosPrimerPedido: 0,
  puntosMinimosCanje: 0,
  permitirCanjeEnvioGratis: true,
  permiteCanjeEnvioGratis: true,
  puntosEnvioGratis: 300,
  permitirCanjeDescuento: true,
  permiteCanjeDescuento: true,
  descuentoTipo: 'porcentaje',
  descuentoValor: '15',
  descuentoPuntosCosto: 500,
  descuentoMontoMinimo: '0',
  descuentoTope: '0',
  vencimientoDias: null,
}

/** Lo que la tienda lee de la configuración del club (la del local o `CONFIG_PUNTOS_DEMO`). */
export type ConfiguracionPuntosDemo = {
  modoAcumulacion?: string | null
  pesosPorPunto?: number | string | null
  puntosEnvioGratis?: number | string | null
  descuentoTipo?: string | null
  descuentoValor?: number | string | null
  descuentoPuntosCosto?: number | string | null
  descuentoMontoMinimo?: number | string | null
  permiteCanjeEnvioGratis?: boolean | null
  permiteCanjeDescuento?: boolean | null
}

type ConUbicacion = { direccionLat?: string | number | null; direccionLng?: string | number | null }

type RestauranteBase = ConUbicacion & {
  id: number
  sistemaPuntos?: boolean | null
  configuracionPuntos?: unknown
  pausadoPorSuscripcion?: boolean | null
}

/**
 * La tienda como la ve Martina: abierta (aunque el local esté cerrado o pausado ahora, la demo se
 * tiene que poder probar) y con el club de puntos del local o, si no tiene uno, el de ejemplo.
 */
export function restauranteDemo<T extends RestauranteBase>(restaurante: T): T {
  const clubPropio = Boolean(restaurante.sistemaPuntos && restaurante.configuracionPuntos)
  return {
    ...restaurante,
    sistemaPuntos: true,
    configuracionPuntos: clubPropio
      ? restaurante.configuracionPuntos
      : { ...CONFIG_PUNTOS_DEMO, restauranteId: restaurante.id },
    pausadoPorSuscripcion: false,
  }
}

export interface DireccionDemo {
  direccion: string
  lat: number
  lng: number
}

/**
 * La dirección guardada de Martina: unas cuadras al norte del local (o de su primera sucursal con
 * ubicación), así cae en la zona de delivery y el envío se calcula como el de cualquier cliente.
 * "San Martín" existe en casi todas las ciudades del país.
 */
export function direccionDemo(restaurante: ConUbicacion, sucursales: ConUbicacion[] = []): DireccionDemo {
  const origen = [restaurante, ...sucursales]
    .map((lugar) => ({ lat: Number(lugar.direccionLat), lng: Number(lugar.direccionLng) }))
    .find(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0))
  const base = origen ?? { lat: -31.6333, lng: -60.7 }
  return { direccion: 'San Martín 1450', lat: base.lat + 0.0036, lng: base.lng + 0.0012 }
}

/** Lo que el checkout necesita para atender a Martina sin consultar ni guardar nada. */
export interface CheckoutDemo {
  puntos: number
  configuracionPuntos: ConfiguracionPuntosDemo | null | undefined
  direccion: DireccionDemo
}

/** Los puntos que suma un pedido, con la regla del backend (`calcularPuntosGanados`). */
export function puntosDelPedido(
  config: ConfiguracionPuntosDemo | null | undefined,
  subtotal: number,
  items: { cantidad?: number; puntosGanados?: number | string | null; esCanjePuntos?: boolean }[],
): number {
  if (!config) return 0
  const modo = config.modoAcumulacion || 'monto'
  const divisor = Number(config.pesosPorPunto) > 0 ? Number(config.pesosPorPunto) : 100
  const porMonto = modo === 'monto' || modo === 'ambos' ? Math.floor(Math.max(0, subtotal) / divisor) : 0
  const porProducto = modo === 'producto' || modo === 'ambos'
    ? items.reduce((suma, item) => suma + (item.esCanjePuntos ? 0 : Number(item.puntosGanados || 0) * (item.cantidad ?? 1)), 0)
    : 0
  return porMonto + porProducto
}

/** El pedido de prueba, ya armado para mostrarlo: lo que le llega al local y lo que suma Martina. */
export interface PedidoDemoInfo {
  numero: number
  cliente: string
  mensaje: string
  puntos: number
}

type ItemDemo = {
  precio: string | number
  cantidad?: number
  puntosGanados?: number | string | null
  esCanjePuntos?: boolean
}

type CheckoutPedidoDemo = {
  tipoPedido: 'delivery' | 'takeaway'
  nombre: string
  direccion?: string | null
  deliveryFee?: number | null
  zonaNombre?: string | null
  montoDescuento?: number | null
  descuentoPuntos?: number | null
  metodoPago?: string | null
  horarioProgramado?: string | null
  notas?: string | null
}

type RestauranteMensaje = {
  nombre?: string | null
  direccion?: string | null
  transferenciaAlias?: string | null
  configuracionPuntos?: unknown
}

/**
 * El pedido de la demo no se crea: se arma acá con el mismo texto que el cliente le manda al local
 * por WhatsApp (`buildWhatsappOrderMessage`, el del flujo real) y los puntos que sumaría al cobrarse.
 */
export function armarPedidoDemo(
  checkout: CheckoutPedidoDemo,
  items: ItemDemo[],
  restaurante: RestauranteMensaje,
): PedidoDemoInfo {
  const subtotal = items.reduce((suma, item) => suma + (parseFloat(String(item.precio)) || 0) * (item.cantidad ?? 1), 0)
  const esDelivery = checkout.tipoPedido === 'delivery'
  const envio = esDelivery ? Number(checkout.deliveryFee || 0) : 0
  const descuento = Number(checkout.montoDescuento || 0) + Number(checkout.descuentoPuntos || 0)
  const mensaje = buildWhatsappOrderMessage(
    {
      pedidoId: PEDIDO_DEMO,
      tipoPedido: checkout.tipoPedido,
      nombreCliente: checkout.nombre,
      items,
      deliveryFee: envio,
      zonaNombre: checkout.zonaNombre,
      direccion: esDelivery ? checkout.direccion : null,
      montoDescuento: descuento,
      total: Math.max(0, subtotal + envio - descuento),
      horarioProgramado: checkout.horarioProgramado || undefined,
      notas: checkout.notas || undefined,
    },
    {
      restaurantName: restaurante.nombre,
      restaurantDireccion: restaurante.direccion,
      effectiveMetodo: checkout.metodoPago || 'cash',
      transferenciaAlias: restaurante.transferenciaAlias,
    },
  )
  const config = restaurante.configuracionPuntos as ConfiguracionPuntosDemo | null | undefined
  return {
    numero: PEDIDO_DEMO,
    cliente: checkout.nombre,
    mensaje,
    puntos: puntosDelPedido(config, subtotal - descuento, items),
  }
}

const CLAVE_RECORRIDO = 'piru-demo-recorrido-v1:'

/** El recorrido se hace una vez por local en cada navegador; después la tienda abre directo. */
export function recorridoDemoVisto(username: string): boolean {
  try {
    return localStorage.getItem(CLAVE_RECORRIDO + username) === '1'
  } catch {
    return false
  }
}

export function marcarRecorridoDemoVisto(username: string) {
  try {
    localStorage.setItem(CLAVE_RECORRIDO + username, '1')
  } catch {
    /* sin storage, el recorrido vuelve a aparecer la próxima vez */
  }
}

/** Montos como en el panel ("$13.500"); la tienda los muestra sin separador de miles. */
export const pesos = (monto: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
    .format(Math.round(monto))
    .replace(/\s/g, '')
