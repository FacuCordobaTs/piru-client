import { storeSlugFromHostname } from '@/lib/store-domain'
import { getStoreSite } from './registry'

/**
 * Contexto del subdominio actual, resuelto una sola vez al cargar la app.
 *
 * Cualquier `<tienda>.piru.app` es una tienda: si está registrada usa su diseño propio y, si no,
 * muestra la plantilla estándar de esa tienda. `usernameSitio` es el username que hay que usar en la
 * API cuando la URL no trae `/:username` (por ejemplo, la portada `/` del subdominio).
 */
export const slugSitio = storeSlugFromHostname(window.location.hostname)
export const enSitioDeTienda = slugSitio !== null
export const sitioActual = getStoreSite(slugSitio)
export const usernameSitio = sitioActual?.username ?? slugSitio

/** La tienda vive en la raíz del subdominio y bajo `/:username` en `my.piru.app`. */
export function rutaTienda(username: string | null | undefined, path = ''): string {
    const extra = path.replace(/^\/+/, '')
    if (enSitioDeTienda) return extra ? `/${extra}` : '/'
    const base = `/${username ?? ''}`
    return extra ? `${base}/${extra}` : base
}
