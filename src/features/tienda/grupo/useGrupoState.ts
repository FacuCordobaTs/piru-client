import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import type { Turno as HorarioTurno } from '@/lib/tienda'
import { type RestauranteTienda } from '@/lib/tienda'
import { useMesaStore } from '@/store/mesaStore'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
export function useGrupoState() {
    const navigate = useNavigate()

    const { qrToken: urlQrToken } = useParams<{ qrToken?: string }>()

    const {
        mesa,
        productos,
        clientes,
        clienteNombre,
        clienteTelefono,
        clienteId,
        qrToken,
        isHydrated,
        sessionEnded,
        restaurante,
        checkoutDeliveryData,
        checkoutEditSemaphore,
        setMesa,
        setProductos,
        setPedidoId,
        setPedido,
        setRestaurante,
        setQrToken,
        setClientes,
        setCheckoutDeliveryData,
        setCheckoutEditSemaphore,
    } = useMesaStore()

    const {
        state: wsState,
        isConnected,
        sendMessage,
        confirmacionGrupal,
        confirmacionCancelada,
        clearConfirmacionCancelada,
    } = useClienteWebSocket()

    const [carritoAbierto, setCarritoAbierto] = useState(false)

    const [expandido, setExpandido] = useState(false)

    const [selectedProduct, setSelectedProduct] = useState<(typeof productos)[0] | null>(null)

    const [drawerOpen, setDrawerOpen] = useState(false)

    const [confirmacionGrupalOpen, setConfirmacionGrupalOpen] = useState(false)

    const [enviandoSolo, setEnviandoSolo] = useState(false)

    const [bienvenidaOpen, setBienvenidaOpen] = useState(false)

    const esSala = typeof window !== 'undefined' && window.location.pathname.includes('/sala/')

    const token = urlQrToken || qrToken

    const [mostrarCheckoutEnCarrito, setMostrarCheckoutEnCarrito] = useState(false)

    const [tituloCheckout, setTituloCheckout] = useState('¿Cómo lo querés?')

    const [horarios, setHorarios] = useState<HorarioTurno[]>([])

    const [estadoAbierto, setEstadoAbierto] = useState<{ abierto: boolean; proximaApertura: string | null }>({
        abierto: true,
        proximaApertura: null,
    })

    const [permitirProgramados, setPermitirProgramados] = useState(false)

    const [tiendaRemota, setTiendaRemota] = useState<RestauranteTienda | null>(null)
    return {
        navigate,
        urlQrToken,
        mesa,
        productos,
        clientes,
        clienteNombre,
        clienteTelefono,
        clienteId,
        qrToken,
        isHydrated,
        sessionEnded,
        restaurante,
        checkoutDeliveryData,
        checkoutEditSemaphore,
        setMesa,
        setProductos,
        setPedidoId,
        setPedido,
        setRestaurante,
        setQrToken,
        setClientes,
        setCheckoutDeliveryData,
        setCheckoutEditSemaphore,
        wsState,
        isConnected,
        sendMessage,
        confirmacionGrupal,
        confirmacionCancelada,
        clearConfirmacionCancelada,
        carritoAbierto,
        setCarritoAbierto,
        expandido,
        setExpandido,
        selectedProduct,
        setSelectedProduct,
        drawerOpen,
        setDrawerOpen,
        confirmacionGrupalOpen,
        setConfirmacionGrupalOpen,
        enviandoSolo,
        setEnviandoSolo,
        bienvenidaOpen,
        setBienvenidaOpen,
        esSala,
        token,
        mostrarCheckoutEnCarrito,
        setMostrarCheckoutEnCarrito,
        tituloCheckout,
        setTituloCheckout,
        horarios,
        setHorarios,
        estadoAbierto,
        setEstadoAbierto,
        permitirProgramados,
        setPermitirProgramados,
        tiendaRemota,
        setTiendaRemota,
    }
}
export type GrupoState = ReturnType<typeof useGrupoState>
