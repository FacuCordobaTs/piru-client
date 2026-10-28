/**
 * `@piru/tienda`: el SDK público de los sitios de Páginas (docs/PAGINAS_PROPIAS.md, §6).
 *
 * Lo que se exporta acá es contrato: `ApiTienda` (en `tipos.ts`) lo declara y la Guía para Claude lo
 * documenta. El runtime además exporta `PiruSiteRoot`, `crearTienda` y los helpers de la vista previa,
 * que usa sólo el boot (`boot.ts`, `preview.ts`), no los sitios.
 */
import { DIAS, formatoPesos, hhmm, ordenVisual, precioProducto, SEMANA, textoEstado, turnosDelDia } from '@/lib/tienda'
import { fotosDeProducto } from '@/lib/fotosProducto'
import { PiruCanjes } from './componentes'
import {
    useCampana,
    useCarrito,
    useCarta,
    useContenido,
    useHorarios,
    useLinks,
    useLocal,
    useNavegacionCarta,
    usePuntos,
    useSitio,
} from './hooks'
import type { ApiTienda, Local } from './tipos'

export {
    useSitio,
    useLocal,
    useCarta,
    useContenido,
    useHorarios,
    useCarrito,
    useCampana,
    usePuntos,
    useLinks,
    useNavegacionCarta,
    PiruCanjes,
    DIAS,
    SEMANA,
    ordenVisual,
    fotosDeProducto,
}

export const formatPesos = (valor: number | string) => formatoPesos(valor)
export const formatHora = (hora: string) => hhmm(hora)
export { turnosDelDia, textoEstado }
export const logoPara = (local: Local, sobreOscuro: boolean) => (sobreOscuro ? local.logo : local.logoClaro)
export { precioProducto }

// Verificación de contrato: si un export no coincide con `ApiTienda`, no compila.
void ({
    useSitio,
    useLocal,
    useCarta,
    useContenido,
    useHorarios,
    useCarrito,
    useCampana,
    usePuntos,
    useLinks,
    useNavegacionCarta,
    formatPesos,
    formatHora,
    turnosDelDia,
    textoEstado,
    DIAS,
    SEMANA,
    fotosDeProducto,
    logoPara,
    precioProducto: (p: { precio: number | string; descuento?: number | null }) => precioProducto(p),
    ordenVisual,
    PiruCanjes,
} satisfies ApiTienda)

// Sólo para el boot del runtime.
export { PiruSiteRoot, PiruErrorBoundary, PiruFooter, PiruProductSheet } from './componentes'
export { crearTienda } from './store'
export type { ConfigSitio } from './store'
export type { DatosPreview } from './componentes'
export type * from './tipos'
