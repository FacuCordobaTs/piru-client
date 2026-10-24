import type { ConfiguracionPuntosDemo } from '@/lib/demo'
import type { RestauranteTienda, Turno } from '@/lib/tienda'
import type { CheckoutDeliveryData } from './checkout'
import type { Agregado, Product } from './producto'

export interface ProductoTienda extends Omit<Product, 'categoria'> {
    categoria?: string | null
    categoriaOrden?: number
    disponible?: boolean
    soloCanjePuntos?: boolean
    descuentoFechaInicio?: string | null
}

export interface RestaurantePublico extends RestauranteTienda {
    id: number
    nombre: string
    username?: string
    telefono?: string | null
    comprobantesWhatsapp?: string | null
    transferenciaAlias?: string | null
    direccionLat?: string | number | null
    direccionLng?: string | number | null
    direccionSoloTexto?: boolean
    deliveryEnabled?: boolean
    takeawayEnabled?: boolean
    permitirPedidosProgramados?: boolean
    soloPedidosProgramados?: boolean
    pausadoPorSuscripcion?: boolean
    avisosWhatsappClienteEnabled?: boolean
    orderGroupEnabled?: boolean
    deliveryFee?: string | number | null
    sistemaPuntos?: boolean
    configuracionPuntos?:
        | (ConfiguracionPuntosDemo & {
              permitirCanjeEnvioGratis?: boolean
              permitirCanjeDescuento?: boolean
          })
        | null
    metodosPago?: { id: string; nombre?: string }[]
    gtmContainerId?: string | null
    metaPixelId?: string | null
}
export type SucursalPublica = { id: number; direccionLat?: string | null; direccionLng?: string | null }
export type TiendaPublicaRespuesta = {
    success: boolean
    message?: string
    data: {
        restaurante: RestaurantePublico
        productos: ProductoTienda[]
        horarios?: Turno[]
        sucursales?: SucursalPublica[]
    }
}

export type ItemCarritoTienda = {
    id: string
    productoId: number
    nombre: string
    productoNombre?: string
    categoria?: string | null
    tieneSelectorMedallon?: boolean
    precio: string
    precioOriginal?: string | number
    descuento?: number
    imagenUrl?: string | null
    cantidad: number
    varianteId?: number
    varianteNombre?: string
    varianteSecundariaId?: number
    varianteSecundariaNombre?: string
    ingredientesExcluidos?: number[]
    ingredientesExcluidosNombres?: string[]
    agregados?: Agregado[]
    nota?: string
    esCanjePuntos?: boolean
    puntosNecesarios?: number
    puntosGanados?: number | string | null
}
export type CheckoutIndividual = CheckoutDeliveryData
export type CheckoutMensaje =
    | { type: 'INICIAR_EDICION_CHECKOUT'; payload: { clienteNombre: string } }
    | { type: 'MODIFICAR_CHECKOUT'; payload: { updates: CheckoutIndividual } }
    | { type: 'CANCELAR_EDICION_CHECKOUT' | 'ACEPTAR_EDICION_CHECKOUT'; payload?: unknown }
