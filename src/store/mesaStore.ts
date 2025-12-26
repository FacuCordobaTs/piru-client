import { create } from 'zustand'

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
  setMesa: (mesa: Mesa) => void
  setProductos: (productos: Producto[]) => void
  setClientes: (clientes: Cliente[]) => void
  setPedidoId: (pedidoId: number) => void
  setPedido: (pedido: Pedido) => void
  setClienteInfo: (id: string, nombre: string) => void
  setQrToken: (token: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useMesaStore = create<MesaState>((set) => ({
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

  setMesa: (mesa) => set({ mesa }),
  setProductos: (productos) => set({ productos }),
  setClientes: (clientes) => set({ clientes }),
  setPedidoId: (pedidoId) => set({ pedidoId }),
  setPedido: (pedido) => set({ pedido }),
  setClienteInfo: (id, nombre) => set({ clienteId: id, clienteNombre: nombre }),
  setQrToken: (token) => set({ qrToken: token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
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
  }),
}))

