import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Mesa {
  id: number
  nombre: string
  qrToken: string
  restauranteId: number
}

interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio: string
  imagenUrl: string | null
  categoria?: string
}

interface Cliente {
  id: string
  nombre: string
}

interface Pedido {
  id: number
  mesaId: number
  restauranteId: number
  estado: string
  total: string
  createdAt: string
}

interface ItemPedido {
  id: number
  productoId: number
  clienteNombre: string
  cantidad: number
  precioUnitario: string
  nombreProducto?: string
  nombre?: string
  imagenUrl?: string | null
}

// Datos del último pedido cerrado (para mostrar en la pantalla de factura)
interface PedidoCerradoData {
  items: ItemPedido[]
  total: string
  pedidoId: number
}

interface MesaState {
  mesa: Mesa | null
  productos: Producto[]
  clientes: Cliente[]
  pedidoId: number | null
  pedido: Pedido | null
  clienteId: string | null
  clienteNombre: string | null
  qrToken: string | null
  isLoading: boolean
  error: string | null
  // Datos del pedido cerrado para mostrar en factura
  pedidoCerrado: PedidoCerradoData | null
  // Indica si la sesión ha terminado (pagado) - no debe reconectar ni navegar
  sessionEnded: boolean
  // Flag para saber si el store ya se hidrató desde localStorage
  isHydrated: boolean
  setMesa: (mesa: Mesa) => void
  setProductos: (productos: Producto[]) => void
  setClientes: (clientes: Cliente[]) => void
  setPedidoId: (pedidoId: number) => void
  setPedido: (pedido: Pedido) => void
  setClienteInfo: (id: string, nombre: string) => void
  setQrToken: (token: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPedidoCerrado: (data: PedidoCerradoData) => void
  clearPedidoCerrado: () => void
  endSession: () => void
  setHydrated: () => void
  reset: () => void
}

export const useMesaStore = create<MesaState>()(
  persist(
    (set) => ({
      mesa: null,
      productos: [],
      clientes: [],
      pedidoId: null,
      pedido: null,
      clienteId: null,
      clienteNombre: null,
      qrToken: null,
      isLoading: false,
      error: null,
      pedidoCerrado: null,
      sessionEnded: false,
      isHydrated: false,

      setMesa: (mesa) => set({ mesa }),
      setProductos: (productos) => set({ productos }),
      setClientes: (clientes) => set({ clientes }),
      setPedidoId: (pedidoId) => set({ pedidoId }),
      setPedido: (pedido) => set({ pedido }),
      setClienteInfo: (id, nombre) => set({ clienteId: id, clienteNombre: nombre }),
      setQrToken: (token) => set({ qrToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setPedidoCerrado: (data) => set({ pedidoCerrado: data }),
      clearPedidoCerrado: () => set({ pedidoCerrado: null }),
      endSession: () => set({ sessionEnded: true }),
      setHydrated: () => set({ isHydrated: true }),
      reset: () => set({
        mesa: null,
        productos: [],
        clientes: [],
        pedidoId: null,
        clienteId: null,
        clienteNombre: null,
        qrToken: null,
        isLoading: false,
        error: null,
        pedidoCerrado: null,
        sessionEnded: false,
      }),
    }),
    {
      name: 'piru-mesa-storage',
      // Solo persistir los datos críticos que necesitamos después de recargas
      partialize: (state) => ({
        clienteId: state.clienteId,
        clienteNombre: state.clienteNombre,
        qrToken: state.qrToken,
        pedidoId: state.pedidoId,
        mesa: state.mesa,
        pedido: state.pedido,
        productos: state.productos,
        pedidoCerrado: state.pedidoCerrado,
        sessionEnded: state.sessionEnded,
      }),
      onRehydrateStorage: () => (state) => {
        // Marcar como hidratado cuando termine de cargar desde localStorage
        if (state) {
          state.setHydrated()
        }
      },
    }
  )
)

// Marcar como hidratado después de un breve delay si onRehydrateStorage no lo hizo
// Esto cubre edge cases donde la hidratación falla o no hay datos
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useMesaStore.getState().isHydrated) {
      useMesaStore.getState().setHydrated()
    }
  }, 100)
}

