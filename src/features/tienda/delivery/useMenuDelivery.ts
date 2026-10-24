import type { CampanaPublica } from './modelo'
import { useCrearSala } from './useCrearSala'
import { useDeliveryCampanas } from './useDeliveryCampanas'
import { useDeliveryCheckout } from './useDeliveryCheckout'
import { useDeliveryDatos } from './useDeliveryDatos'
import { useDeliveryNavegacion } from './useDeliveryNavegacion'
import { useDeliveryPresentacion } from './useDeliveryPresentacion'
import { useDeliveryProductos } from './useDeliveryProductos'
import { useDeliveryPuntos } from './useDeliveryPuntos'
import { useDeliveryState } from './useDeliveryState'
import { usePedidoHabitual } from './usePedidoHabitual'
import { usePrepararCheckout } from './usePrepararCheckout'

export function useMenuDelivery(campana: CampanaPublica | null) {
    const estado = useDeliveryState(campana)
    const deliveryNavegacion = useDeliveryNavegacion({ ...estado })
    const deliveryDatos = useDeliveryDatos({ ...estado })
    const deliveryPuntos = useDeliveryPuntos(estado)
    const deliveryProductos = useDeliveryProductos({ ...estado, ...deliveryPuntos })
    useDeliveryCampanas({ ...estado, ...deliveryNavegacion })
    usePedidoHabitual({ ...estado })
    const deliveryCheckout = useDeliveryCheckout({ ...estado, ...deliveryNavegacion })
    const crearSala = useCrearSala({ ...estado })
    const deliveryPresentacion = useDeliveryPresentacion({ ...estado, ...deliveryProductos })
    const prepararCheckout = usePrepararCheckout({ ...estado, ...deliveryProductos, ...deliveryPresentacion })
    return {
        ...prepararCheckout,
        ...estado,
        ...deliveryNavegacion,
        ...deliveryDatos,
        ...deliveryPuntos,
        ...deliveryProductos,
        ...deliveryCheckout,
        ...crearSala,
        ...deliveryPresentacion,
    }
}
export type MenuDeliveryModel = ReturnType<typeof useMenuDelivery>
