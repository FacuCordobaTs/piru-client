import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { useMesaStore } from '@/store/mesaStore'
import type { SubtotalPagado } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import { toast } from 'sonner'
import { Receipt, DollarSign, CreditCard, Sparkles, Loader2, CheckCircle2, Users } from 'lucide-react'
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
    
    // Si no hay datos del pedido cerrado y el estado no es 'closed', redirigir
    if (!pedidoCerrado && wsState?.estado && wsState.estado !== 'closed') {
      if (wsState.estado === 'preparing') {
        navigate('/pedido-confirmado')
      } else if (wsState.estado === 'pending') {
        navigate('/menu')
      }
    }
  }, [clienteNombre, qrToken, wsState?.estado, pedidoCerrado, navigate, todoPagado, sessionEnded, isHydrated])

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
    const clientesPendientes = subtotales.filter(s => !s.pagado).map(s => s.clienteNombre)
    setSelectedClientes(clientesPendientes)
  }

  // Calcular total seleccionado
  const totalSeleccionado = subtotales
    .filter(s => selectedClientes.includes(s.clienteNombre))
    .reduce((sum, s) => sum + s.subtotal, 0)

  const handlePagarEfectivo = async () => {
    if (selectedClientes.length === 0) {
      toast.error('Selecciona al menos un cliente para pagar')
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
          description: `${selectedClientes.join(', ')} - Acércate a la caja para abonar`
        })
        setSelectedClientes([])
        // Recargar estado de subtotales
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
      toast.error('Selecciona al menos un cliente para pagar')
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
        // Redirigir a MercadoPago
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

  // Componente de recibo/factura con selección de subtotales
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
                  {showPaymentSelection && !clienteData.pagado && (
                    <Checkbox
                      id={`cliente-${clienteData.clienteNombre}`}
                      checked={selectedClientes.includes(clienteData.clienteNombre)}
                      onCheckedChange={() => handleToggleCliente(clienteData.clienteNombre)}
                      className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                    />
                  )}
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
      <div className="min-h-screen bg-linear-to-b from-neutral-100 to-neutral-200 dark:from-neutral-950 dark:to-neutral-900 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Mensaje de agradecimiento */}
          <div className="text-center px-6 space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-2">
              <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              ¡Gracias por tu visita!
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Esperamos que hayas disfrutado. ¡Vuelve pronto!
            </p>
          </div>

          {/* Recibo sin selección */}
          <ReceiptCard showPaymentSelection={false} />

          {/* Mensaje final */}
          <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 px-6">
            Puedes cerrar esta pestaña
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-100 to-neutral-200 dark:from-neutral-950 dark:to-neutral-900 py-8 pb-32">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center px-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-neutral-900 dark:bg-white mb-2">
            <Receipt className="w-7 h-7 text-white dark:text-neutral-900" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Tu cuenta</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Selecciona quién paga y elige el método
          </p>
        </div>

        {/* Loading */}
        {loadingSubtotales && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        )}

        {/* Recibo con selección */}
        <ReceiptCard showPaymentSelection={true} />

        {/* Métodos de Pago */}
        <div className="px-4 space-y-3">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-2">
            Método de pago {selectedClientes.length > 0 && `(${selectedClientes.length} seleccionados)`}
          </p>
          
          <Button
            onClick={handlePagarEfectivo}
            disabled={selectedClientes.length === 0 || isLoadingEfectivo}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 shadow-lg disabled:opacity-50"
          >
            {isLoadingEfectivo ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5 mr-2" />
                Pagar en Efectivo
                {selectedClientes.length > 0 && ` ($${totalSeleccionado.toFixed(2)})`}
              </>
            )}
          </Button>

          <Button
            onClick={handlePagarMercadoPago}
            variant="outline"
            className={`w-full h-14 text-base font-semibold rounded-2xl border-2 ${
              mpDisponible && selectedClientes.length > 0
                ? 'border-sky-500 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950' 
                : ''
            }`}
            disabled={!mpDisponible || isLoadingMP || selectedClientes.length === 0}
          >
            {isLoadingMP ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Preparando pago...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                MercadoPago
                {selectedClientes.length > 0 && ` ($${totalSeleccionado.toFixed(2)})`}
                {!mpDisponible && (
                  <span className="ml-2 text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-500">
                    No disponible
                  </span>
                )}
              </>
            )}
          </Button>

          {selectedClientes.length === 0 && (
            <p className="text-xs text-center text-neutral-400 px-4">
              Selecciona al menos un cliente para habilitar los métodos de pago
            </p>
          )}
        </div>
      </div>

      {/* Dialog para prevenir navegación hacia atrás */}
      <ExitDialog />
    </div>
  )
}

export default PedidoCerrado
