/**
 * Checkout de Páginas, encapsulado en el runtime (`docs/PAGINAS_PROPIAS.md`, §9).
 *
 * El diseño sólo lo incluye una vez (`<PiruCheckout />`) y le pasa piel: variante y colores. No
 * recibe ni puede leer lo que el comprador carga adentro. `carrito.checkout()` o
 * `useCheckout().abrir()` lo activan; los datos, el envío, los cupones, los puntos, el pago y el
 * alta del pedido se resuelven acá y en el backend.
 *
 * La información del comprador vive en memoria durante la compra. Lo único que se guarda en
 * `sessionStorage` para volver de Mercado Pago es el resumen sin PII (ítems, total y medio de pago).
 */
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react'
import {
    AlertTriangle,
    Banknote,
    Building2,
    Check,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Copy,
    CreditCard,
    Home,
    Loader2,
    MapPin,
    MessageCircle,
    ShoppingBag,
    Sparkles,
    Store,
    Tag,
    Truck,
    Wallet,
    X,
    Zap,
} from 'lucide-react'
import { formatoPesos } from '@/lib/tienda'
import { buildWhatsappOrderMessage } from '@/lib/whatsappOrderMessage'
import {
    obtenerContextoTracking,
    obtenerSesionTracking,
    obtenerVisitorId,
    registrarEventoTrackingUnaVez,
} from '@/lib/tracking'
import { calcularTotalesCheckout, descuentoPuntosCheckout, itemsParaPedido } from './checkoutDatos'
import { CSS_CHECKOUT } from './checkoutEstilos'
import { useCarrito, useCheckout, useLocal, useSitio, useTiendaInterna } from './hooks'
import type { CheckoutEstilo, CheckoutVariante } from './tipos'

type TipoPedido = 'delivery' | 'takeaway'
type PasoCheckout = 'tipo' | 'datos' | 'ubicacion' | 'domicilio' | 'extras'

type ExitoItem = {
    nombre: string
    cantidad: number
    precio: number
    subtotal: number
    opciones: string[]
    imagenUrl: string | null
    agregados: { id: number; nombre: string; precio: string }[]
    sin: string[]
    nota: string | null
}

type Exito = {
    pedidoId: number
    tipoPedido: TipoPedido
    total: number
    descuento: number
    items: ExitoItem[]
    metodoPago: string
    aliasDinamico: string | null
    cvuDinamico: string | null
    transferenciaAlias: string | null
    deliveryFee: number
    horario: string | null
    puntosGanados: number
    puntosUsados: number
    whatsappDestino: string | null
    estado: 'pending' | 'verifying' | 'confirmed'
    estadoPedido: string | null
    seguimientoUrl: string | null
    errorPago: string | null
    /** Sólo en memoria mientras dura la compra; no se guarda en sessionStorage. */
    direccion?: string | null
    nombreCliente?: string
}

const TITULO_PASO: Record<PasoCheckout, string> = {
    tipo: '¿Cómo lo querés?',
    datos: 'Tus datos',
    ubicacion: 'Entrega o retiro',
    domicilio: '¿Casa o departamento?',
    extras: 'Pago y detalles',
}

const esHex = (v: string | undefined): v is string => !!v && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(v)

