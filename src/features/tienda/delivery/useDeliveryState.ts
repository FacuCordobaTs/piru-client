import { CLIENTA_DEMO, type PedidoDemoInfo } from '@/lib/demo'
import { leerTiendaCache, useTienda } from '@/lib/tienda'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import type { CheckoutIndividual, ItemCarritoTienda, ProductoTienda, RestaurantePublico } from '../datos'
import { type AvisoDescuento, type CampanaPublica, type HorarioTurno } from './modelo'

export function useDeliveryState(campana: CampanaPublica | null) {
    const navigate = useNavigate()

    const { username } = useParams()

    const [searchParams, setSearchParams] = useSearchParams()

    const demo = searchParams.has('demo')

    const [pedidoDemo, setPedidoDemo] = useState<PedidoDemoInfo | null>(null)

    const repAplicadoRef = useRef(false)

    const productoAplicadoRef = useRef(false)

    const tkAplicadoRef = useRef<string | null>(null)

    const [bannerGrowth, setBannerGrowth] = useState<AvisoDescuento | null>(null)

    const [descuentoGrowthCodigo, setDescuentoGrowthCodigo] = useState<string | null>(null)

    const [carritoAbierto, setCarritoAbierto] = useState(false)

    const [selectedProduct, setSelectedProduct] = useState<ProductoTienda | null>(null)

    const [drawerOpen, setDrawerOpen] = useState(false)

    const [cartAnimation, setCartAnimation] = useState(false)

    const [scrollDir, setScrollDir] = useState<'up' | 'down' | null>(null)

    const scrollTimerRef = useRef<number | null>(null)

    const canjeRef = useRef<HTMLElement | null>(null)

    const cartaRef = useRef<HTMLDivElement | null>(null)

    const [restaurante, setRestaurante] = useState<RestaurantePublico | null>(null)

    const [productos, setProductos] = useState<ProductoTienda[]>([])

    const [sucursales, setSucursales] = useState<
        { id: number; direccionLat?: string | null; direccionLng?: string | null }[]
    >([])

    const [loading, setLoading] = useState(true)

    const [semillaDestacado] = useState(() => Math.random())

    const restauranteCache = useMemo(() => leerTiendaCache(username), [username])

    const { tienda, paleta, fuentes } = useTienda(restaurante ?? restauranteCache)

    const [horarios, setHorarios] = useState<HorarioTurno[]>([])

    const [estadoAbierto, setEstadoAbierto] = useState<{ abierto: boolean; proximaApertura: string | null }>({
        abierto: true,
        proximaApertura: null,
    })

    const [modalSalaOpen, setModalSalaOpen] = useState(false)

    const [nombreSala, setNombreSala] = useState('')

    const [telefonoSala, setTelefonoSala] = useState(() => {
        return localStorage.getItem('cliente_telefono') || localStorage.getItem('piru_cliente_telefono') || ''
    })

    const [creandoSala, setCreandoSala] = useState(false)

    const claveCarrito = demo ? `deliveryCart_${username}:demo` : `deliveryCart_${username}`

    const [cartItems, setCartItems] = useState<ItemCarritoTienda[]>(() => {
        const saved = localStorage.getItem(claveCarrito)
        if (saved) {
            try {
                const items: unknown = JSON.parse(saved).items
                return Array.isArray(items) ? items : []
            } catch {
                return []
            }
        }
        return []
    })

    const [telefonoCliente, setTelefonoCliente] = useState(localStorage.getItem('cliente_telefono') || '')

    const [puntosCliente, setPuntosCliente] = useState<number | null>(demo ? CLIENTA_DEMO.puntos : null)

    const [loadingPuntos, setLoadingPuntos] = useState(false)

    const [modalPuntosOpen, setModalPuntosOpen] = useState(false)

    const [canjeEnvioGratis, setCanjeEnvioGratis] = useState(false)

    const [canjeDescuento, setCanjeDescuento] = useState(false)

    const [mostrarCheckoutEnCarrito, setMostrarCheckoutEnCarrito] = useState(false)

    const [expandido, setExpandido] = useState(false)

    const [checkoutDeliveryData, setCheckoutDeliveryData] = useState<CheckoutIndividual | null>(null)

    const [editSemaphoreLocal, setEditSemaphoreLocal] = useState<{
        clienteId: string
        clienteNombre: string
    } | null>(null)

    const [tituloCheckout, setTituloCheckout] = useState('¿Cómo lo querés?')

    const [submittingOrder, setSubmittingOrder] = useState(false)

    const checkoutDataRef = useRef<CheckoutIndividual | null>(null)

    const metodoPagoHabitualRef = useRef<string | null>(null)

    const isSubmittingRef = useRef(false)

    const orderAttemptIdRef = useRef<string | null>(null)

    const sessionStartRef = useRef<string | null>(null)

    const recomendacionIntentadaRef = useRef<string | null>(null)

    const [esPedidoHabitual, setEsPedidoHabitual] = useState(false)

    useEffect(() => {
        let lastY = window.scrollY
        const handleScroll = () => {
            const y = window.scrollY
            const delta = y - lastY
            lastY = y
            if (Math.abs(delta) < 2) return
            setScrollDir(delta > 0 ? 'down' : 'up')
            if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current)
            scrollTimerRef.current = window.setTimeout(() => setScrollDir(null), 150)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current)
        }
    }, [])

    useEffect(() => {
        if (restaurante) {
            localStorage.setItem(
                claveCarrito,
                JSON.stringify({
                    items: cartItems,
                    restauranteId: restaurante?.id,
                    deliveryFee: restaurante?.deliveryFee,
                })
            )
        }
    }, [cartItems, restaurante, claveCarrito])
    return {
        campana,
        navigate,
        username,
        searchParams,
        setSearchParams,
        demo,
        pedidoDemo,
        setPedidoDemo,
        repAplicadoRef,
        productoAplicadoRef,
        tkAplicadoRef,
        bannerGrowth,
        setBannerGrowth,
        descuentoGrowthCodigo,
        setDescuentoGrowthCodigo,
        carritoAbierto,
        setCarritoAbierto,
        selectedProduct,
        setSelectedProduct,
        drawerOpen,
        setDrawerOpen,
        cartAnimation,
        setCartAnimation,
        scrollDir,
        setScrollDir,
        scrollTimerRef,
        canjeRef,
        cartaRef,
        restaurante,
        setRestaurante,
        productos,
        setProductos,
        sucursales,
        setSucursales,
        loading,
        setLoading,
        semillaDestacado,
        restauranteCache,
        tienda,
        paleta,
        fuentes,
        horarios,
        setHorarios,
        estadoAbierto,
        setEstadoAbierto,
        modalSalaOpen,
        setModalSalaOpen,
        nombreSala,
        setNombreSala,
        telefonoSala,
        setTelefonoSala,
        creandoSala,
        setCreandoSala,
        claveCarrito,
        cartItems,
        setCartItems,
        telefonoCliente,
        setTelefonoCliente,
        puntosCliente,
        setPuntosCliente,
        loadingPuntos,
        setLoadingPuntos,
        modalPuntosOpen,
        setModalPuntosOpen,
        canjeEnvioGratis,
        setCanjeEnvioGratis,
        canjeDescuento,
        setCanjeDescuento,
        mostrarCheckoutEnCarrito,
        setMostrarCheckoutEnCarrito,
        expandido,
        setExpandido,
        checkoutDeliveryData,
        setCheckoutDeliveryData,
        editSemaphoreLocal,
        setEditSemaphoreLocal,
        tituloCheckout,
        setTituloCheckout,
        submittingOrder,
        setSubmittingOrder,
        checkoutDataRef,
        metodoPagoHabitualRef,
        isSubmittingRef,
        orderAttemptIdRef,
        sessionStartRef,
        recomendacionIntentadaRef,
        esPedidoHabitual,
        setEsPedidoHabitual,
    }
}
export type DeliveryState = ReturnType<typeof useDeliveryState>
