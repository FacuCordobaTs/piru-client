import { guardarTemaRestaurante } from '@/components/RestauranteTheme'
import { checkIsOpen } from '@/features/tienda/horarios'
import { mesaApi } from '@/lib/api'
import { guardarTiendaCache, leerTiendaCache, useTienda, type RestauranteTienda } from '@/lib/tienda'
import { configurarGtm, configurarMetaPixel, registrarEventoTrackingUnaVez } from '@/lib/tracking'
import type { MesaState } from '@/store/mesaStore'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import type { GrupoState } from './useGrupoState'
type SalaRespuesta = {
    success?: boolean
    data?: Pick<MesaState, 'restaurante' | 'productos'> & {
        mesa: NonNullable<MesaState['mesa']>
        pedido: NonNullable<MesaState['pedido']>
    }
}

type Contexto = Pick<
    GrupoState,
    | 'isHydrated'
    | 'esSala'
    | 'urlQrToken'
    | 'qrToken'
    | 'setQrToken'
    | 'setMesa'
    | 'setProductos'
    | 'setPedidoId'
    | 'setPedido'
    | 'setRestaurante'
    | 'setClientes'
    | 'setCheckoutDeliveryData'
    | 'setCheckoutEditSemaphore'
    | 'sessionEnded'
    | 'clienteTelefono'
    | 'clienteNombre'
    | 'navigate'
    | 'wsState'
    | 'restaurante'
    | 'token'
    | 'setTiendaRemota'
    | 'setPermitirProgramados'
    | 'setHorarios'
    | 'setEstadoAbierto'
    | 'horarios'
    | 'estadoAbierto'
    | 'tiendaRemota'
    | 'clientes'
>

