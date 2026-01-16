import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useMesaStore } from '@/store/mesaStore'
import type { SubtotalPagado } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import { toast } from 'sonner'
import { 
  Receipt, DollarSign, CreditCard, Sparkles, Loader2, CheckCircle2, 
  Users, Wallet, Split, Check, UserCheck
} from 'lucide-react'
import { usePreventBackNavigation } from '@/hooks/usePreventBackNavigation'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.piru.app/api'

// Interface para el estado de subtotales del cliente
interface SubtotalCliente {
  clienteNombre: string
  subtotal: number
  items: typeof todosLosItems
  pagado: boolean
  metodo?: string
}

// Variable para tipar los items (se usará más adelante)
let todosLosItems: Array<{
  id: number
  productoId: number
  clienteNombre: string
  cantidad: number
  precioUnitario: string
  nombreProducto?: string
  nombre?: string
}>

const PedidoCerrado = () => {
  const navigate = useNavigate()
  const { 
    mesa, clienteNombre, qrToken, pedidoCerrado, restaurante, pedidoId,
    sessionEnded, isHydrated, subtotalesPagados
  } = useMesaStore()
  const { state: wsState } = useClienteWebSocket()
  const [isLoadingMP, setIsLoadingMP] = useState(false)
  const [isLoadingEfectivo, setIsLoadingEfectivo] = useState(false)
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [subtotalesEstado, setSubtotalesEstado] = useState<SubtotalPagado[]>([])
  const [loadingSubtotales, setLoadingSubtotales] = useState(false)
  
  // Verificar si MercadoPago está disponible
  const mpDisponible = restaurante?.mpConnected === true

  // Usar datos del pedido cerrado del store (persistido) o del wsState como fallback
  todosLosItems = pedidoCerrado?.items || wsState?.items || []
  const totalPedido = pedidoCerrado?.total || wsState?.total || '0.00'

  // Agrupar items por cliente y calcular subtotales
  const subtotalesPorCliente = useCallback((): SubtotalCliente[] => {
    const itemsPorCliente = todosLosItems.reduce((acc, item) => {
      const cliente = item.clienteNombre || 'Sin nombre'
      if (!acc[cliente]) acc[cliente] = []
      acc[cliente].push(item)
      return acc
    }, {} as Record<string, typeof todosLosItems>)

    return Object.entries(itemsPorCliente).map(([cliente, items]) => {
      const subtotal = items.reduce((sum, item) => {
        return sum + (parseFloat(item.precioUnitario || '0') * item.cantidad)
      }, 0)

      // Verificar si este cliente ya pagó (desde WebSocket o desde estado local)
      const estadoSubtotal = subtotalesEstado.find(s => s.clienteNombre === cliente)
      const subtotalWS = subtotalesPagados.find(s => s.clienteNombre === cliente)
      const pagado = estadoSubtotal?.estado === 'paid' || subtotalWS?.estado === 'paid'
      const metodo = estadoSubtotal?.metodo || subtotalWS?.metodo

      return {
        clienteNombre: cliente,
        subtotal,
        items,
        pagado,
        metodo: metodo || undefined
      }
    })
  }, [todosLosItems, subtotalesEstado, subtotalesPagados])

  // Calcular totales
  const subtotales = subtotalesPorCliente()
  const totalPagado = subtotales.filter(s => s.pagado).reduce((sum, s) => sum + s.subtotal, 0)
  const totalPendiente = parseFloat(totalPedido) - totalPagado
  const todoPagado = totalPendiente <= 0.01 // Pequeño margen para evitar errores de redondeo
  const clientesPendientes = subtotales.filter(s => !s.pagado)
  const clientesPagados = subtotales.filter(s => s.pagado)

  // Hook para prevenir navegación hacia atrás (solo si no está todo pagado)
  const { ExitDialog } = usePreventBackNavigation(!todoPagado && !sessionEnded)

  // Cargar estado de subtotales desde el servidor
  const fetchSubtotales = useCallback(async () => {
    const idPedido = pedidoCerrado?.pedidoId || pedidoId
    if (!idPedido) return

    setLoadingSubtotales(true)
    try {
      const response = await fetch(`${API_URL}/mp/subtotales/${idPedido}`)
      const data = await response.json()

      if (data.success && data.subtotales) {
        setSubtotalesEstado(data.subtotales.map((s: any) => ({
          clienteNombre: s.clienteNombre,
          monto: s.subtotal,
          estado: s.pagado ? 'paid' : 'pending',
          metodo: s.metodo
        })))
      }
    } catch (error) {
      console.error('Error al cargar subtotales:', error)
    } finally {
      setLoadingSubtotales(false)
    }
  }, [pedidoCerrado?.pedidoId, pedidoId])

  // Cargar subtotales al montar
  useEffect(() => {
    fetchSubtotales()
  }, [fetchSubtotales])

  // Actualizar estado cuando lleguen actualizaciones por WebSocket
  useEffect(() => {
    if (subtotalesPagados.length > 0) {
      setSubtotalesEstado(subtotalesPagados)
    }
  }, [subtotalesPagados])

  useEffect(() => {
    // Si ya se pagó todo o la sesión terminó, no hacer nada
    if (todoPagado || sessionEnded) return
    
    // Esperar a que el store se hidrate
    if (!isHydrated) return
    
    // Si no hay datos del cliente, redirigir a escanear QR
    if (!clienteNombre || !qrToken) {
      navigate(`/mesa/${qrToken || 'invalid'}`)
      return
    }
    
    // Verificar si el pedidoCerrado corresponde al pedido actual
    // Si el pedidoId del store es diferente al pedidoCerrado.pedidoId, los datos son obsoletos
    // Esto puede pasar si el usuario escanea el QR de nuevo después de que se creó un nuevo pedido
    const pedidoCerradoEsActual = pedidoCerrado && pedidoCerrado.pedidoId === pedidoId
    
    // Si tenemos datos del pedido cerrado pero son de un pedido diferente al actual,
    // el usuario está en la página incorrecta - redirigir según el estado del pedido actual
    if (pedidoCerrado && !pedidoCerradoEsActual && wsState?.estado) {
      console.log('Datos de pedidoCerrado obsoletos, redirigiendo...', {
        pedidoCerradoId: pedidoCerrado.pedidoId,
        pedidoIdActual: pedidoId,
        estadoActual: wsState.estado
      })
      if (wsState.estado === 'preparing') {
        navigate('/pedido-confirmado')
      } else if (wsState.estado === 'pending') {
        navigate('/menu')
      } else if (wsState.estado === 'closed') {
        // El pedido actual también está cerrado, quedarse aquí
        return
      }
      return
    }
    
    // Si no hay datos del pedido cerrado y el estado no es 'closed', redirigir
    if (!pedidoCerrado && wsState?.estado && wsState.estado !== 'closed') {
      if (wsState.estado === 'preparing') {
        navigate('/pedido-confirmado')
      } else if (wsState.estado === 'pending') {
        navigate('/menu')
      }
    }
  }, [clienteNombre, qrToken, wsState?.estado, pedidoCerrado, pedidoId, navigate, todoPagado, sessionEnded, isHydrated])

  // Manejar selección de cliente
  const handleToggleCliente = (cliente: string) => {
    setSelectedClientes(prev => 
      prev.includes(cliente) 
        ? prev.filter(c => c !== cliente)
        : [...prev, cliente]
    )
  }

  // Seleccionar todos los clientes pendientes
  const handleSelectAllPendientes = () => {
    const pendientes = subtotales.filter(s => !s.pagado).map(s => s.clienteNombre)
    setSelectedClientes(pendientes)
  }

  // Seleccionar solo al cliente actual
  const handleSelectMiParte = () => {
    if (clienteNombre && !subtotales.find(s => s.clienteNombre === clienteNombre)?.pagado) {
      setSelectedClientes([clienteNombre])
    }
  }

  // Calcular total seleccionado
  const totalSeleccionado = subtotales
    .filter(s => selectedClientes.includes(s.clienteNombre))
    .reduce((sum, s) => sum + s.subtotal, 0)

  const handlePagarEfectivo = async () => {
    if (selectedClientes.length === 0) {
      toast.error('Selecciona al menos una persona para pagar')
      return
    }

    const idPedido = pedidoCerrado?.pedidoId || pedidoId
    if (!idPedido) {
      toast.error('Error', { description: 'No se pudo obtener la información del pedido' })
      return
    }

    setIsLoadingEfectivo(true)

    try {
      const response = await fetch(`${API_URL}/mp/pagar-efectivo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: idPedido,
          clientesAPagar: selectedClientes,
          qrToken
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('¡Pago registrado!', {
          description: `Acércate a la caja para abonar $${totalSeleccionado.toFixed(2)}`
        })
        setSelectedClientes([])
        await fetchSubtotales()
      } else {
        toast.error('Error al registrar pago', { description: data.error })
      }
    } catch (error) {
      console.error('Error al registrar pago en efectivo:', error)
      toast.error('Error de conexión')
    } finally {
      setIsLoadingEfectivo(false)
    }
  }

  const handlePagarMercadoPago = async () => {
    if (selectedClientes.length === 0) {
      toast.error('Selecciona al menos una persona para pagar')
      return
    }

    const idPedido = pedidoCerrado?.pedidoId || pedidoId
    
    if (!idPedido) {
      toast.error('Error', { description: 'No se pudo obtener la información del pedido' })
      return
    }

    setIsLoadingMP(true)
    
    try {
      const response = await fetch(`${API_URL}/mp/crear-preferencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: idPedido,
          qrToken: qrToken,
          clientesAPagar: selectedClientes
        })
      })

      const data = await response.json()

      if (data.success && data.url_pago) {
        window.location.href = data.url_pago
      } else {
        toast.error('Error al procesar pago', {
          description: data.error || 'No se pudo crear el link de pago'
        })
      }
    } catch (error) {
      console.error('Error al crear preferencia de pago:', error)
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor de pagos'
      })
    } finally {
      setIsLoadingMP(false)
    }
  }

  // Verificar si el cliente actual ya pagó
  const miPartePagada = subtotales.find(s => s.clienteNombre === clienteNombre)?.pagado || false
  const miParte = subtotales.find(s => s.clienteNombre === clienteNombre)

  const ReceiptCard = ({ showPaymentSelection = false }: { showPaymentSelection?: boolean }) => (
    <div className="bg-white text-neutral-900 rounded-2xl shadow-xl overflow-hidden mx-4">
      {/* Header del recibo */}
      <div className="bg-neutral-50 px-6 py-5 text-center border-b border-dashed border-neutral-200">
        {restaurante?.imagenUrl ? (
          <img 
            src={restaurante.imagenUrl} 
            alt={restaurante.nombre || 'Restaurante'}
            className="w-14 h-14 rounded-xl object-cover mx-auto mb-3"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-neutral-900 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-7 h-7 text-white" />
          </div>
        )}
        <h2 className="font-bold text-lg text-neutral-900">
          {restaurante?.nombre || 'Restaurante'}
        </h2>
        <p className="text-sm text-neutral-500 mt-1">Mesa {mesa?.nombre}</p>
      </div>

      {/* Lista de productos agrupados por usuario con checkboxes */}
      <div className="px-6 py-4">
        {showPaymentSelection && subtotales.filter(s => !s.pagado).length > 1 && (
          <button
            onClick={handleSelectAllPendientes}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium mb-3 flex items-center gap-1"
          >
            <Users className="w-3 h-3" />
            Seleccionar todos los pendientes
          </button>
        )}
        
        <div className="space-y-4">
          {subtotales.map((clienteData, idx) => (
            <div key={clienteData.clienteNombre} className="space-y-2">
              {/* Header del cliente con checkbox */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor={`cliente-${clienteData.clienteNombre}`}
                    className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-2 ${
                      clienteData.pagado ? 'text-emerald-600' : 'text-neutral-500'
                    } ${showPaymentSelection && !clienteData.pagado ? 'cursor-pointer' : ''}`}
                  >
                    {clienteData.clienteNombre}
                    {clienteData.pagado && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium normal-case">
                        <CheckCircle2 className="w-3 h-3" />
                        Pagado {clienteData.metodo === 'mercadopago' ? '(MP)' : '(Efectivo)'}
                      </span>
                    )}
                  </label>
                </div>
              </div>
              
              {/* Productos del cliente */}
              <div className={clienteData.pagado ? 'opacity-50' : ''}>
                {clienteData.items.map((item) => {
                  const precio = parseFloat(item.precioUnitario || '0')
                  const subtotalItem = precio * item.cantidad

                  return (
                    <div key={item.id} className="flex justify-between items-start gap-4 ml-6">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-neutral-900 leading-tight">
                          {item.nombreProducto || item.nombre}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {item.cantidad} × ${precio.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-neutral-900 tabular-nums">
                        ${subtotalItem.toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
              
              {/* Subtotal del cliente */}
              <div className={`flex justify-between items-center pt-1 border-t border-neutral-100 ml-6 ${
                clienteData.pagado ? 'opacity-50' : ''
              }`}>
                <span className="text-xs text-neutral-500">Subtotal {clienteData.clienteNombre}</span>
                <span className={`text-sm font-semibold tabular-nums ${
                  clienteData.pagado ? 'text-emerald-600 line-through' : 'text-neutral-700'
                }`}>
                  ${clienteData.subtotal.toFixed(2)}
                </span>
              </div>
              
              {/* Separador entre clientes */}
              {idx < subtotales.length - 1 && <div className="pt-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Separador estilo ticket */}
      <div className="relative px-6">
        <div className="absolute left-0 w-4 h-4 bg-neutral-100 dark:bg-neutral-950 rounded-full -translate-x-1/2" />
        <div className="absolute right-0 w-4 h-4 bg-neutral-100 dark:bg-neutral-950 rounded-full translate-x-1/2" />
        <Separator className="border-dashed" />
      </div>

      {/* Resumen de totales */}
      <div className="px-6 py-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-500">Total del pedido</span>
          <span className="font-semibold text-neutral-900">${totalPedido}</span>
        </div>
        {totalPagado > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-emerald-600">Ya pagado</span>
            <span className="font-semibold text-emerald-600">-${totalPagado.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
          <span className="text-base font-bold text-neutral-900">
            {todoPagado ? 'PAGADO' : 'PENDIENTE'}
          </span>
          <span className={`text-2xl font-black ${todoPagado ? 'text-emerald-600' : 'text-neutral-900'}`}>
            ${todoPagado ? '0.00' : totalPendiente.toFixed(2)}
          </span>
        </div>
        {showPaymentSelection && selectedClientes.length > 0 && (
          <div className="flex justify-between items-center pt-2 border-t border-sky-100 bg-sky-50 -mx-6 px-6 py-3 mt-2">
            <span className="text-sm font-medium text-sky-700">
              Seleccionado ({selectedClientes.length})
            </span>
            <span className="text-lg font-bold text-sky-700">
              ${totalSeleccionado.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Footer del recibo */}
      <div className="bg-neutral-50 px-6 py-4 text-center border-t border-dashed border-neutral-200">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
          Powered by Piru
        </p>
      </div>
    </div>
  )

  // Pantalla cuando todo está pagado
  if (todoPagado || sessionEnded) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-md mx-auto space-y-6 px-4">
          {/* Mensaje de agradecimiento */}
          <div className="text-center space-y-4 py-8">
            <div className="relative inline-flex">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 shadow-lg">
                <Sparkles className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-green-700 to-green-500 bg-clip-text text-transparent dark:from-green-400 dark:to-green-200">
              ¡Gracias por tu visita!
            </h1>
            <p className="text-muted-foreground">
              Esperamos que hayas disfrutado. ¡Vuelve pronto!
            </p>
          </div>

          {/* Resumen final */}
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
            <div className="bg-green-600 dark:bg-green-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6" />
                  <span className="font-semibold">Cuenta cerrada</span>
                </div>
                <span className="font-bold text-lg">${totalPedido}</span>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {subtotales.map((cliente) => (
                <div key={cliente.clienteNombre} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium text-foreground">
                      {cliente.clienteNombre}
                    </span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${cliente.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Puedes cerrar esta pestaña
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header sticky */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {restaurante?.imagenUrl ? (
                <img 
                  src={restaurante.imagenUrl} 
                  alt={restaurante.nombre || 'Restaurante'}
                  className="w-10 h-10 rounded-xl object-cover border border-border shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-sm text-foreground">{restaurante?.nombre || 'Restaurante'}</h2>
                <p className="text-xs text-muted-foreground">Mesa {mesa?.nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50">
              <Split className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Dividir cuenta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de bienvenida */}
      <div className="max-w-md mx-auto px-5 pt-6 space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Tu cuenta,</p>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-orange-800 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-200">
            {clienteNombre}
          </h1>
        </div>

        {/* Barra de progreso de pagos */}
        {subtotales.length > 1 && (
          <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progreso de pagos</span>
              <span className="font-semibold text-foreground">
                {clientesPagados.length}/{subtotales.length} pagados
              </span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(totalPagado / parseFloat(totalPedido)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loadingSubtotales && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      <div className="max-w-md mx-auto px-5 py-6 space-y-6 pb-48">
        
        {/* Acciones rápidas */}
        {clientesPendientes.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {/* Botón "Pagar mi parte" - destacado si el cliente actual no ha pagado */}
            {miParte && !miPartePagada && (
              <button
                onClick={handleSelectMiParte}
                className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all active:scale-95 ${
                  selectedClientes.length === 1 && selectedClientes[0] === clienteNombre
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-card   border-primary/20 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedClientes.length === 1 && selectedClientes[0] === clienteNombre
                      ? 'bg-white/20'
                      : 'bg-primary/10'
                  }`}>
                    <UserCheck className={`w-5 h-5 ${
                      selectedClientes.length === 1 && selectedClientes[0] === clienteNombre
                        ? 'text-primary-foreground'
                        : 'text-primary'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${
                      selectedClientes.length === 1 && selectedClientes[0] === clienteNombre
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }`}>
                      Pagar mi parte
                    </p>
                    <p className={`text-lg font-bold ${
                      selectedClientes.length === 1 && selectedClientes[0] === clienteNombre
                        ? 'text-primary-foreground'
                        : 'text-primary'
                    }`}>
                      ${miParte.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Botón "Pagar todo" */}
            {clientesPendientes.length > 1 && (
              <button
                onClick={handleSelectAllPendientes}
                className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all active:scale-95 ${
                  selectedClientes.length === clientesPendientes.length && selectedClientes.length > 0
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                    : 'bg-card border-orange-200 dark:border-orange-800/50 hover:border-orange-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedClientes.length === clientesPendientes.length && selectedClientes.length > 0
                      ? 'bg-white/20'
                      : 'bg-orange-100 dark:bg-orange-900/30'
                  }`}>
                    <Users className={`w-5 h-5 ${
                      selectedClientes.length === clientesPendientes.length && selectedClientes.length > 0
                        ? 'text-white'
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${
                      selectedClientes.length === clientesPendientes.length && selectedClientes.length > 0
                        ? 'text-white'
                        : 'text-foreground'
                    }`}>
                      Pagar todo
                    </p>
                    <p className={`text-lg font-bold ${
                      selectedClientes.length === clientesPendientes.length && selectedClientes.length > 0
                        ? 'text-white'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      ${totalPendiente.toFixed(2)}
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Sección de selección de personas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Seleccionar personas
            </h3>
            {selectedClientes.length > 0 && (
              <button 
                onClick={() => setSelectedClientes([])}
                className="text-sm text-primary hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Lista de clientes pendientes */}
          <div className="space-y-3">
            {clientesPendientes.map((cliente) => {
              const isSelected = selectedClientes.includes(cliente.clienteNombre)
              const isCurrentUser = cliente.clienteNombre === clienteNombre

              return (
                <button
                  key={cliente.clienteNombre}
                  onClick={() => handleToggleCliente(cliente.clienteNombre)}
                  className={`w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-card border border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox visual */}
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-white border-white'
                        : 'border-border'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    
                    {/* Info del cliente */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                          {cliente.clienteNombre}
                        </span>
                        {isCurrentUser && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isSelected
                              ? 'bg-white/20 text-primary-foreground'
                              : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          }`}>
                            Tú
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {cliente.items.length} producto{cliente.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Monto */}
                    <span className={`text-xl font-bold tabular-nums ${
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      ${cliente.subtotal.toFixed(2)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Clientes que ya pagaron */}
          {clientesPagados.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Ya pagaron
              </p>
              {clientesPagados.map((cliente) => (
                <div
                  key={cliente.clienteNombre}
                  className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-4 border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        {cliente.clienteNombre}
                      </span>
                      <p className="text-xs text-green-600/70 dark:text-green-400/70">
                        {cliente.metodo === 'mercadopago' ? 'MercadoPago' : 'Efectivo'}
                      </p>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400 line-through opacity-60">
                      ${cliente.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        
      <ReceiptCard />
      </div>

      {/* Panel de pago fijo en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-md mx-auto px-5 py-4 space-y-3">
          {/* Resumen de selección */}
          {selectedClientes.length > 0 ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedClientes.length === 1 
                    ? selectedClientes[0]
                    : `${selectedClientes.length} personas`
                  }
                </p>
                <p className="text-2xl font-black tracking-tight text-foreground">
                  ${totalSeleccionado.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center">
                {selectedClientes.slice(0, 4).map((nombre, i) => (
                  <div 
                    key={nombre}
                    className="w-9 h-9 rounded-xl border-2 border-background shadow-sm bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold"
                    style={{ marginLeft: i > 0 ? '-8px' : '0' }}
                  >
                    {nombre.slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {selectedClientes.length > 4 && (
                  <div 
                    className="w-9 h-9 rounded-xl border-2 border-background shadow-sm bg-secondary text-foreground flex items-center justify-center text-xs font-bold"
                    style={{ marginLeft: '-8px' }}
                  >
                    +{selectedClientes.length - 4}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-2">
              Selecciona quién va a pagar
            </p>
          )}

          {/* Botones de pago */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handlePagarEfectivo}
              disabled={selectedClientes.length === 0 || isLoadingEfectivo}
              className="h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20"
              size="lg"
            >
              {isLoadingEfectivo ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <DollarSign className="w-5 h-5 mr-2" />
                  Efectivo
                </>
              )}
            </Button>

            <Button
              onClick={handlePagarMercadoPago}
              disabled={!mpDisponible || isLoadingMP || selectedClientes.length === 0}
              className={`h-14 text-base font-bold rounded-2xl border-2 ${
                mpDisponible && selectedClientes.length > 0
                  ? 'bg-sky-500 text-white' 
                  : ''
              }`}
              size="lg"
            >
              {isLoadingMP ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {mpDisponible ? 'MercadoPago' : 'No disponible'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog para prevenir navegación hacia atrás */}
      <ExitDialog />
    </div>
  )
}

export default PedidoCerrado