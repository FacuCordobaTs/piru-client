/**
 * Hooks públicos de `@piru/tienda`. Leen el store del runtime (`PiruSiteRoot`) y le agregan a los
 * datos puros las acciones (`producto.abrir()`, `carrito.add()`, `carrito.checkout()`).
 */
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import { useNavegacionCarta as useNavegacionBase } from '@/features/tienda/compartido/useNavegacionCarta'
import { obtenerContextoTracking, obtenerSesionTracking, obtenerVisitorId } from '@/lib/tracking'
import {
    claveLinea,
    formatoPesos,
    horariosDe,
    lineasCarrito,
    motivoBloqueo,
    sinClave,
    validarItem,
    type ProductoBase,
} from './datos'
import type { EstadoRuntime, Tienda } from './store'
import type {
    CarritoApi,
    Carta,
    Contenido,
    EstadoCampana,
    EstadoLocal,
    Horarios,
    ItemCarrito,
    Links,
    NavegacionCarta,
    Producto,
    Puntos,
    ResultadoAgregar,
    Sitio,
} from './tipos'

export const ContextoTienda = createContext<Tienda | null>(null)

export function useTiendaInterna(): Tienda {
    const tienda = useContext(ContextoTienda)
    if (!tienda) throw new Error('Los hooks de @piru/tienda sólo funcionan dentro de la página del sitio')
    return tienda
}

function useEstado<T>(selector: (estado: EstadoRuntime) => T): T {
    const tienda = useTiendaInterna()
    return useSyncExternalStore(tienda.subscribe, () => selector(tienda.get()))
}

/** Agrega las acciones a un producto. Una sola instancia por producto mientras no cambien los datos. */
function conAcciones(tienda: Tienda, base: ProductoBase): Producto {
    return {
        ...base,
        abrir: () => tienda.set({ hoja: base.id }),
        agregar: (cantidad = 1) => agregarItem(tienda, { productoId: base.id, cantidad }),
    }
}

export function agregarItem(tienda: Tienda, item: ItemCarrito): ResultadoAgregar {
    const datos = tienda.get().datos
    const producto = datos?.productos.find((p) => p.id === item.productoId) ?? datos?.canjes.find((p) => p.id === item.productoId)
    const validacion = validarItem(producto, item)
    if (!validacion.ok) return validacion
    const cantidad = Math.max(1, Math.min(99, Math.floor(item.cantidad ?? 1)))
    tienda.agregarLinea(validacion.linea, cantidad)
    return { ok: true }
}

const productosCache = new WeakMap<object, { secciones: Carta['secciones']; productos: Producto[]; canjes: Producto[]; destacado: Producto | null }>()

export function useSitio(): Sitio {
    return useEstado((e) => e.sitio)
}

export function useLocal(): EstadoLocal {
    const estado = useEstado((e) => e.estado)
    const datos = useEstado((e) => e.datos)
    return useMemo(
        () =>
            estado === 'listo' && datos
                ? { estado: 'listo', local: datos.local }
                : { estado: estado === 'error' ? 'error' : 'cargando', local: null },
        [estado, datos]
    ) as EstadoLocal
}

export function useCarta(): Carta {
    const tienda = useTiendaInterna()
    const datos = useEstado((e) => e.datos)
    return useMemo(() => {
        if (!datos) return { secciones: [], productos: [], canjes: [], destacado: null }
        const enCache = productosCache.get(datos)
        if (enCache) return enCache
        const porId = new Map<number, Producto>()
        const de = (p: ProductoBase) => {
            let producto = porId.get(p.id)
            if (!producto) {
                producto = conAcciones(tienda, p)
                porId.set(p.id, producto)
            }
            return producto
        }
        const carta = {
            secciones: datos.secciones.map((s) => ({ id: s.id, nombre: s.nombre, productos: s.productos.map(de) })),
            productos: datos.productos.map(de),
            canjes: datos.canjes.map(de),
            destacado: datos.destacado ? de(datos.destacado) : null,
        }
        productosCache.set(datos, carta)
        return carta
    }, [datos, tienda])
}

const CONTENIDO_VACIO: Contenido = {
    plantilla: 'artesanal',
    frase: null,
    bajada: null,
    portadaUrl: null,
    galeria: [],
    cinta: [],
    historia: null,
    instagram: null,
    whatsapp: null,
    colores: { fondo: null, texto: null, acento: null, superficie: null },
    fuentes: { titulos: null, cuerpo: null },
}

export function useContenido(): Contenido {
    return useEstado((e) => e.datos?.contenido ?? CONTENIDO_VACIO)
}

const HORARIOS_VACIOS: Horarios = {
    abierto: false,
    proximaApertura: null,
    texto: '',
    turnos: [],
    franjas: [],
    permiteProgramados: false,
    soloProgramados: false,
}

export function useHorarios(): Horarios {
    const local = useEstado((e) => e.datos?.local ?? null)
    return useMemo(() => (local ? horariosDe(local) : HORARIOS_VACIOS), [local])
}

