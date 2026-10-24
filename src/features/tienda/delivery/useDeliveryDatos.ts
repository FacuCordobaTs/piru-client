import { sincronizarDireccionesCliente } from '@/components/CheckoutDeliveryGrupal'
import { guardarTemaRestaurante } from '@/components/RestauranteTheme'
import { DESCUENTO_DEMO, restauranteDemo } from '@/lib/demo'
import { guardarTiendaCache } from '@/lib/tienda'
import { configurarGtm, configurarMetaPixel, registrarEventoTrackingUnaVez } from '@/lib/tracking'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { ProductoTienda, TiendaPublicaRespuesta } from '../datos'
import { checkIsOpen } from '../horarios'
import { avisoDescuento } from './modelo'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'telefonoCliente'
    | 'demo'
    | 'restaurante'
    | 'setLoadingPuntos'
    | 'setPuntosCliente'
    | 'username'
    | 'campana'
    | 'setRestaurante'
    | 'setSucursales'
    | 'setProductos'
    | 'sessionStartRef'
    | 'setHorarios'
    | 'setEstadoAbierto'
    | 'setBannerGrowth'
    | 'setLoading'
    | 'horarios'
>

export function useDeliveryDatos({
    telefonoCliente,
    demo,
    restaurante,
    setLoadingPuntos,
    setPuntosCliente,
    username,
    campana,
    setRestaurante,
    setSucursales,
    setProductos,
    sessionStartRef,
    setHorarios,
    setEstadoAbierto,
    setBannerGrowth,
    setLoading,
    horarios,
}: Contexto) {
    useEffect(() => {
        const telefono = (telefonoCliente || '').replace(/\D/g, '')
        if (demo || !restaurante?.id || telefono.length < 8) return
        // Deja listo el historial local antes de que el cliente abra el checkout.
        void sincronizarDireccionesCliente(restaurante?.id, telefono).catch(() => {})
    }, [demo, restaurante?.id, telefonoCliente])

    const fetchPuntos = useCallback(
        async (telefono: string, restauranteId: number) => {
            if (!telefono || !restauranteId) return
            setLoadingPuntos(true)
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const res = await fetch(
                    `${url}/public/restaurante/${restauranteId}/cliente/${encodeURIComponent(telefono)}`
                )
                if (res.ok) {
                    const data = (await res.json()) as { success: boolean; data: { puntos: number } }
                    if (data.success) {
                        setPuntosCliente(data.data.puntos)
                    } else {
                        setPuntosCliente(0) // No client yet
                    }
                } else {
                    setPuntosCliente(0)
                }
            } catch (error) {
                console.error('Error fetching puntos:', error)
                setPuntosCliente(0)
            } finally {
                setLoadingPuntos(false)
            }
        },
        [setLoadingPuntos, setPuntosCliente]
    )

    useEffect(() => {
        const controller = new AbortController()
        const fetchRestaurante = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const res = await fetch(`${url}/public/restaurante/${username}`, {
                    signal: controller.signal,
                })
                if (!res.ok) {
                    throw new Error('Restaurante no encontrado')
                }
                const data = (await res.json()) as TiendaPublicaRespuesta
                if (controller.signal.aborted) return
                if (data.success) {
                    const promo = campana?.productoId != null ? campana : null
                    const descCampanaTienda =
                        !promo &&
                        ((campana?.descuentoPorcentaje && campana.descuentoPorcentaje > 0) ||
                            campana?.tipo === 'reactivacion' ||
                            campana?.slug === 'reactivacion')
                            ? campana?.descuentoPorcentaje && campana.descuentoPorcentaje > 0
                                ? campana.descuentoPorcentaje
                                : 10
                            : 0
                    // En la demo, Martina vuelve con el 10% del mensaje de recompra: la tienda queda
                    // como al entrar por ese link (el banner de abajo y el descuento en la carta).
                    const descuentoDemo = demo ? DESCUENTO_DEMO : 0

                    setRestaurante(demo ? restauranteDemo(data.data.restaurante) : data.data.restaurante)
                    setSucursales(Array.isArray(data.data.sucursales) ? data.data.sucursales : [])
                    setProductos(
                        data.data.productos.map((producto: ProductoTienda) => {
                            const ahora = Date.now()
                            const inicioProducto = producto.descuentoFechaInicio
                                ? new Date(producto.descuentoFechaInicio).getTime()
                                : null
                            const finProducto = producto.descuentoFechaFin
                                ? new Date(producto.descuentoFechaFin).getTime()
                                : null
                            const descuentoProductoActivo =
                                (inicioProducto == null || inicioProducto <= ahora) &&
                                (finProducto == null || finProducto >= ahora)
                                    ? Number(producto.descuento || 0)
                                    : 0

                            if (promo && producto.id === promo.productoId) {
                                const usaOfertaCampana = promo.descuentoPorcentaje >= descuentoProductoActivo
                                return {
                                    ...producto,
                                    descuento: Math.max(
                                        descuentoProductoActivo,
                                        promo.descuentoPorcentaje || 0
                                    ),
                                    descuentoFechaInicio: usaOfertaCampana
                                        ? promo.fechaInicio
                                        : producto.descuentoFechaInicio,
                                    descuentoFechaFin: usaOfertaCampana
                                        ? promo.fechaFin
                                        : producto.descuentoFechaFin,
                                }
                            } else if (!promo && descCampanaTienda > 0) {
                                const usaOfertaCampana = descCampanaTienda >= descuentoProductoActivo
                                return {
                                    ...producto,
                                    descuento: Math.max(descuentoProductoActivo, descCampanaTienda),
                                    descuentoFechaInicio: usaOfertaCampana
                                        ? campana?.fechaInicio
                                        : producto.descuentoFechaInicio,
                                    descuentoFechaFin: usaOfertaCampana
                                        ? campana?.fechaFin
                                        : producto.descuentoFechaFin,
                                }
                            } else if (descuentoDemo > descuentoProductoActivo) {
                                return { ...producto, descuento: descuentoDemo, descuentoFechaFin: null }
                            }
                            return producto
                        })
                    )
                    if (!demo) {
                        configurarGtm(data.data.restaurante?.gtmContainerId)
                        configurarMetaPixel(data.data.restaurante?.metaPixelId)
                        const sessionKey = `${data.data.restaurante?.id}:${username}`
                        if (sessionStartRef.current !== sessionKey) {
                            sessionStartRef.current = sessionKey
                            // El resolver de /c/:slug ya creó/actualizó la sesión y
                            // sumó el contador compacto; no insertamos un evento de
                            // apertura adicional por cada visita de campaña.
                            if (!campana)
                                registrarEventoTrackingUnaVez(
                                    data.data.restaurante?.id,
                                    username!,
                                    'session_start',
                                    'storefront'
                                )
                        }
                    }
                    // La demo siempre está abierta: el local la prueba cuando la recibe.
                    if (data.data.horarios && !demo) {
                        setHorarios(data.data.horarios)
                        setEstadoAbierto(checkIsOpen(data.data.horarios))
                    }
                    guardarTemaRestaurante(`theme_${username}`, data.data.restaurante)
                    guardarTiendaCache(username, data.data.restaurante)
                    if (demo) setBannerGrowth(avisoDescuento(DESCUENTO_DEMO))
                } else {
                    toast.error(data.message)
                }
            } catch {
                if (!controller.signal.aborted) toast.error('Error al cargar restaurante')
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }
        if (username) void fetchRestaurante()
        return () => controller.abort()
    }, [
        username,
        campana,
        demo,
        setRestaurante,
        setSucursales,
        setProductos,
        setBannerGrowth,
        sessionStartRef,
        setHorarios,
        setEstadoAbierto,
        setLoading,
    ])

    useEffect(() => {
        if (horarios.length === 0) return
        const interval = setInterval(() => {
            setEstadoAbierto(checkIsOpen(horarios))
        }, 60_000)
        return () => clearInterval(interval)
    }, [horarios, setEstadoAbierto])
    useEffect(() => {
        if (!demo && restaurante?.sistemaPuntos && restaurante.id && telefonoCliente) {
            void fetchPuntos(telefonoCliente, restaurante.id)
        }
    }, [demo, restaurante?.id, restaurante?.sistemaPuntos, telefonoCliente, fetchPuntos])
    return { fetchPuntos }
}
