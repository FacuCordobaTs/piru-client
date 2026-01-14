import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useMesaStore } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import { toast } from 'sonner'
import { Receipt, DollarSign, CreditCard, Banknote, Sparkles, Loader2 } from 'lucide-react'
import { usePreventBackNavigation } from '@/hooks/usePreventBackNavigation'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.piru.app/api'

const PedidoCerrado = () => {
  const navigate = useNavigate()
  const { 
    mesa, clienteNombre, qrToken, pedidoCerrado, restaurante, pedidoId,
    sessionEnded, isHydrated 
  } = useMesaStore()
  const { state: wsState, sendMessage } = useClienteWebSocket()
  const  pagado = false;
  const [isLoadingMP, setIsLoadingMP] = useState(false)
  
  // Verificar si MercadoPago está disponible
  const mpDisponible = restaurante?.mpConnected === true

  // Hook para prevenir navegación hacia atrás (solo si no está pagado)
  const { ExitDialog } = usePreventBackNavigation(!pagado && !sessionEnded)

  useEffect(() => {
    // Si ya se pagó o la sesión terminó, no hacer nada
    if (pagado || sessionEnded) return
    
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
  }, [clienteNombre, qrToken, wsState?.estado, pedidoCerrado, navigate, pagado, sessionEnded, isHydrated])

  // Usar datos del pedido cerrado del store (persistido) o del wsState como fallback
  const todosLosItems = pedidoCerrado?.items || wsState?.items || []
  const totalPedido = pedidoCerrado?.total || wsState?.total || '0.00'

  const handlePagarEfectivo = () => {
    // Enviar mensaje de pago - el backend hará broadcast a todos los clientes
    // y el handler de WebSocket redirigirá a /factura
    sendMessage({ 
      type: 'PAGAR_PEDIDO', 
      payload: { 
        metodo: 'efectivo',
        total: totalPedido 
      } 
    })
    
    toast.success('¡Listo!', {
      description: 'Redirigiendo a la factura...',
    })
  }

  const handlePagarMercadoPago = async () => {
    // Obtener el ID del pedido
    const idPedido = pedidoCerrado?.pedidoId || pedidoId
    
    if (!idPedido) {
      toast.error('Error', {
        description: 'No se pudo obtener la información del pedido',
      })
      return
    }

    setIsLoadingMP(true)
    
    try {
      const response = await fetch(`${API_URL}/mp/crear-preferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pedidoId: idPedido,
          qrToken: qrToken,
        }),
      })

      const data = await response.json()

      if (data.success && data.url_pago) {
        // Redirigir a MercadoPago
        window.location.href = data.url_pago
      } else {
        toast.error('Error al procesar pago', {
          description: data.error || 'No se pudo crear el link de pago',
        })
      }
    } catch (error) {
      console.error('Error al crear preferencia de pago:', error)
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor de pagos',
      })
    } finally {
      setIsLoadingMP(false)
    }
  }

  // Componente de recibo/factura reutilizable
  const ReceiptCard = ({ showPaymentInfo = false }: { showPaymentInfo?: boolean }) => (
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

      {/* Lista de productos agrupados por usuario */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {(() => {
            // Agrupar items por cliente
            const itemsPorCliente = todosLosItems.reduce((acc, item) => {
              const cliente = item.clienteNombre || 'Sin nombre'
              if (!acc[cliente]) acc[cliente] = []
              acc[cliente].push(item)
              return acc
            }, {} as Record<string, typeof todosLosItems>)

            return Object.entries(itemsPorCliente).map(([cliente, items], idx) => {
              const subtotalCliente = items.reduce((sum, item) => {
                return sum + (parseFloat(item.precioUnitario || '0') * item.cantidad)
              }, 0)

              return (
                <div key={cliente} className="space-y-2">
                  {/* Nombre del cliente */}
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {cliente}
                  </p>
                  
                  {/* Productos del cliente */}
                  {items.map((item) => {
                    const precio = parseFloat(item.precioUnitario || '0')
                    const subtotal = precio * item.cantidad

                    return (
                      <div key={item.id} className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-neutral-900 leading-tight">
                            {item.nombreProducto || item.nombre}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {item.cantidad} × ${precio.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-sm text-neutral-900 tabular-nums">
                          ${subtotal.toFixed(2)}
                        </p>
                      </div>
                    )
                  })}
                  
                  {/* Subtotal del cliente */}
                  <div className="flex justify-between items-center pt-1 border-t border-neutral-100">
                    <span className="text-xs text-neutral-500">Subtotal {cliente}</span>
                    <span className="text-sm font-semibold text-neutral-700 tabular-nums">
                      ${subtotalCliente.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Separador entre clientes (excepto el último) */}
                  {idx < Object.keys(itemsPorCliente).length - 1 && (
                    <div className="pt-2" />
                  )}
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* Separador estilo ticket */}
      <div className="relative px-6">
        <div className="absolute left-0 w-4 h-4 bg-neutral-100 dark:bg-neutral-950 rounded-full -translate-x-1/2" />
        <div className="absolute right-0 w-4 h-4 bg-neutral-100 dark:bg-neutral-950 rounded-full translate-x-1/2" />
        <Separator className="border-dashed" />
      </div>

      {/* Total */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-neutral-900">TOTAL</span>
          <span className="text-2xl font-black text-neutral-900">${totalPedido}</span>
        </div>
      </div>

      {/* Info de pago en efectivo */}
      {showPaymentInfo && (
        <>
          <div className="relative px-6">
            <div className="absolute left-0 w-4 h-4 bg-neutral-100 dark:bg-neutral-950 rounded-full -translate-x-1/2" />
            <div className="absolute right-0 w-4 h-4 bg-neutral-100 dark:bg-neutral-950 rounded-full translate-x-1/2" />
            <Separator className="border-dashed" />
          </div>
          <div className="px-6 py-4 bg-amber-50 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mb-2">
              <Banknote className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-amber-900">Pago en efectivo</p>
            <p className="text-xs text-amber-700 mt-1">
              Acércate a la caja para abonar
            </p>
          </div>
        </>
      )}

      {/* Footer del recibo */}
      <div className="bg-neutral-50 px-6 py-4 text-center border-t border-dashed border-neutral-200">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
          Powered by Piru
        </p>
      </div>
    </div>
  )

  // Pantalla después de elegir pagar en efectivo
  if (pagado || sessionEnded) {
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

          {/* Recibo con info de pago */}
          <ReceiptCard showPaymentInfo={true} />

          {/* Mensaje final */}
          <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 px-6">
            Puedes cerrar esta pestaña después de pagar
          </p>
        </div>
      </div>
    )
  }

  // El ExitDialog solo se muestra cuando no está pagado, así que lo agregamos aquí
  // pero el hook ya está configurado para no activarse cuando pagado es true

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
            Revisa el detalle y elige cómo pagar
          </p>
        </div>

        {/* Recibo */}
        <ReceiptCard />

        {/* Métodos de Pago */}
        <div className="px-4 space-y-3">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-2">
            Método de pago
          </p>
          
          <Button
            onClick={handlePagarEfectivo}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 shadow-lg"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Pagar en Efectivo
          </Button>

          <Button
            onClick={handlePagarMercadoPago}
            variant="outline"
            className={`w-full h-14 text-base font-semibold rounded-2xl border-2 ${
              mpDisponible 
                ? 'border-sky-500 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950' 
                : ''
            }`}
            disabled={!mpDisponible || isLoadingMP}
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
                {!mpDisponible && (
                  <span className="ml-2 text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-500">
                    No disponible
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dialog para prevenir navegación hacia atrás */}
      <ExitDialog />
    </div>
  )
}

export default PedidoCerrado