export function useCarrito(): CarritoApi {
    const tienda = useTiendaInterna()
    const lineasGuardadas = useEstado((e) => e.lineas)
    const datos = useEstado((e) => e.datos)
    const submitting = useEstado((e) => e.submitting)
    const error = useEstado((e) => e.error)
    return useMemo(() => {
        const productos = datos ? [...datos.productos, ...datos.canjes] : []
        // Sin datos todavía, las líneas guardadas no se dan por inválidas.
        const lineas = datos ? lineasCarrito(lineasGuardadas, productos) : []
        const total = lineas.reduce((suma, l) => suma + l.subtotal, 0)
        const blockReason = datos ? motivoBloqueo(lineas, datos.local) : 'empty'
        return {
            add: (item) => agregarItem(tienda, item),
            remove: (productoId, key) =>
                tienda.set({
                    lineas: tienda.get().lineas.filter((l) => (key ? l.key !== key : l.productoId !== productoId)),
                }),
            set: (key, cantidad) => {
                const n = Math.floor(cantidad)
                tienda.set({
                    lineas:
                        n <= 0
                            ? tienda.get().lineas.filter((l) => l.key !== key)
                            : tienda.get().lineas.map((l) => (l.key === key ? { ...l, cantidad: Math.min(99, n) } : l)),
                })
            },
            quantity: (productoId) =>
                tienda
                    .get()
                    .lineas.filter((l) => l.productoId === productoId)
                    .reduce((suma, l) => suma + l.cantidad, 0),
            clear: () => tienda.set({ lineas: [] }),
            lines: lineas,
            count: lineas.reduce((suma, l) => suma + l.cantidad, 0),
            total: total.toFixed(2),
            totalFormatted: formatoPesos(total),
            canCheckout: blockReason === null && !submitting,
            blockReason,
            submitting,
            error,
            checkout: () => irAlCheckout(tienda),
        }
    }, [tienda, lineasGuardadas, datos, submitting, error])
}

/** `carrito.checkout()`: crea el carrito en el servidor y navega al checkout de Piru (otro origen). */
export async function irAlCheckout(tienda: Tienda): Promise<void> {
    const estado = tienda.get()
    if (!estado.datos || estado.submitting) return
    const lineas = lineasCarrito(estado.lineas, [...estado.datos.productos, ...estado.datos.canjes])
    if (motivoBloqueo(lineas, estado.datos.local) !== null) return
    if (estado.sitio.isPreview) {
        tienda.avisar('En la vista previa no se compra: el checkout se abre en el sitio publicado.')
        return
    }
    const { config } = estado
    tienda.set({ submitting: true, error: null })
    try {
        const tracking = obtenerContextoTracking(config.username)
        const contexto = {
            visitorId: obtenerVisitorId(),
            sesionUuid: obtenerSesionTracking(config.username).sesionUuid,
            ...(tracking?.campaniaSlug ? { campaniaSlug: tracking.campaniaSlug } : {}),
            ...(tracking?.campanaId ? { campanaId: String(tracking.campanaId) } : {}),
            ...(tracking?.codigoPromocional ? { codigoPromocional: tracking.codigoPromocional } : {}),
            ...(tracking?.recetaToken ? { recetaToken: tracking.recetaToken } : {}),
        }
        const res = await fetch(`${config.api}/public/carritos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restauranteId: config.restauranteId,
                items: estado.lineas.map(sinClave),
                contexto,
                returnUrl: `${window.location.origin}/`,
            }),
        })
        const cuerpo = (await res.json().catch(() => null)) as { id?: string; checkoutUrl?: string; error?: string } | null
        if (!res.ok || !cuerpo?.id) throw new Error(cuerpo?.error || 'No pudimos iniciar el pedido. Probá de nuevo.')
        window.location.assign(
            cuerpo.checkoutUrl ?? `${config.tiendaEstandar}/checkout?carrito=${encodeURIComponent(cuerpo.id)}`
        )
    } catch (e) {
        tienda.set({ submitting: false, error: e instanceof Error ? e.message : 'No pudimos iniciar el pedido.' })
    }
}

export function useCampana(): EstadoCampana | null {
    const campana = useEstado((e) => e.campana)
    const carta = useCarta()
    return useMemo(
        () =>
            campana
                ? { campana, producto: carta.productos.find((p) => p.id === campana.productoId) ?? null }
                : null,
        [campana, carta]
    )
}

export function usePuntos(): Puntos {
    const local = useEstado((e) => e.datos?.local ?? null)
    return useMemo(
        () => ({ habilitado: !!local?.sistemaPuntos, reglas: local?.configuracionPuntos ?? null }),
        [local]
    )
}

export function linksDe(estado: EstadoRuntime): Links {
    const local = estado.datos?.local
    return {
        tiendaEstandar: estado.config.tiendaEstandar,
        whatsapp: local?.whatsapp ? `https://wa.me/${local.whatsapp.replace(/\D/g, '')}` : null,
        instagram: local?.instagram ? `https://instagram.com/${encodeURIComponent(local.instagram)}` : null,
    }
}

export function useLinks(): Links {
    const tienda = useTiendaInterna()
    const datos = useEstado((e) => e.datos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => linksDe(tienda.get()), [tienda, datos])
}

export function useNavegacionCarta(cantidad: number): NavegacionCarta {
    return useNavegacionBase(cantidad)
}

export { claveLinea }
