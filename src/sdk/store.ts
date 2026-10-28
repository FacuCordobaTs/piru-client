/**
 * Estado del runtime de un sitio: datos de la tienda, carrito, hoja de opciones abierta, campaña y
 * avisos. Un store mínimo (sin dependencias) que los hooks leen con `useSyncExternalStore`.
 */
import { claveLinea, leerLineasGuardadas, sinClave, type DatosTienda, type LineaGuardada } from './datos'
import type { Campana, EstadoCarga, Sitio } from './tipos'

export type ConfigSitio = {
    restauranteId: number
    username: string
    slug: string
    /** `https://api.piru.app/api` */
    api: string
    /** `https://my.piru.app/<username>` */
    tiendaEstandar: string
    preview?: boolean
}

export type EstadoRuntime = {
    sitio: Sitio
    config: ConfigSitio
    estado: EstadoCarga
    datos: DatosTienda | null
    lineas: LineaGuardada[]
    submitting: boolean
    error: string | null
    /** Producto con la hoja de opciones abierta. */
    hoja: number | null
    campana: Campana | null
    aviso: { texto: string; tono: 'info' | 'ok' | 'error' } | null
}

export type Tienda = ReturnType<typeof crearTienda>

const claveCarrito = (username: string) => `piruCarrito:${username}`

function leerCarrito(username: string, preview: boolean): LineaGuardada[] {
    if (preview) return []
    try {
        return leerLineasGuardadas(JSON.parse(sessionStorage.getItem(claveCarrito(username)) ?? '[]'))
    } catch {
        return []
    }
}

export function crearTienda(config: ConfigSitio) {
    const preview = config.preview === true
    let estado: EstadoRuntime = {
        sitio: {
            slug: config.slug,
            username: config.username,
            restauranteId: config.restauranteId,
            isPreview: preview,
            escenario: null,
        },
        config,
        estado: 'cargando',
        datos: null,
        lineas: leerCarrito(config.username, preview),
        submitting: false,
        error: null,
        hoja: null,
        campana: null,
        aviso: null,
    }
    const oyentes = new Set<() => void>()
    let timerAviso: ReturnType<typeof setTimeout> | null = null

    const set = (cambio: Partial<EstadoRuntime>) => {
        estado = { ...estado, ...cambio }
        if ('lineas' in cambio && !preview) {
            try {
                sessionStorage.setItem(
                    claveCarrito(config.username),
                    JSON.stringify(estado.lineas.map(sinClave))
                )
            } catch {
                /* storage bloqueado: el carrito vive en memoria */
            }
        }
        for (const oyente of oyentes) oyente()
    }

    return {
        get: () => estado,
        subscribe(oyente: () => void) {
            oyentes.add(oyente)
            return () => {
                oyentes.delete(oyente)
            }
        },
        set,
        agregarLinea(linea: Omit<LineaGuardada, 'key' | 'cantidad'>, cantidad: number) {
            const key = claveLinea(linea)
            const existente = estado.lineas.find((l) => l.key === key)
            set({
                lineas: existente
                    ? estado.lineas.map((l) => (l.key === key ? { ...l, cantidad: Math.min(99, l.cantidad + cantidad) } : l))
                    : [...estado.lineas, { ...linea, key, cantidad: Math.min(99, cantidad) }],
                error: null,
            })
        },
        avisar(texto: string, tono: 'info' | 'ok' | 'error' = 'info') {
            if (timerAviso) clearTimeout(timerAviso)
            set({ aviso: { texto, tono } })
            timerAviso = setTimeout(() => set({ aviso: null }), 3500)
        },
    }
}