function textoSobre(hex: string): string {
    const limpio = hex.replace('#', '')
    const completo = limpio.length === 3 ? [...limpio].map((c) => c + c).join('') : limpio
    const [r, g, b] = [0, 2, 4].map((i) => {
        const c = parseInt(completo.slice(i, i + 2), 16) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#141414' : '#ffffff'
}

const claveExito = (username: string) => `piruCheckoutPedido:${username}`

function leerExito(username: string): Exito | null {
    try {
        const bruto = sessionStorage.getItem(claveExito(username))
        if (!bruto) return null
        const valor = JSON.parse(bruto) as Exito
        return valor && Number.isSafeInteger(valor.pedidoId) ? valor : null
    } catch {
        return null
    }
}

function guardarExito(username: string, exito: Exito) {
    try {
        // Sin nombre, teléfono ni dirección, y sin las notas libres del comprador: el resumen que
        // vuelve de Mercado Pago no lleva PII.
        const sinPii = {
            ...exito,
            items: exito.items.map((item) => ({
                ...item,
                nota: null,
                opciones: item.opciones.filter((opcion) => !opcion.startsWith('“')),
            })),
        }
        delete sinPii.direccion
        delete sinPii.nombreCliente
        sessionStorage.setItem(claveExito(username), JSON.stringify(sinPii))
    } catch {
        /* storage bloqueado */
    }
}

function borrarExito(username: string) {
    try {
        sessionStorage.removeItem(claveExito(username))
    } catch {
        /* storage bloqueado */
    }
}

const soloDigitos = (v: string) => (v || '').replace(/\D/g, '')

const etiquetaMetodo = (id: string, label: string) => {
    if (id === 'cash') return 'Efectivo'
    if (id === 'manual_transfer') return 'Transferencia'
    if (id.startsWith('transferencia_automatica')) return 'Transferencia'
    if (id === 'mercadopago_bricks') return 'Tarjeta / Mercado Pago'
    if (id.startsWith('mercadopago')) return 'Mercado Pago'
    return label || id
}

function iconoMetodo(id: string) {
    if (id === 'cash') return <Banknote size={18} aria-hidden />
    if (id === 'manual_transfer' || id.startsWith('transferencia_automatica')) return <Wallet size={18} aria-hidden />
    return <CreditCard size={18} aria-hidden />
}

const metodoEsMercadoPago = (id: string) => id.startsWith('mercadopago')
const metodoEsTransferencia = (id: string) => id === 'manual_transfer' || id.startsWith('transferencia_automatica')

function useBloqueoDeScroll(activo: boolean) {
    useEffect(() => {
        if (!activo) return
        const anterior = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = anterior
        }
    }, [activo])
}

export function PiruCheckout({
    variante = 'pasos',
    estilo,
}: {
    variante?: CheckoutVariante
    estilo?: CheckoutEstilo
}) {
    const tienda = useTiendaInterna()
    const config = tienda.get().config
    const sitio = useSitio()
    const { estado: estadoLocal, local } = useLocal()
    const carrito = useCarrito()
    const { abierto, cerrar } = useCheckout()
    const datos = tienda.get().datos
    const datosCheckout = datos?.checkout ?? null
    const preview = sitio.isPreview
    const tituloId = useId()
    const lineas = tienda.get().lineas
    const items = useMemo(
        () => itemsParaPedido(lineas, datos?.productos ?? []),
        [lineas, datos?.productos]
    )
    const itemsTotal = Number(carrito.total) || 0

    const [paso, setPaso] = useState(0)
    const [tipoPedido, setTipoPedido] = useState<TipoPedido>('delivery')
    const [nombre, setNombre] = useState('')
    const [telefono, setTelefono] = useState('')
    const [direccion, setDireccion] = useState('')
    const [lat, setLat] = useState<number | null>(null)
    const [lng, setLng] = useState<number | null>(null)
    const [verificandoDireccion, setVerificandoDireccion] = useState(false)
    const [tipoDomicilio, setTipoDomicilio] = useState<'casa' | 'departamento' | null>(null)
    const [piso, setPiso] = useState('')
    const [numeroDepartamento, setNumeroDepartamento] = useState('')
    const [notas, setNotas] = useState('')
    const [programar, setProgramar] = useState(false)
    const [horario, setHorario] = useState('')
    const [metodoPago, setMetodoPago] = useState<string | null>(null)
    const [sucursalId, setSucursalId] = useState<number | null>(null)
    const [zonaEspecialId, setZonaEspecialId] = useState<number | null>(null)
    const [zonaDeliveryFee, setZonaDeliveryFee] = useState<number | null>(null)
    const [zonaNombre, setZonaNombre] = useState<string | null>(null)
    const [sucursalDelivery, setSucursalDelivery] = useState<number | null>(null)
    const [fueraDeZona, setFueraDeZona] = useState(false)
    const [verificandoZona, setVerificandoZona] = useState(false)
    const [puntos, setPuntos] = useState<number | null>(null)
    const [buscandoPuntos, setBuscandoPuntos] = useState(false)
    const [puntosTick, setPuntosTick] = useState(0)
    const [canjeEnvio, setCanjeEnvio] = useState(false)
    const [canjeDescuento, setCanjeDescuento] = useState(false)
    const [codigo, setCodigo] = useState('')
    const [codigoId, setCodigoId] = useState<number | null>(null)
    const [montoDescuento, setMontoDescuento] = useState(0)
    const [cuponEnvioGratis, setCuponEnvioGratis] = useState(false)
    const [validandoCodigo, setValidandoCodigo] = useState(false)
    const [errorCodigo, setErrorCodigo] = useState<string | null>(null)
    const [mensajeCodigo, setMensajeCodigo] = useState<string | null>(null)
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [exito, setExito] = useState<Exito | null>(null)
    const [copiado, setCopiado] = useState<string | null>(null)
    const hayExito = Boolean(exito)
    const dialogo = useRef<HTMLElement>(null)
    const codigoAuto = useRef<string | null>(null)
    const slotIdempotencia = useRef<string>('')
    const salirExitoRef = useRef<() => void>(() => {})

    const direccionSoloTexto = datosCheckout?.direccionSoloTexto === true
    const configPuntos = datosCheckout?.configuracionPuntos ?? null
    const zonas = useMemo(() => datosCheckout?.zonasEspeciales ?? [], [datosCheckout?.zonasEspeciales])
    const sucursales = useMemo(() => datosCheckout?.sucursales ?? [], [datosCheckout?.sucursales])
    const franjas = useMemo(() => datosCheckout?.franjas ?? [], [datosCheckout?.franjas])
    const metodos = useMemo(() => local?.metodosPago ?? [], [local?.metodosPago])

    useBloqueoDeScroll(abierto)

    // El checkout existe en la página: `carrito.checkout()` lo abre en vez de navegar
    // al checkout de la tienda estándar.
    useEffect(() => {
        tienda.set({ checkoutMontado: true })
        return () => {
            tienda.set({ checkoutMontado: false })
        }
    }, [tienda])

    // Vuelta de Mercado Pago: el backend nos devuelve con `?piru_pedido=<id>&piru_tipo=…`.
    useEffect(() => {
        if (preview) return
        const url = new URL(window.location.href)
        const id = Number(url.searchParams.get('piru_pedido'))
        if (!Number.isSafeInteger(id) || id <= 0) return
        const tipo = url.searchParams.get('piru_tipo') === 'takeaway' ? 'takeaway' : 'delivery'
        const totalUrl = Number(url.searchParams.get('piru_total'))
        const metodoUrl = url.searchParams.get('piru_metodo') ?? ''
        url.searchParams.delete('piru_pedido')
        url.searchParams.delete('piru_tipo')
        url.searchParams.delete('piru_total')
        url.searchParams.delete('piru_metodo')
        window.history.replaceState(null, '', url.pathname + url.search + url.hash)
        const guardado = leerExito(config.username)
        setExito(
            guardado?.pedidoId === id
                ? { ...guardado, estado: 'verifying' }
                : {
                      pedidoId: id,
                      tipoPedido: tipo,
                      total: Number.isFinite(totalUrl) ? totalUrl : 0,
                      descuento: 0,
                      items: [],
                      metodoPago: metodoUrl,
                      aliasDinamico: null,
                      cvuDinamico: null,
                      transferenciaAlias: null,
                      deliveryFee: 0,
                      horario: null,
                      puntosGanados: 0,
                      puntosUsados: 0,
                      whatsappDestino: null,
                      estado: 'verifying',
                      estadoPedido: null,
                      seguimientoUrl: null,
                      errorPago: null,
                  }
        )
        tienda.set({ checkoutAbierto: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Al abrir, el foco entra al diálogo y Escape cierra (salvo que se esté enviando).
    useEffect(() => {
        if (!abierto) return
        const anterior = document.activeElement as HTMLElement | null
        dialogo.current?.focus()
        const tecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !enviando) {
                e.preventDefault()
                if (hayExito) salirExitoRef.current()
                else cerrar()
            }
            if (e.key === 'Tab' && dialogo.current) {
                const foco = [...dialogo.current.querySelectorAll<HTMLElement>('button,input,textarea,select,[tabindex="0"]')].filter(
                    (el) => !el.hasAttribute('disabled')
                )
                if (!foco.length) return
                const [primero, ultimo] = [foco[0], foco[foco.length - 1]]
                if (e.shiftKey && document.activeElement === primero) {
                    e.preventDefault()
                    ultimo.focus()
                } else if (!e.shiftKey && document.activeElement === ultimo) {
                    e.preventDefault()
                    primero.focus()
                }
            }
        }
        window.addEventListener('keydown', tecla)
        return () => {
            window.removeEventListener('keydown', tecla)
            anterior?.focus?.()
        }
    }, [abierto, cerrar, enviando, hayExito])

    // Tipo de pedido y medio de pago válidos para este local.
    useEffect(() => {
        if (!local) return
        if (!local.deliveryEnabled && tipoPedido === 'delivery') setTipoPedido('takeaway')
        else if (!local.takeawayEnabled && tipoPedido === 'takeaway') setTipoPedido('delivery')
    }, [local, tipoPedido])

    useEffect(() => {
        if (!metodos.length) return
        const ids = new Set(metodos.map((m) => m.id))
        setMetodoPago((prev) => (prev && ids.has(prev) ? prev : metodos[0].id))
    }, [metodos])

    useEffect(() => {
        if (sucursales.length === 1) setSucursalId(sucursales[0].id)
    }, [sucursales])

    // Si el local está cerrado y acepta programados, el horario deja de ser opcional.
    useEffect(() => {
        if (local && datosCheckout?.permiteProgramados && (datosCheckout.soloProgramados || !local.abierto)) setProgramar(true)
    }, [local, datosCheckout?.permiteProgramados, datosCheckout?.soloProgramados])

    // Saldo de puntos del teléfono que se está escribiendo.
    useEffect(() => {
        const normalizado = soloDigitos(telefono)
        if (preview || !local?.sistemaPuntos || normalizado.length < 8) {
            setPuntos(null)
            setBuscandoPuntos(false)
            return
        }
        let cancelado = false
        setBuscandoPuntos(true)
        const timer = window.setTimeout(async () => {
            try {
                const res = await fetch(
                    `${config.api}/public/restaurante/${config.restauranteId}/cliente/${encodeURIComponent(normalizado)}`
                )
                const data = res.ok ? await res.json() : null
                if (!cancelado) setPuntos(data?.success && Number.isFinite(Number(data.data?.puntos)) ? Number(data.data.puntos) : 0)
            } catch {
                if (!cancelado) setPuntos(0)
            } finally {
                if (!cancelado) setBuscandoPuntos(false)
            }
        }, 450)
        return () => {
            cancelado = true
            window.clearTimeout(timer)
        }
    }, [telefono, local?.sistemaPuntos, config.api, config.restauranteId, preview, puntosTick])

    // Zona de delivery: apenas hay coordenadas, el backend dice si está dentro y cuánto cuesta.
    useEffect(() => {
        if (preview || tipoPedido !== 'delivery' || zonaEspecialId || direccionSoloTexto || lat === null || lng === null) return
        const controlador = new AbortController()
        setVerificandoZona(true)
        fetch(`${config.api}/public/restaurante/${config.restauranteId}/check-zona?lat=${lat}&lng=${lng}`, {
            signal: controlador.signal,
        })
            .then((r) => r.json())
            .then((data) => {
                if (data?.code === 'FUERA_DE_ZONA') {
                    setFueraDeZona(true)
                    setZonaDeliveryFee(null)
                    setZonaNombre(null)
                    setSucursalDelivery(null)
                } else if (data?.success) {
                    setFueraDeZona(false)
                    setZonaDeliveryFee(Number(data.deliveryFee) || 0)
                    setZonaNombre(data.zonaNombre || null)
                    setSucursalDelivery(data.sucursalId ?? null)
                }
            })
            .catch(() => {
                /* sin red: se usa el envío base del local */
            })
            .finally(() => {
                if (!controlador.signal.aborted) setVerificandoZona(false)
            })
        return () => controlador.abort()
    }, [lat, lng, tipoPedido, zonaEspecialId, direccionSoloTexto, config.api, config.restauranteId, preview])

    // Código promocional que viene en un link de campaña.
    useEffect(() => {
        if (!abierto || preview || codigoId || itemsTotal <= 0) return
        const auto = obtenerContextoTracking(config.username)?.codigoPromocional?.trim().toUpperCase()
        if (!auto || codigoAuto.current === auto) return
        codigoAuto.current = auto
        setCodigo(auto)
        void validarCodigo(auto, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto, preview, codigoId, itemsTotal])

    // Estado del pedido en el éxito (transferencia automática / vuelta de Mercado Pago).
    const idExito = exito?.pedidoId
    const tipoExito = exito?.tipoPedido
    const estadoExito = exito?.estado
    useEffect(() => {
        if (!idExito || !tipoExito || estadoExito === 'confirmed' || preview) return
        let cancelado = false
        const consultar = async () => {
            try {
                const res = await fetch(`${config.api}/public/pedido/${tipoExito}/${idExito}/status`)
                if (!res.ok) return
                const data = await res.json()
                if (!cancelado && data?.success) {
                    setExito((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  estado: data.pagado ? 'confirmed' : prev.estado,
                                  estadoPedido: data.estado ?? prev.estadoPedido,
                                  seguimientoUrl: data.rapiboyTrackingUrl ?? prev.seguimientoUrl,
                              }
                            : prev
                    )
                }
            } catch {
                /* se reintenta */
            }
        }
        void consultar()
        const timer = window.setInterval(consultar, 4000)
        return () => {
            cancelado = true
            window.clearInterval(timer)
        }
    }, [idExito, tipoExito, estadoExito, config.api, preview])

    const puntosActuales = puntos ?? 0
    const costoEnvio = configPuntos?.puntosEnvioGratis ?? 0
    const costoDescuento = configPuntos?.descuentoPuntosCosto ?? 0
    const descuentoHabilitado =
        Boolean(configPuntos?.permiteCanjeDescuento) && itemsTotal >= (configPuntos?.descuentoMontoMinimo ?? 0)
    const puntosTrasDescuento =
        canjeDescuento && descuentoHabilitado ? Math.max(0, puntosActuales - costoDescuento) : puntosActuales
    const puedeCanjearEnvio =
        tipoPedido === 'delivery' &&
        !(codigoId && cuponEnvioGratis) &&
        Boolean(configPuntos?.permiteCanjeEnvioGratis) &&
        (zonaEspecialId ? (zonas.find((z) => z.id === zonaEspecialId)?.precio ?? 0) : (zonaDeliveryFee ?? local?.deliveryFee ?? 0)) > 0 &&
        puntosTrasDescuento >= costoEnvio
    const canjeEnvioActivo = canjeEnvio && puedeCanjearEnvio
    const puntosRestantes = canjeEnvioActivo ? Math.max(0, puntosActuales - costoEnvio) : puntosActuales
    const puedeCanjearDescuento = descuentoHabilitado && puntosRestantes >= costoDescuento
    const canjeDescuentoActivo = canjeDescuento && puedeCanjearDescuento
    const descuentoPuntosValor = canjeDescuentoActivo ? descuentoPuntosCheckout(configPuntos, itemsTotal) : 0

    const zonaEspecial = zonas.find((z) => z.id === zonaEspecialId) ?? null
    const feeBase =
        tipoPedido === 'delivery'
            ? zonaEspecial
                ? zonaEspecial.precio
                : (zonaDeliveryFee ?? local?.deliveryFee ?? 0)
            : 0
    const totales = calcularTotalesCheckout({
        itemsTotal,
        deliveryFee: feeBase,
        canjeEnvio: canjeEnvioActivo,
        descuentoPuntos: descuentoPuntosValor,
        descuento: montoDescuento,
    })

    const pasos: PasoCheckout[] =
        tipoPedido === 'delivery' && !zonaEspecial
            ? ['tipo', 'datos', 'ubicacion', 'domicilio', 'extras']
            : ['tipo', 'datos', 'ubicacion', 'extras']
    const pasoActual = pasos[Math.min(paso, pasos.length - 1)]
    const programacionObligatoria =
        Boolean(datosCheckout?.permiteProgramados) && (Boolean(datosCheckout?.soloProgramados) || local?.abierto === false)
    const usarFranjas = datosCheckout?.usarFranjas === true
    const horarioFinal = !datosCheckout?.permiteProgramados
        ? ''
        : usarFranjas
          ? horario
          : programar || programacionObligatoria
            ? horario
            : ''

    const acentoBruto = estilo?.acento
    const textoBruto = estilo?.texto
    const superficieBruta = estilo?.superficie
    const lineaBruta = estilo?.linea
    const acento = esHex(acentoBruto) ? acentoBruto : '#141414'
    const textoEstilo = esHex(textoBruto) ? textoBruto : '#141414'
    const superficieEstilo = esHex(superficieBruta) ? superficieBruta : '#ffffff'
    const lineaEstilo = esHex(lineaBruta) ? lineaBruta : '#e7e5e2'
    const estiloCss = {
        '--pc-acento': acento,
        '--pc-acento-texto': textoSobre(acento),
        '--pc-texto': textoEstilo,
        '--pc-superficie': superficieEstilo,
        '--pc-linea': lineaEstilo,
        '--pc-radio': `${Math.max(0, Math.min(32, Number(estilo?.radio) || 18))}px`,
        '--pc-fuente': estilo?.fuente || 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    } as CSSProperties
    function cambiarTipo(nuevo: TipoPedido) {
        setTipoPedido(nuevo)
        setPaso(0)
        if (nuevo !== 'delivery' && cuponEnvioGratis) {
            setCodigoId(null)
            setMontoDescuento(0)
            setCuponEnvioGratis(false)
        }
    }

    function cambiarDireccion(valor: string) {
        setDireccion(valor)
        setLat(null)
        setLng(null)
        setZonaDeliveryFee(null)
        setZonaNombre(null)
        setFueraDeZona(false)
        setSucursalDelivery(null)
    }

    async function verificarDireccion() {
        if (!direccion.trim() || preview) return
        setVerificandoDireccion(true)
        setError(null)
        try {
            const res = await fetch(`${config.api}/public/restaurante/${config.restauranteId}/geocodificar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direccion: direccion.trim() }),
            })
            const data = await res.json()
            if (!res.ok || !data?.success || !data?.data) {
                setError(data?.message || 'No encontramos esa dirección. Probá escribirla de otra forma.')
                return
            }
            setDireccion(data.data.direccion ?? direccion)
            setLat(Number(data.data.lat))
            setLng(Number(data.data.lng))
        } catch {
            setError('No pudimos verificar la dirección. Probá de nuevo.')
        } finally {
            setVerificandoDireccion(false)
        }
    }

    async function validarCodigo(codigoBruto: string, automatico = false) {
        const limpio = codigoBruto.trim().toUpperCase()
        if (!limpio || preview) return
        setValidandoCodigo(true)
        setErrorCodigo(null)
        setMensajeCodigo(null)
        try {
            const res = await fetch(`${config.api}/public/descuentos/validar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restauranteId: config.restauranteId,
                    codigo: limpio,
                    totalCarrito: Math.max(0, itemsTotal - descuentoPuntosValor),
                    tipoPedido,
                    costoEnvio: tipoPedido === 'delivery' ? feeBase : 0,
                }),
            })
            const data = await res.json()
            if (data?.success && data.data) {
                setCodigoId(Number(data.data.codigoDescuentoId))
                setMontoDescuento(parseFloat(data.data.montoDescuento) || 0)
                setCuponEnvioGratis(data.data.tipo === 'envio_gratis')
                setCodigo(data.data.codigo ?? limpio)
                setMensajeCodigo(
                    data.data.tipo === 'envio_gratis'
                        ? 'Envío gratis aplicado'
                        : `${automatico ? 'Beneficio de la campaña aplicado' : 'Código aplicado'}: -${formatoPesos(data.data.montoDescuento)}`
                )
            } else {
                setErrorCodigo(data?.message || 'Código no válido')
                setCodigoId(null)
                setMontoDescuento(0)
                setCuponEnvioGratis(false)
            }
        } catch {
            setErrorCodigo('No pudimos validar el código')
        } finally {
            setValidandoCodigo(false)
        }
    }

    function quitarCodigo() {
        setCodigo('')
        setCodigoId(null)
        setMontoDescuento(0)
        setCuponEnvioGratis(false)
        setErrorCodigo(null)
        setMensajeCodigo(null)
    }

    function validarPaso(indice: number): boolean {
        const clave = pasos[Math.min(indice, pasos.length - 1)]
        if (clave === 'datos') {
            if (!nombre.trim() || soloDigitos(telefono).length < 8) {
                setError('Completá tu nombre y un celular válido.')
                return false
            }
        }
        if (clave === 'ubicacion') {
            if (tipoPedido === 'delivery') {
                if (zonaEspecialId) return true
                if (!direccion.trim() || direccion.trim().length < 5) {
                    setError('Ingresá una dirección de entrega.')
                    return false
                }
                if (!direccionSoloTexto && (lat === null || lng === null) && !preview) {
                    setError('Verificá la dirección para calcular el envío.')
                    return false
                }
                if (fueraDeZona) {
                    setError('La dirección está fuera del área de delivery. Probá Take Away.')
                    return false
                }
            } else if (sucursales.length > 1 && !sucursalId) {
                setError('Elegí el local donde retirás.')
                return false
            }
        }
        if (clave === 'domicilio') {
            if (!tipoDomicilio) {
                setError('Indicá si es casa o departamento.')
                return false
            }
            if (tipoDomicilio === 'departamento' && (!piso.trim() || !numeroDepartamento.trim())) {
                setError('Completá el piso y el departamento.')
                return false
            }
        }
        if (clave === 'extras') {
            if (!metodoPago) {
                setError('Elegí un medio de pago.')
                return false
            }
            if (programacionObligatoria && !horario) {
                setError(usarFranjas ? 'Elegí un horario de entrega.' : 'Indicá a qué hora querés tu pedido.')
                return false
            }
        }
        setError(null)
        return true
    }

    function validarTodo(): boolean {
        for (let i = 0; i < pasos.length; i++) if (!validarPaso(i)) return false
        return true
    }

    function avanzar() {
        if (!validarPaso(paso)) return
        if (paso < pasos.length - 1) setPaso(paso + 1)
        else void confirmar()
    }

    function atras() {
        if (exito) {
            salirDelExito()
            return
        }
        if (variante === 'pasos' && paso > 0) {
            setPaso(paso - 1)
            setError(null)
            return
        }
        cerrar()
    }

    async function confirmar() {
        if (enviando || exito) return
        if (preview) {
            tienda.avisar('En la vista previa no se compra: el checkout se completa en el sitio publicado.')
            return
        }
        if (carrito.blockReason) {
            setError(
                carrito.blockReason === 'closed'
                    ? 'El local está cerrado y no toma pedidos en este momento.'
                    : carrito.blockReason === 'paused'
                      ? 'El local no está recibiendo pedidos.'
                      : 'Revisá tu pedido: hay un producto que ya no está disponible.'
            )
            return
        }
        if (!validarTodo()) return
        setEnviando(true)
        setError(null)
        if (!slotIdempotencia.current) slotIdempotencia.current = crypto.randomUUID()
        const endpoint = tipoPedido === 'delivery' ? '/public/delivery/create' : '/public/takeaway/create'
        const tracking = obtenerContextoTracking(config.username)
        const notasFinal =
            tipoPedido === 'delivery' && tipoDomicilio === 'departamento'
                ? `Piso ${piso.trim()} Dpto ${numeroDepartamento.trim()}${notas.trim() ? `\n${notas.trim()}` : ''}`
                : notas.trim()
        const sucursalFinal =
            tipoPedido === 'delivery'
                ? zonaEspecialId
                    ? null
                    : (sucursalDelivery ?? null)
                : sucursales.length === 1
                  ? sucursales[0].id
                  : sucursalId
        const payload: Record<string, unknown> = {
            restauranteId: config.restauranteId,
            nombreCliente: nombre.trim(),
            telefono: soloDigitos(telefono),
            notas: notasFinal,
            items,
            ...(metodoPago ? { metodoPago } : {}),
            ...(codigoId ? { codigoDescuentoId: codigoId } : {}),
            ...(canjeEnvioActivo ? { canjeEnvioGratis: true } : {}),
            ...(canjeDescuentoActivo ? { canjeDescuento: true } : {}),
            ...(horarioFinal ? { horarioProgramado: horarioFinal } : {}),
            ...(sucursalFinal ? { sucursalId: sucursalFinal } : {}),
            visitorId: obtenerVisitorId(),
            sesionUuid: obtenerSesionTracking(config.username).sesionUuid,
            ...(tracking?.campaniaSlug ? { campaniaSlug: tracking.campaniaSlug } : {}),
            ...(tracking?.campanaId ? { campanaId: Number(tracking.campanaId) } : {}),
            ...(tracking?.recetaToken ? { recetaToken: tracking.recetaToken } : {}),
        }
        if (tipoPedido === 'delivery') {
            if (zonaEspecialId) payload.zonaEspecialId = zonaEspecialId
            else {
                payload.direccion = direccion.trim()
                if (lat !== null) payload.lat = lat
                if (lng !== null) payload.lng = lng
            }
        }
        try {
            const res = await fetch(`${config.api}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Idempotency-Key': slotIdempotencia.current,
                },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok || !data?.success || !data?.data?.id) {
                setError(
                    data?.code === 'FUERA_DE_ZONA'
                        ? 'Tu dirección está fuera del área de delivery. Probá Take Away.'
                        : data?.message || 'No pudimos crear el pedido. Probá de nuevo.'
                )
                return
            }
            const pedidoId = Number(data.data.id)
            const exitoNuevo: Exito = {
                pedidoId,
                tipoPedido,
                total: parseFloat(data.data.total) || totales.total,
                descuento: montoDescuento + descuentoPuntosValor,
                items: carrito.lines.map((linea) => {
                    const cruda = lineas.find((l) => l.key === linea.key)
                    const producto = datos?.productos.find((p) => p.id === linea.productoId) ?? null
                    const agregados = (cruda?.agregados ?? []).flatMap((id) => {
                        const agregado = producto?.agregados.find((a) => a.id === id)
                        return agregado ? [{ id: agregado.id, nombre: agregado.nombre, precio: String(agregado.precio) }] : []
                    })
                    const sin = (cruda?.ingredientesExcluidos ?? []).flatMap((id) => {
                        const ingrediente = producto?.ingredientes.find((i) => i.id === id)
                        return ingrediente ? [ingrediente.nombre] : []
                    })
                    const variantes = [linea.nombre, ...linea.opciones.filter((o) => !o.startsWith('+ ') && !o.startsWith('Sin ') && !o.startsWith('“'))]
                    return {
                        nombre: variantes.join(' - '),
                        cantidad: linea.cantidad,
                        precio: linea.precioUnitario,
                        subtotal: linea.subtotal,
                        opciones: linea.opciones,
                        imagenUrl: linea.imagenUrl,
                        agregados,
                        sin,
                        nota: cruda?.nota ?? null,
                    }
                }),
                metodoPago: String(data.data.metodoPago || metodoPago || ''),
                aliasDinamico: data.data.aliasDinamico ?? null,
                cvuDinamico: data.data.cvuDinamico ?? null,
                transferenciaAlias: data.data.transferenciaAliasDestino ?? datosCheckout?.transferenciaAlias ?? null,
                deliveryFee: parseFloat(data.data.deliveryFee) || 0,
                horario: data.data.horarioProgramado || horarioFinal || null,
                puntosGanados: Number(data.data.puntosGanados) || 0,
                puntosUsados: Number(data.data.puntosUsados) || 0,
                whatsappDestino: data.data.whatsappDestino ?? null,
                estado: metodoEsMercadoPago(String(metodoPago)) || metodoEsTransferencia(String(metodoPago)) ? 'verifying' : 'confirmed',
                estadoPedido: 'pending',
                seguimientoUrl: null,
                errorPago: null,
                direccion:
                    tipoPedido === 'delivery'
                        ? zonaEspecial
                            ? `Country · ${zonaEspecial.nombre}`
                            : direccion.trim()
                        : null,
                nombreCliente: nombre.trim(),
            }
            if (!metodoEsMercadoPago(exitoNuevo.metodoPago) && !metodoEsTransferencia(exitoNuevo.metodoPago)) {
                exitoNuevo.estado = 'confirmed'
            }
            setExito(exitoNuevo)
            guardarExito(config.username, exitoNuevo)
            tienda.set({ lineas: [], checkoutAbierto: true, submitting: false })
            registrarEventoTrackingUnaVez(
                config.restauranteId,
                config.username,
                'purchase',
                `pedido-${pedidoId}`,
                {
                    pedidoUnificadoId: pedidoId,
                    valor: exitoNuevo.total,
                    items: carrito.lines,
                    tipoPedido,
                    cantidadItems: carrito.lines.length,
                }
            )
            if (metodoEsMercadoPago(exitoNuevo.metodoPago)) await irAPagar(pedidoId)
        } catch {
            setError('Ocurrió un error al enviar el pedido. Probá de nuevo.')
        } finally {
            setEnviando(false)
        }
    }

    async function irAPagar(pedidoId: number) {
        try {
            const res = await fetch(`${config.api}/mp/crear-preferencia-externo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pedidoId,
                    returnUrl: `${window.location.origin}${window.location.pathname}`,
                }),
            })
            const data = await res.json()
            if (data?.success && data.url_pago) {
                window.location.assign(data.url_pago)
                return
            }
            setExito((prev) =>
                prev ? { ...prev, errorPago: data?.error || 'No pudimos iniciar el pago con Mercado Pago.' } : prev
            )
        } catch {
            setExito((prev) =>
                prev ? { ...prev, errorPago: 'No pudimos conectar con Mercado Pago. Probá de nuevo.' } : prev
            )
        }
    }

    function salirDelExito() {
        borrarExito(config.username)
        setExito(null)
        setPaso(0)
        setError(null)
        setEnviando(false)
        slotIdempotencia.current = ''
        codigoAuto.current = null
        setCanjeEnvio(false)
        setCanjeDescuento(false)
        setCodigo('')
        setCodigoId(null)
        setMontoDescuento(0)
        setCuponEnvioGratis(false)
        setErrorCodigo(null)
        setMensajeCodigo(null)
        setNotas('')
        setHorario('')
        setProgramar(false)
        setZonaEspecialId(null)
        setZonaDeliveryFee(null)
        setZonaNombre(null)
        setSucursalDelivery(null)
        setFueraDeZona(false)
        setPuntos(null)
        setPuntosTick((valor) => valor + 1)
        cerrar()
    }

    salirExitoRef.current = salirDelExito

    async function copiar(valor: string) {        try {
            await navigator.clipboard.writeText(valor)
            setCopiado(valor)
            window.setTimeout(() => setCopiado(null), 2000)
        } catch {
            setCopiado(null)
        }
    }

    if (!abierto) return null

    const sinItems = carrito.count === 0 && !exito
    const resumen = (
        <div className="piru-checkout-resumen" aria-label="Resumen del pedido">
            <div className="piru-checkout-resumen-fila">
                <span>
                    Subtotal · {carrito.count} {carrito.count === 1 ? 'ítem' : 'ítems'}
                </span>
                <span>{formatoPesos(totales.subtotal)}</span>
            </div>
            {tipoPedido === 'delivery' && totales.envio > 0 && (
                <div className="piru-checkout-resumen-fila">
                    <span>Envío{zonaNombre ? ` · ${zonaNombre}` : ''}</span>
                    <span>{formatoPesos(totales.envio)}</span>
                </div>
            )}
            {canjeEnvioActivo && feeBase > 0 && (
                <div className="piru-checkout-resumen-fila">
                    <span>Envío gratis (puntos)</span>
                    <span>-{formatoPesos(feeBase)}</span>
                </div>
            )}
            {totales.descuentoPuntos > 0 && (
                <div className="piru-checkout-resumen-fila">
                    <span>Descuento por puntos</span>
                    <span>-{formatoPesos(totales.descuentoPuntos)}</span>
                </div>
            )}
            {totales.descuento > 0 && (
                <div className="piru-checkout-resumen-fila">
                    <span>Descuento</span>
                    <span>-{formatoPesos(totales.descuento)}</span>
                </div>
            )}
            <div className="piru-checkout-resumen-total">
                <span>Total</span>
                <span>{formatoPesos(totales.total)}</span>
            </div>
        </div>
    )

    const seccionTipo = (
        <section className="piru-checkout-seccion">
            {local && !local.deliveryEnabled && !local.takeawayEnabled ? (
                <p className="piru-checkout-aviso" role="alert">
                    <AlertTriangle size={16} aria-hidden /> El local no está aceptando pedidos ahora.
                </p>
            ) : (
                <div className="piru-checkout-tarjetas">
                    <button
                        type="button"
                        className="piru-checkout-tarjeta"
                        aria-pressed={tipoPedido === 'delivery'}
                        disabled={local ? !local.deliveryEnabled : false}
                        onClick={() => cambiarTipo('delivery')}
                    >
                        <MapPin size={18} aria-hidden />
                        <span className="piru-checkout-tarjeta-texto">
                            <strong>Delivery</strong>
                            <small>Te lo llevamos</small>
                        </span>
                        {tipoPedido === 'delivery' && <Check className="piru-checkout-check" size={18} aria-hidden />}
                    </button>
                    <button
                        type="button"
                        className="piru-checkout-tarjeta"
                        aria-pressed={tipoPedido === 'takeaway'}
                        disabled={local ? !local.takeawayEnabled : false}
                        onClick={() => cambiarTipo('takeaway')}
                    >
                        <Store size={18} aria-hidden />
                        <span className="piru-checkout-tarjeta-texto">
                            <strong>Take Away</strong>
                            <small>Lo retirás</small>
                        </span>
                        {tipoPedido === 'takeaway' && <Check className="piru-checkout-check" size={18} aria-hidden />}
                    </button>
                </div>
            )}
        </section>
    )

    const seccionDatos = (
        <section className="piru-checkout-seccion">
            <div className="piru-checkout-campo">
                <label htmlFor={`${tituloId}-nombre`}>Nombre</label>
                <input
                    id={`${tituloId}-nombre`}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Quién recibe el pedido"
                    autoComplete="name"
                    maxLength={120}
                />
            </div>
            <div className="piru-checkout-campo">
                <label htmlFor={`${tituloId}-telefono`}>Celular</label>
                <input
                    id={`${tituloId}-telefono`}
                    type="tel"
                    inputMode="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(soloDigitos(e.target.value))}
                    placeholder="Ej: 5491112345678"
                    autoComplete="tel"
                    maxLength={20}
                />
                {buscandoPuntos && <p className="piru-checkout-ayuda">Buscando tus puntos…</p>}
            </div>
        </section>
    )

    const seccionUbicacion = (
        <section className="piru-checkout-seccion">
            {tipoPedido === 'delivery' && zonas.length > 0 && (
                <>
                    <p className="piru-checkout-ayuda">Si tu casa está en un barrio cerrado, elegí la zona.</p>
                    <div className="piru-checkout-tarjetas una">
                        <button
                            type="button"
                            className="piru-checkout-tarjeta"
                            aria-pressed={zonaEspecialId === null}
                            onClick={() => {
                                setZonaEspecialId(null)
                                setZonaDeliveryFee(null)
                                setZonaNombre(null)
                            }}
                        >
                            <Home size={18} aria-hidden />
                            <span className="piru-checkout-tarjeta-texto">
                                <strong>A domicilio</strong>
                                <small>Dirección en la ciudad</small>
                            </span>
                            {zonaEspecialId === null && <Check className="piru-checkout-check" size={18} aria-hidden />}
                        </button>
                        {zonas.map((zona) => {
                            const disponible = zona.enVentana || datosCheckout?.permitirPrePedidosZonas === true
                            return (
                                <button
                                    key={zona.id}
                                    type="button"
                                    className="piru-checkout-tarjeta"
                                    aria-pressed={zonaEspecialId === zona.id}
                                    disabled={!disponible}
                                    onClick={() => {
                                        setZonaEspecialId(zona.id)
                                        setZonaDeliveryFee(zona.precio)
                                        setZonaNombre(zona.nombre)
                                        setFueraDeZona(false)
                                        setSucursalDelivery(null)
                                    }}
                                >
                                    <Truck size={18} aria-hidden />
                                    <span className="piru-checkout-tarjeta-texto">
                                        <strong>{zona.nombre}</strong>
                                        <small>
                                            {zona.enVentana
                                                ? `Envío ${formatoPesos(zona.precio)}`
                                                : `Disponible ${zona.proximaVentana || 'más tarde'}`}
                                        </small>
                                    </span>
                                    {zonaEspecialId === zona.id && <Check className="piru-checkout-check" size={18} aria-hidden />}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            {tipoPedido === 'delivery' && !zonaEspecialId && (
                <>
                    <div className="piru-checkout-campo">
                        <label htmlFor={`${tituloId}-direccion`}>Dirección de entrega</label>
                        <input
                            id={`${tituloId}-direccion`}
                            value={direccion}
                            onChange={(e) => cambiarDireccion(e.target.value)}
                            placeholder="Calle, número, barrio y ciudad"
                            autoComplete="street-address"
                            maxLength={200}
                        />
                    </div>
                    {!direccionSoloTexto && !preview && (
                        <button
                            type="button"
                            className="piru-checkout-boton secundario"
                            onClick={() => void verificarDireccion()}
                            disabled={verificandoDireccion || direccion.trim().length < 5}
                        >
                            {verificandoDireccion ? <Loader2 className="piru-checkout-spin" size={16} /> : <MapPin size={16} />}
                            {verificandoDireccion ? 'Verificando…' : 'Verificar dirección'}
                        </button>
                    )}
                    {preview && !direccionSoloTexto && (
                        <p className="piru-checkout-preview">
                            En la vista previa no se valida la dirección; en el sitio publicado se calcula la zona y el envío.
                        </p>
                    )}
                    {verificandoZona && (
                        <p className="piru-checkout-ayuda">
                            <Loader2 className="piru-checkout-spin" size={13} /> Calculando el envío…
                        </p>
                    )}
                    {!verificandoZona && fueraDeZona && (
                        <p className="piru-checkout-aviso" role="alert">
                            <AlertTriangle size={16} aria-hidden /> Fuera del área de delivery. Probá Take Away.
                        </p>
                    )}
                    {!verificandoZona && !fueraDeZona && feeBase > 0 && (
                        <p className="piru-checkout-ayuda">
                            Envío{zonaNombre ? ` · ${zonaNombre}` : ''}: {formatoPesos(feeBase)}
                        </p>
                    )}
                </>
            )}

            {tipoPedido === 'takeaway' && (
                <>
                    {sucursales.length > 1 ? (
                        <div className="piru-checkout-tarjetas una">
                            {sucursales.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className="piru-checkout-tarjeta"
                                    aria-pressed={sucursalId === s.id}
                                    onClick={() => setSucursalId(s.id)}
                                >
                                    <Store size={18} aria-hidden />
                                    <span className="piru-checkout-tarjeta-texto">
                                        <strong>{s.nombre}</strong>
                                        {s.direccion && <small>{s.direccion}</small>}
                                    </span>
                                    {sucursalId === s.id && <Check className="piru-checkout-check" size={18} aria-hidden />}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="piru-checkout-ayuda">
                            Retirás en <strong>{sucursales[0]?.direccion || local?.direccion || 'el local'}</strong>.
                        </p>
                    )}
                </>
            )}
        </section>
    )

    const seccionDomicilio = (
        <section className="piru-checkout-seccion">
            <p className="piru-checkout-ayuda">Esto nos ayuda a entregar sin demoras.</p>
            <div className="piru-checkout-tarjetas">
                <button
                    type="button"
                    className="piru-checkout-tarjeta"
                    aria-pressed={tipoDomicilio === 'casa'}
                    onClick={() => {
                        setTipoDomicilio('casa')
                        setPiso('')
                        setNumeroDepartamento('')
                    }}
                >
                    <Home size={18} aria-hidden />
                    <span className="piru-checkout-tarjeta-texto">
                        <strong>Casa</strong>
                    </span>
                    {tipoDomicilio === 'casa' && <Check className="piru-checkout-check" size={18} aria-hidden />}
                </button>
                <button
                    type="button"
                    className="piru-checkout-tarjeta"
                    aria-pressed={tipoDomicilio === 'departamento'}
                    onClick={() => setTipoDomicilio('departamento')}
                >
                    <Building2 size={18} aria-hidden />
                    <span className="piru-checkout-tarjeta-texto">
                        <strong>Departamento</strong>
                    </span>
                    {tipoDomicilio === 'departamento' && <Check className="piru-checkout-check" size={18} aria-hidden />}
                </button>
            </div>
            {tipoDomicilio === 'departamento' && (
                <div className="piru-checkout-fila">
                    <div className="piru-checkout-campo">
                        <label htmlFor={`${tituloId}-piso`}>Piso</label>
                        <input id={`${tituloId}-piso`} value={piso} onChange={(e) => setPiso(e.target.value)} placeholder="Ej: 4" maxLength={10} />
                    </div>
                    <div className="piru-checkout-campo">
                        <label htmlFor={`${tituloId}-depto`}>Depto</label>
                        <input
                            id={`${tituloId}-depto`}
                            value={numeroDepartamento}
                            onChange={(e) => setNumeroDepartamento(e.target.value.toUpperCase())}
                            placeholder="Ej: C"
                            maxLength={10}
                        />
                    </div>
                </div>
            )}
        </section>
    )

    const seccionExtras = (
        <section className="piru-checkout-seccion">
            <div className="piru-checkout-campo">
                <label htmlFor={`${tituloId}-notas`}>Notas (opcional)</label>
                <textarea
                    id={`${tituloId}-notas`}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej: el timbre no anda, golpear la puerta"
                    maxLength={500}
                />
            </div>

            {datosCheckout?.permiteProgramados && (
                <div className="piru-checkout-seccion">
                    <h3>
                        <Clock size={13} aria-hidden /> ¿Cuándo lo querés?
                    </h3>
                    {usarFranjas ? (
                        <>
                            {!programacionObligatoria && (
                                <button
                                    type="button"
                                    className="piru-checkout-tarjeta"
                                    aria-pressed={horario === ''}
                                    onClick={() => setHorario('')}
                                >
                                    <Zap size={18} aria-hidden />
                                    <span className="piru-checkout-tarjeta-texto">
                                        <strong>Lo antes posible</strong>
                                    </span>
                                    {horario === '' && <Check className="piru-checkout-check" size={18} aria-hidden />}
                                </button>
                            )}
                            {franjas.length > 0 ? (
                                <div className="piru-checkout-tarjetas">
                                    {franjas.map((franja) => {
                                        const valor = `${franja.horaInicio}-${franja.horaFin}`
                                        return (
                                            <button
                                                key={franja.id}
                                                type="button"
                                                className="piru-checkout-tarjeta"
                                                aria-pressed={horario === valor}
                                                onClick={() => setHorario(horario === valor && !programacionObligatoria ? '' : valor)}
                                            >
                                                <Clock size={18} aria-hidden />
                                                <span className="piru-checkout-tarjeta-texto">
                                                    <strong>{franja.nombre}</strong>
                                                    <small>
                                                        {franja.horaInicio} – {franja.horaFin}
                                                    </small>
                                                </span>
                                                {horario === valor && <Check className="piru-checkout-check" size={18} aria-hidden />}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="piru-checkout-ayuda">No hay horarios disponibles por el momento.</p>
                            )}
                        </>
                    ) : programacionObligatoria ? (
                        <div className="piru-checkout-campo">
                            <label htmlFor={`${tituloId}-hora`}>Horario</label>
                            <input id={`${tituloId}-hora`} type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
                        </div>
                    ) : (
                        <>
                            <div className="piru-checkout-tarjetas">
                                <button
                                    type="button"
                                    className="piru-checkout-tarjeta"
                                    aria-pressed={!programar}
                                    onClick={() => {
                                        setProgramar(false)
                                        setHorario('')
                                    }}
                                >
                                    <Zap size={18} aria-hidden />
                                    <span className="piru-checkout-tarjeta-texto">
                                        <strong>Lo antes posible</strong>
                                    </span>
                                    {!programar && <Check className="piru-checkout-check" size={18} aria-hidden />}
                                </button>
                                <button
                                    type="button"
                                    className="piru-checkout-tarjeta"
                                    aria-pressed={programar}
                                    onClick={() => setProgramar(true)}
                                >
                                    <Clock size={18} aria-hidden />
                                    <span className="piru-checkout-tarjeta-texto">
                                        <strong>Programar</strong>
                                    </span>
                                    {programar && <Check className="piru-checkout-check" size={18} aria-hidden />}
                                </button>
                            </div>
                            {programar && (
                                <div className="piru-checkout-campo">
                                    <label htmlFor={`${tituloId}-hora`}>¿A qué hora?</label>
                                    <input id={`${tituloId}-hora`} type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {configPuntos && (puntos !== null || buscandoPuntos) && (
                <div className="piru-checkout-pago">
                    <strong>
                        <Sparkles size={15} aria-hidden /> Tus puntos: {buscandoPuntos ? '…' : puntosActuales}
                    </strong>
                    {configPuntos.permiteCanjeEnvioGratis && tipoPedido === 'delivery' && feeBase > 0 && (
                        <button
                            type="button"
                            className="piru-checkout-tarjeta"
                            aria-pressed={canjeEnvioActivo}
                            disabled={!puedeCanjearEnvio && !canjeEnvioActivo}
                            onClick={() => setCanjeEnvio((v) => !v)}
                        >
                            <Truck size={18} aria-hidden />
                            <span className="piru-checkout-tarjeta-texto">
                                <strong>Envío gratis</strong>
                                <small>
                                    {costoEnvio} pts
                                    {!puedeCanjearEnvio && !canjeEnvioActivo ? ` · te faltan ${Math.max(0, costoEnvio - puntosTrasDescuento)}` : ''}
                                </small>
                            </span>
                            {canjeEnvioActivo && <Check className="piru-checkout-check" size={18} aria-hidden />}
                        </button>
                    )}
                    {configPuntos.permiteCanjeDescuento && (
                        <button
                            type="button"
                            className="piru-checkout-tarjeta"
                            aria-pressed={canjeDescuentoActivo}
                            disabled={!puedeCanjearDescuento && !canjeDescuentoActivo}
                            onClick={() => setCanjeDescuento((v) => !v)}
                        >
                            <Tag size={18} aria-hidden />
                            <span className="piru-checkout-tarjeta-texto">
                                <strong>
                                    Descuento{' '}
                                    {configPuntos.descuentoTipo === 'porcentaje'
                                        ? `${configPuntos.descuentoValor}%`
                                        : formatoPesos(configPuntos.descuentoValor)}
                                </strong>
                                <small>
                                    {costoDescuento} pts
                                    {itemsTotal < configPuntos.descuentoMontoMinimo
                                        ? ` · mínimo ${formatoPesos(configPuntos.descuentoMontoMinimo)}`
                                        : ''}
                                </small>
                            </span>
                            {canjeDescuentoActivo && <Check className="piru-checkout-check" size={18} aria-hidden />}
                        </button>
                    )}
                </div>
            )}

            {(datosCheckout?.codigoDescuentoEnabled !== false || codigoId) && (
                <div className="piru-checkout-seccion">
                    <h3>
                        <Tag size={13} aria-hidden /> Código de descuento
                    </h3>
                    {codigoId ? (
                        <div className="piru-checkout-copiar">
                            <div>
                                <small>{cuponEnvioGratis ? 'Envío gratis' : 'Descuento aplicado'}</small>
                                <strong>{codigo} · -{formatoPesos(montoDescuento)}</strong>
                            </div>
                            <button type="button" className="piru-checkout-icono" onClick={quitarCodigo} aria-label="Quitar código">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="piru-checkout-fila">
                            <div className="piru-checkout-campo">
                                <label htmlFor={`${tituloId}-codigo`}>Código</label>
                                <input
                                    id={`${tituloId}-codigo`}
                                    value={codigo}
                                    onChange={(e) => {
                                        setCodigo(e.target.value.toUpperCase())
                                        setErrorCodigo(null)
                                        setMensajeCodigo(null)
                                    }}
                                    placeholder="CODIGO10"
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                            <button
                                type="button"
                                className="piru-checkout-boton secundario"
                                onClick={() => void validarCodigo(codigo)}
                                disabled={validandoCodigo || !codigo.trim()}
                            >
                                {validandoCodigo ? <Loader2 className="piru-checkout-spin" size={16} /> : 'Aplicar'}
                            </button>
                        </div>
                    )}
                    {errorCodigo && <p className="piru-checkout-aviso" role="alert">{errorCodigo}</p>}
                    {mensajeCodigo && <p className="piru-checkout-aviso ok" role="status">{mensajeCodigo}</p>}
                </div>
            )}

            {metodos.length > 0 && (
                <div className="piru-checkout-seccion">
                    <h3>Medio de pago</h3>
                    <div className="piru-checkout-tarjetas una">
                        {metodos.map((metodo) => (
                            <button
                                key={metodo.id}
                                type="button"
                                className="piru-checkout-tarjeta"
                                aria-pressed={metodoPago === metodo.id}
                                onClick={() => setMetodoPago(metodo.id)}
                            >
                                {iconoMetodo(metodo.id)}
                                <span className="piru-checkout-tarjeta-texto">
                                    <strong>{etiquetaMetodo(metodo.id, metodo.label)}</strong>
                                    {metodoEsMercadoPago(metodo.id) && <small>Se paga en Mercado Pago</small>}
                                    {metodoEsTransferencia(metodo.id) && <small>Te mostramos el alias al confirmar</small>}
                                </span>
                                {metodoPago === metodo.id && <Check className="piru-checkout-check" size={18} aria-hidden />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {metodos.length === 0 && (
                <p className="piru-checkout-aviso" role="alert">
                    <AlertTriangle size={16} aria-hidden /> El local no tiene medios de pago habilitados.
                </p>
            )}

            {resumen}
        </section>
    )

    const secciones: Record<PasoCheckout, ReactNode> = {
        tipo: seccionTipo,
        datos: seccionDatos,
        ubicacion: seccionUbicacion,
        domicilio: seccionDomicilio,
        extras: seccionExtras,
    }

    const enPasos = variante === 'pasos'
    const titulo = exito ? 'Tu pedido' : enPasos ? TITULO_PASO[pasoActual] : 'Finalizá tu pedido'
    const telefonoWhatsapp = soloDigitos(
        exito?.whatsappDestino || datosCheckout?.comprobantesWhatsapp || local?.telefono || ''
    )
    const orderInfoWhatsapp = exito
        ? {
              pedidoId: exito.pedidoId,
              tipoPedido: exito.tipoPedido,
              total: exito.total,
              montoDescuento: exito.descuento,
              deliveryFee: exito.deliveryFee,
              metodoPago: exito.metodoPago,
              aliasDinamico: exito.aliasDinamico,
              cvuDinamico: exito.cvuDinamico,
              horarioProgramado: exito.horario,
              direccion: exito.direccion || '',
              nombreCliente: exito.nombreCliente || '',
              items: exito.items.map((item) => ({
                  nombre: item.nombre,
                  precio: String(item.precio),
                  cantidad: item.cantidad,
                  agregados: item.agregados,
                  ingredientesExcluidosNombres: item.sin,
                  nota: item.nota,
              })),
          }
        : null
    const whatsappHref =
        orderInfoWhatsapp && telefonoWhatsapp
            ? `https://api.whatsapp.com/send?phone=${telefonoWhatsapp}&text=${encodeURIComponent(
                  buildWhatsappOrderMessage(orderInfoWhatsapp, {
                      restaurantName: local?.nombre,
                      restaurantDireccion: local?.direccion,
                      effectiveMetodo: exito?.metodoPago || '',
                      transferenciaAlias: exito?.transferenciaAlias,
                  })
              )}`
            : null
    const mostrarWhatsapp =
        Boolean(whatsappHref) &&
        (datosCheckout?.avisosWhatsappClienteEnabled === false ||
            metodoEsTransferencia(exito?.metodoPago ?? ''))

    return (
        <div
            className="piru-checkout-velo"
            data-pagina={variante === 'pagina' ? 'true' : undefined}
            onClick={(e) => e.target === e.currentTarget && !enviando && atras()}
        >
            <style>{CSS_CHECKOUT}</style>
            <section
                className="piru-checkout"
                data-variante={variante}
                style={estiloCss}
                role="dialog"
                aria-modal="true"
                aria-labelledby={tituloId}
                ref={dialogo}
                tabIndex={-1}
            >
                <header className="piru-checkout-cabecera">
                    {enPasos && !exito && (
                        <span
                            id={tituloId}
                            style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
                        >
                            {titulo}
                        </span>
                    )}
                    <button type="button" className="piru-checkout-icono" onClick={atras} aria-label={exito ? 'Cerrar' : 'Atrás'}>
                        {exito || variante !== 'pasos' ? <X size={20} /> : <ChevronLeft size={20} />}
                    </button>
                    {enPasos && !exito ? (
                        <>
                            <div className="piru-checkout-progreso" aria-hidden>
                                {pasos.map((_, i) => (
                                    <span key={i} className={i <= paso ? 'activo' : ''} />
                                ))}
                            </div>
                            <span className="piru-checkout-paso-numero">
                                {Math.min(paso + 1, pasos.length)}/{pasos.length}
                            </span>
                        </>
                    ) : (
                        <h2 id={tituloId} className="piru-checkout-titulo">
                            {titulo}
                        </h2>
                    )}
                    {enPasos && !exito && (
                        <button type="button" className="piru-checkout-icono" onClick={cerrar} aria-label="Cerrar">
                            <X size={20} />
                        </button>
                    )}
                </header>

                <div className="piru-checkout-cuerpo">
                    {preview && (
                        <p className="piru-checkout-preview">
                            Vista previa: podés recorrer el checkout, pero el pedido se crea en el sitio publicado.
                        </p>
                    )}

                    {exito ? (
                        <Exito
                            exito={exito}
                            localNombre={local?.nombre ?? null}
                            whatsappHref={whatsappHref}
                            mostrarWhatsapp={mostrarWhatsapp}
                            telefonoWhatsapp={telefonoWhatsapp}
                            copiado={copiado}
                            onCopiar={copiar}
                            onPagar={() => void irAPagar(exito.pedidoId)}
                            onVolver={salirDelExito}
                        />
                    ) : sinItems ? (
                        <div className="piru-checkout-sin-stock">
                            <ShoppingBag size={28} aria-hidden />
                            <strong>Tu pedido está vacío</strong>
                            <p>Agregá algo de la carta para continuar.</p>
                            <button type="button" className="piru-checkout-boton secundario" onClick={cerrar}>
                                Volver a la carta
                            </button>
                        </div>
                    ) : enPasos ? (
                        <>
                            {error && (
                                <p className="piru-checkout-aviso" role="alert">
                                    <AlertTriangle size={16} aria-hidden /> {error}
                                </p>
                            )}
                            {secciones[pasoActual]}
                        </>
                    ) : (
                        <>
                            {error && (
                                <p className="piru-checkout-aviso" role="alert">
                                    <AlertTriangle size={16} aria-hidden /> {error}
                                </p>
                            )}
                            {pasos.map((clave) => (
                                <div key={clave}>{secciones[clave]}</div>
                            ))}
                        </>
                    )}

                    {estadoLocal === 'cargando' && !exito && (
                        <p className="piru-checkout-cargando">
                            <Loader2 className="piru-checkout-spin" size={16} /> Cargando la tienda…
                        </p>
                    )}
                </div>

                {!exito && !sinItems && (
                    <div className="piru-checkout-pie">
                        <div className="piru-checkout-total-pie">
                            <span>Total</span>
                            <strong>{formatoPesos(totales.total)}</strong>
                        </div>
                        <button
                            type="button"
                            className="piru-checkout-boton"
                            onClick={() => (enPasos ? avanzar() : void confirmar())}
                            disabled={enviando || verificandoZona}
                        >
                            {enviando && <Loader2 className="piru-checkout-spin" size={18} />}
                            {enviando
                                ? 'Enviando pedido…'
                                : enPasos && paso < pasos.length - 1
                                  ? 'Siguiente'
                                  : estilo?.textoConfirmar || 'Confirmar pedido'}
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

function Exito({
    exito,
    localNombre,
    whatsappHref,
    mostrarWhatsapp,
    telefonoWhatsapp,
    copiado,
    onCopiar,
    onPagar,
    onVolver,
}: {
    exito: Exito
    localNombre: string | null
    whatsappHref: string | null
    mostrarWhatsapp: boolean
    telefonoWhatsapp: string
    copiado: string | null
    onCopiar: (valor: string) => void
    onPagar: () => void
    onVolver: () => void
}) {
    const alias = exito.aliasDinamico || exito.cvuDinamico || exito.transferenciaAlias
    const estado = exito.estado
    return (
        <div className="piru-checkout-exito">
            <div className="piru-checkout-exito-icono">
                {estado === 'confirmed' ? <CheckCircle2 size={26} /> : <Loader2 className="piru-checkout-spin" size={26} />}
            </div>
            <h2>
                {exito.estadoPedido === 'dispatched' || exito.estadoPedido === 'archived'
                    ? 'Tu pedido va en camino'
                    : estado === 'confirmed'
                      ? 'Pedido confirmado'
                      : 'Pedido recibido'}
            </h2>
            <p>
                {localNombre ? `${localNombre} · ` : ''}Pedido #{exito.pedidoId}
            </p>
            {exito.direccion && (
                <p>
                    <MapPin size={14} aria-hidden /> {exito.direccion}
                </p>
            )}
            {exito.tipoPedido === 'takeaway' && (
                <p>
                    <Store size={14} aria-hidden /> Retirás en el local
                </p>
            )}

            {(exito.puntosGanados > 0 || exito.puntosUsados > 0) && (
                <div className="piru-checkout-pago">
                    <strong>
                        <Sparkles size={15} aria-hidden /> Puntos del club
                    </strong>
                    {exito.puntosGanados > 0 && <p>Sumás +{exito.puntosGanados} puntos con este pedido.</p>}
                    {exito.puntosUsados > 0 && <p>Canjeaste {exito.puntosUsados} puntos.</p>}
                </div>
            )}

            {exito.items.length > 0 && (
                <div>
                    <ul className="piru-checkout-lineas">
                        {exito.items.map((item, i) => (
                            <li key={`${item.nombre}-${i}`}>
                                {item.imagenUrl ? (
                                    <img className="piru-checkout-lineas-foto" src={item.imagenUrl} alt="" />
                                ) : (
                                    <span className="piru-checkout-lineas-foto" aria-hidden />
                                )}
                                <div className="piru-checkout-lineas-texto">
                                    <strong>
                                        {item.cantidad}× {item.nombre}
                                    </strong>
                                    {item.opciones.length > 0 && <small>{item.opciones.join(' · ')}</small>}
                                </div>
                                <span className="piru-checkout-lineas-precio">{formatoPesos(item.subtotal)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="piru-checkout-resumen">
                        <div className="piru-checkout-resumen-total">
                            <span>Total</span>
                            <span>{formatoPesos(exito.total)}</span>
                        </div>
                    </div>
                </div>
            )}

            {(exito.metodoPago === 'cash' || exito.metodoPago === 'efectivo') && (
                <div className="piru-checkout-pago">
                    <strong>
                        <Banknote size={15} aria-hidden /> Efectivo
                    </strong>
                    <p>Aboná el importe exacto al recibir o retirar tu pedido.</p>
                </div>
            )}

            {metodoEsTransferencia(exito.metodoPago) && (
                <div className="piru-checkout-pago">
                    <strong>
                        <Wallet size={15} aria-hidden /> Transferencia
                    </strong>
                    {alias ? (
                        <>
                            <p>Transferí el total y enviá el comprobante para acelerar la preparación.</p>
                            <button type="button" className="piru-checkout-copiar" onClick={() => onCopiar(alias)}>
                                <div>
                                    <small>{exito.aliasDinamico ? 'Alias único' : exito.cvuDinamico ? 'CBU' : 'Alias'}</small>
                                    <strong>{alias}</strong>
                                </div>
                                <span>{copiado === alias ? 'Copiado' : <Copy size={16} />}</span>
                            </button>
                        </>
                    ) : (
                        <p>El local te va a pasar los datos para transferir.</p>
                    )}
                </div>
            )}

            {metodoEsMercadoPago(exito.metodoPago) && (
                <div className="piru-checkout-pago">
                    <strong>
                        <CreditCard size={15} aria-hidden /> Mercado Pago
                    </strong>
                    <p>
                        {estado === 'confirmed'
                            ? 'El pago quedó acreditado.'
                            : 'Completá el pago en Mercado Pago para que el local empiece a preparar tu pedido.'}
                    </p>
                    {estado !== 'confirmed' && (
                        <button type="button" className="piru-checkout-boton" onClick={onPagar}>
                            {exito.errorPago ? 'Reintentar pago' : 'Pagar con Mercado Pago'}
                        </button>
                    )}
                    {exito.errorPago && (
                        <p className="piru-checkout-aviso" role="alert">
                            <AlertTriangle size={16} aria-hidden /> {exito.errorPago}
                        </p>
                    )}
                </div>
            )}

            {whatsappHref && mostrarWhatsapp && (
                <a className="piru-checkout-boton whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={18} aria-hidden />{' '}
                    {metodoEsTransferencia(exito.metodoPago) ? 'Enviar comprobante por WhatsApp' : 'Enviar pedido por WhatsApp'}
                </a>
            )}
            {whatsappHref && mostrarWhatsapp && telefonoWhatsapp && !metodoEsMercadoPago(exito.metodoPago) && (
                <p className="piru-checkout-ayuda" style={{ textAlign: 'center' }}>
                    El local recibe tu pedido en su WhatsApp. Si no se abre, escribile al mismo número.
                </p>
            )}

            {exito.seguimientoUrl && (
                <a className="piru-checkout-boton secundario" href={exito.seguimientoUrl} target="_blank" rel="noopener noreferrer">
                    <Truck size={18} aria-hidden /> Rastrear el envío
                </a>
            )}

            <button type="button" className="piru-checkout-boton secundario" onClick={onVolver}>
                Volver a la tienda
            </button>
        </div>
    )
}
