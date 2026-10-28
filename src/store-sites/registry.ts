import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { MenuDeliveryModel } from '@/features/tienda/delivery/useMenuDelivery'

/**
 * Tiendas con diseño propio, registradas en código.
 *
 * La clave es el subdominio (`burgers10.piru.app`) y `username` es la tienda real de la API: el
 * catálogo, los pedidos, los puntos y el checkout son los mismos de la tienda de siempre. El diseño
 * sólo reemplaza la composición visual; el carrito, los diálogos y el detalle de producto siguen
 * viviendo en `MenuDelivery`.
 *
 * Para sumar una tienda: copiar `burgers10/`, cambiar el diseño, agregar su entrada acá, su
 * `meta.ts` y publicar `web/`. No hay que tocar el admin ni la base.
 */
export interface StoreSite {
    /** `restaurante.username` de la tienda. Independiente del subdominio y del diseño. */
    username: string
    Diseno: LazyExoticComponent<ComponentType<{ modelo: MenuDeliveryModel }>>
    /** Color de fondo mientras descarga el diseño, para que no se vea un flash blanco. */
    loadingBackground?: string
}

const storeSites: Record<string, StoreSite> = {
    burgers10: {
        username: 'burgers10',
        Diseno: lazy(() => import('./burgers10/Diseno').then((modulo) => ({ default: modulo.DisenoBurgers10 }))),
        loadingBackground: '#161310',
    },
}

export function getStoreSite(subdomain: string | null): StoreSite | null {
    return subdomain && Object.hasOwn(storeSites, subdomain) ? storeSites[subdomain] : null
}
