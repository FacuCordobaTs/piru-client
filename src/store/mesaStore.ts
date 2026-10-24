import type { CheckoutDeliveryData, CheckoutEditSemaphore } from '@/features/tienda/checkout'
import type { ProductoTienda, RestaurantePublico } from '@/features/tienda/datos'
import type { RestauranteTienda } from '@/lib/tienda'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Mesa {
  id: number
  nombre: string
  qrToken: string
  restauranteId: number
}

interface Restaurante extends RestauranteTienda {
  id: number
  nombre: string
  imagenUrl: string | null
  mpConnected: boolean | null
  esCarrito?: boolean | null
  splitPayment?: boolean | null
  disenoAlternativo?: boolean | null
  direccion?: string | null
  direccionSoloTexto?: boolean | null
  colorPrimario?: string | null
  colorSecundario?: string | null
  usarColorUnico?: boolean | null
  username?: string | null
  telefono?: string | null
  comprobantesWhatsapp?: string | null
  transferenciaAlias?: string | null
  avisosWhatsappClienteEnabled?: boolean
  sistemaPuntos?: boolean | null
  configuracionPuntos?: RestaurantePublico['configuracionPuntos']
}

interface Producto extends ProductoTienda {
  precio: string
  categoriaId: number | null
}

interface Cliente {
  id: string
  nombre: string
  telefono?: string
}

interface Pedido {
  id: number
  mesaId: number
  restauranteId: number
  estado: string
  total: string
  createdAt: string
  nombrePedido?: string | null
}

interface ItemPedido {
  id: number
  productoId: number
  clienteNombre: string
  clienteTelefono?: string | null
  clienteId?: number | null
  cantidad: number
  precioUnitario: string
  nombreProducto?: string
  nombre?: string
  imagenUrl?: string | null
  nota?: string | null
}

// Datos del último pedido cerrado (para mostrar en la pantalla de factura)
interface PedidoCerradoData {
  items: ItemPedido[]
  total: string
  pedidoId: number
}

// Estado de pago de cada subtotal (split payment)
export interface SubtotalPagado {
  clienteNombre: string
  monto: string
  estado: 'pending' | 'pending_cash' | 'paid' | 'failed'
  metodo: 'efectivo' | 'mercadopago' | null
}