export function useGrupoDatos({
    isHydrated,
    esSala,
    urlQrToken,
    qrToken,
    setQrToken,
    setMesa,
    setProductos,
    setPedidoId,
    setPedido,
    setRestaurante,
    setClientes,
    setCheckoutDeliveryData,
    setCheckoutEditSemaphore,
    sessionEnded,
    clienteTelefono,
    clienteNombre,
    navigate,
    wsState,
    restaurante,
    token,
    setTiendaRemota,
    setPermitirProgramados,
    setHorarios,
    setEstadoAbierto,
    horarios,
    estadoAbierto,
    tiendaRemota,
    clientes,
}: Contexto) {
    useEffect(() => {
        if (!isHydrated || !esSala || !urlQrToken) return
        if (urlQrToken === qrToken) return
        const syncSala = async () => {
            try {
                const response = (await mesaApi.join(urlQrToken)) as SalaRespuesta
                if (response.success && response.data) {
                    setQrToken(urlQrToken)
                    setMesa(response.data.mesa)
                    setProductos(response.data.productos || [])
                    setPedidoId(response.data.pedido.id)
                    setPedido(response.data.pedido)
                    setRestaurante(response.data.restaurante || null)
                    setClientes([])
                    setCheckoutDeliveryData(null)
                    setCheckoutEditSemaphore(null)
                    // Guardar tema para sala (colores del restaurante)
                    const rest = response.data.restaurante
                    if (rest) guardarTemaRestaurante(`theme_sala_${urlQrToken}`, rest)
                }
            } catch {
                toast.error('No se pudo cargar la sala')
            }
        }
        syncSala()
    }, [
        isHydrated,
        esSala,
        urlQrToken,
        qrToken,
        setQrToken,
        setMesa,
        setProductos,
        setPedidoId,
        setPedido,
        setRestaurante,
        setClientes,
        setCheckoutDeliveryData,
        setCheckoutEditSemaphore,
    ])

    useEffect(() => {
        if (!isHydrated) return
        if (sessionEnded) return

        const digitsCliente = (clienteTelefono || localStorage.getItem('cliente_telefono') || '').replace(
            /\D/g,
            ''
        )
        if (!clienteNombre || digitsCliente.length < 8 || (!qrToken && !urlQrToken)) {
            toast.error('Debes ingresar tu nombre y teléfono primero')
            const isSala = window.location.pathname.includes('/sala/')
            const token = urlQrToken || qrToken || 'invalid'
            navigate(isSala ? `/sala/${token}/nombre` : `/mesa/${token}`)
            return
        }

        if (wsState?.estado) {
            if (wsState?.estado === 'preparing') {
                // Carritos: ir a pagar primero
                if (restaurante?.esCarrito) {
                    navigate('/pedido-cerrado')
                } else {
                    navigate('/pedido-confirmado')
                }
            } else if (wsState?.estado === 'closed') {
                navigate('/pedido-cerrado')
            }
        }
    }, [
        clienteNombre,
        clienteTelefono,
        qrToken,
        wsState?.estado,
        navigate,
        isHydrated,
        sessionEnded,
        restaurante?.esCarrito,
        urlQrToken,
    ])

    useEffect(() => {
        if (!esSala || !restaurante?.id || !restaurante?.username || !token) return
        registrarEventoTrackingUnaVez(
            restaurante?.id,
            restaurante?.username,
            'session_start',
            `sala-${token}`
        )
    }, [esSala, restaurante?.id, restaurante?.username, token])

    useEffect(() => {
        if (!restaurante?.colorPrimario || !token) return
        const key = esSala ? `theme_sala_${token}` : `theme_mesa_${token}`
        guardarTemaRestaurante(key, restaurante)
        // También guardar con username para que MenuDelivery y Menu compartan tema
        if (restaurante?.username) {
            guardarTemaRestaurante(`theme_${restaurante?.username}`, restaurante)
        }
    }, [
        restaurante?.colorPrimario,
        restaurante?.colorSecundario,
        restaurante?.usarColorUnico,
        restaurante?.username,
        token,
        esSala,
        restaurante,
    ])

    useEffect(() => {
        if (!token || !isHydrated) return
        const hasTheme =
            (restaurante?.colorPrimario && (restaurante?.usarColorUnico || restaurante?.colorSecundario)) ||
            sessionStorage.getItem(esSala ? `theme_sala_${token}` : `theme_mesa_${token}`) ||
            (restaurante?.username && sessionStorage.getItem(`theme_${restaurante?.username}`))
        if (hasTheme) return

        const fetchTheme = async () => {
            try {
                const response = (await mesaApi.join(token)) as SalaRespuesta
                if (response.success && response.data?.restaurante) {
                    const rest = response.data.restaurante
                    setRestaurante(rest)
                    const key = esSala ? `theme_sala_${token}` : `theme_mesa_${token}`
                    guardarTemaRestaurante(key, rest)
                    if (rest.username) guardarTemaRestaurante(`theme_${rest.username}`, rest)
                }
            } catch {
                /* ignore */
            }
        }
        fetchTheme()
    }, [
        token,
        isHydrated,
        esSala,
        restaurante?.colorPrimario,
        restaurante?.usarColorUnico,
        restaurante?.colorSecundario,
        restaurante?.username,
        setRestaurante,
    ])

    useEffect(() => {
        if (!restaurante?.username) return
        const username = restaurante?.username
        const fetchEstado = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const res = await fetch(`${url}/public/restaurante/${username}`)
                if (!res.ok) return
                const data = await res.json()
                if (data.success && data.data?.restaurante) {
                    setTiendaRemota({ ...data.data.restaurante, username })
                    guardarTiendaCache(username, data.data.restaurante)
                }
                if (esSala && data.success && data.data) {
                    configurarGtm(data.data.restaurante?.gtmContainerId)
                    configurarMetaPixel(data.data.restaurante?.metaPixelId)
                    setPermitirProgramados(!!data.data.restaurante?.permitirPedidosProgramados)
                    if (Array.isArray(data.data.horarios)) {
                        setHorarios(data.data.horarios)
                        setEstadoAbierto(checkIsOpen(data.data.horarios))
                    }
                }
            } catch {
                /* ignore */
            }
        }
        fetchEstado()
    }, [
        esSala,
        restaurante?.username,
        setEstadoAbierto,
        setHorarios,
        setPermitirProgramados,
        setTiendaRemota,
    ])

    useEffect(() => {
        if (horarios.length === 0) return
        const interval = setInterval(() => setEstadoAbierto(checkIsOpen(horarios)), 60_000)
        return () => clearInterval(interval)
    }, [horarios, setEstadoAbierto])

    const localCerrado = esSala && !estadoAbierto.abierto

    const identidad = useMemo<RestauranteTienda | null>(() => {
        const base =
            tiendaRemota?.username === restaurante?.username
                ? tiendaRemota
                : leerTiendaCache(restaurante?.username)
        if (!base && !restaurante) return null
        return {
            ...base,
            nombre: restaurante?.nombre ?? base?.nombre,
            imagenUrl: restaurante?.imagenUrl ?? base?.imagenUrl,
            imagenLightUrl: restaurante?.imagenLightUrl ?? base?.imagenLightUrl,
            direccion: restaurante?.direccion ?? base?.direccion,
            direccionTexto: restaurante?.direccionTexto ?? base?.direccionTexto,
            colorPrimario: restaurante?.colorPrimario ?? base?.colorPrimario,
            colorSecundario: restaurante?.colorSecundario ?? base?.colorSecundario,
            usarColorUnico: restaurante?.usarColorUnico ?? base?.usarColorUnico,
            tienda: restaurante?.tienda ?? base?.tienda,
        }
    }, [tiendaRemota, restaurante])

    const { tienda, paleta, fuentes } = useTienda(identidad)

    const nombreLocal = restaurante?.nombre || identidad?.nombre || 'Tienda'

    const otrosClientes = clientes.filter((c) => c.nombre !== clienteNombre)
    return { localCerrado, identidad, paleta, fuentes, nombreLocal, otrosClientes, tienda }
}