export interface MesaState {
  mesa: Mesa | null
  restaurante: Restaurante | null
  productos: Producto[]
  clientes: Cliente[]
  pedidoId: number | null
  pedido: Pedido | null
  clienteId: string | null
  clienteNombre: string | null
  clienteTelefono: string | null
  qrToken: string | null
  isLoading: boolean
  error: string | null
  // Datos del pedido cerrado para mostrar en factura
  pedidoCerrado: PedidoCerradoData | null
  // Estado de subtotales pagados (split payment)
  subtotalesPagados: SubtotalPagado[]
  // Indica si la sesión ha terminado (pagado) - no debe reconectar ni navegar
  sessionEnded: boolean
  // Flag para saber si el store ya se hidrató desde localStorage
  isHydrated: boolean
  // Modo carrito: indica si el pedido está listo para retirar
  pedidoListo: boolean
  // Checkout grupal (sala)
  checkoutDeliveryData: CheckoutDeliveryData | null
  checkoutEditSemaphore: CheckoutEditSemaphore | null
  setCheckoutDeliveryData: (data: CheckoutDeliveryData | null) => void
  setCheckoutEditSemaphore: (sem: CheckoutEditSemaphore | null) => void
  setMesa: (mesa: Mesa) => void
  setRestaurante: (restaurante: Restaurante | null) => void
  setProductos: (productos: Producto[]) => void
  setClientes: (clientes: Cliente[]) => void
  setPedidoId: (pedidoId: number) => void
  setPedido: (pedido: Pedido) => void
  setClienteInfo: (id: string, nombre: string, telefono?: string) => void
  setQrToken: (token: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPedidoCerrado: (data: PedidoCerradoData) => void
  clearPedidoCerrado: () => void
  setSubtotalesPagados: (subtotales: SubtotalPagado[]) => void
  endSession: () => void
  setHydrated: () => void
  setPedidoListo: (listo: boolean) => void
  reset: () => void
}

export const useMesaStore = create<MesaState>()(
  persist(
    (set) => ({
      mesa: null,
      restaurante: null,
      productos: [],
      clientes: [],
      pedidoId: null,
      pedido: null,
      clienteId: null,
      clienteNombre: null,
      clienteTelefono: null,
      qrToken: null,
      isLoading: false,
      error: null,
      pedidoCerrado: null,
      subtotalesPagados: [],
      sessionEnded: false,
      isHydrated: false,
      pedidoListo: false,
      checkoutDeliveryData: null,
      checkoutEditSemaphore: null,

      setCheckoutDeliveryData: (data) => set({ checkoutDeliveryData: data }),
      setCheckoutEditSemaphore: (sem) => set({ checkoutEditSemaphore: sem }),
      setMesa: (mesa) => set({ mesa }),
      setRestaurante: (restaurante) => set({ restaurante }),
      setProductos: (productos) => set({ productos }),
      setClientes: (clientes) => set({ clientes }),

      // CORRECCIÓN CRÍTICA: Al cambiar el ID del pedido, limpiar datos viejos
      setPedidoId: (pedidoId) => set((state) => {
        if (state.pedidoId !== pedidoId) {
          return {
            pedidoId,
            subtotalesPagados: [], // Limpiar pagos anteriores
            pedidoCerrado: null,   // Limpiar recibo anterior
            sessionEnded: false,
            pedidoListo: false
          }
        }
        return { pedidoId }
      }),

      setPedido: (pedido) => set({ pedido }),
      setClienteInfo: (id, nombre, telefono) => set({
        clienteId: id,
        clienteNombre: nombre,
        clienteTelefono: telefono || null,
      }),

      // CORRECCIÓN CRÍTICA: Al cambiar de mesa (QR), limpiar todo
      setQrToken: (token) => set((state) => {
        if (state.qrToken !== token) {
          return {
            qrToken: token,
            subtotalesPagados: [],
            pedidoCerrado: null,
            sessionEnded: false,
            pedidoListo: false
          }
        }
        return { qrToken: token }
      }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setPedidoCerrado: (data) => set({ pedidoCerrado: data }),
      clearPedidoCerrado: () => set({ pedidoCerrado: null }),
      setSubtotalesPagados: (subtotales) => set({ subtotalesPagados: subtotales }),
      endSession: () => set({ sessionEnded: true }),
      setHydrated: () => set({ isHydrated: true }),
      setPedidoListo: (listo) => set({ pedidoListo: listo }),
      reset: () => set({
        mesa: null,
        restaurante: null,
        productos: [],
        clientes: [],
        pedidoId: null,
        pedido: null,
        clienteId: null,
        clienteNombre: null,
        clienteTelefono: null,
        qrToken: null,
        isLoading: false,
        error: null,
        pedidoCerrado: null,
        subtotalesPagados: [],
        sessionEnded: false,
        pedidoListo: false,
      }),
    }),
    {
      name: 'piru-mesa-storage',
      // Solo persistir los datos críticos que necesitamos después de recargas
      // NO persistir estados de pago (subtotalesPagados, sessionEnded) porque son específicos del pedido actual
      partialize: (state) => ({
        clienteId: state.clienteId,
        clienteNombre: state.clienteNombre,
        clienteTelefono: state.clienteTelefono,
        qrToken: state.qrToken,
        pedidoId: state.pedidoId,
        mesa: state.mesa,
        restaurante: state.restaurante,
        pedido: state.pedido,
        productos: state.productos,
        pedidoCerrado: state.pedidoCerrado,
      }),
      onRehydrateStorage: () => (state) => {
        // Marcar como hidratado cuando termine de cargar desde localStorage
        if (state) {
          // Limpiar estados de pago al rehidratar - siempre empezar limpio
          state.subtotalesPagados = []
          state.sessionEnded = false
          state.pedidoListo = false
          state.setHydrated()
        }
      },
    }
  )
)

// Marcar como hidratado después de un breve delay si onRehydrateStorage no lo hizo
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useMesaStore.getState().isHydrated) {
      useMesaStore.getState().setHydrated()
    }
  }, 100)
}
