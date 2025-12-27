import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useMesaStore } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import { toast } from 'sonner'
import { 
  CheckCircle2, ChefHat, Bell, Receipt, Plus, Minus, Trash2, 
  ArrowLeft, Package, UtensilsCrossed 
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const PedidoConfirmado = () => {
  const navigate = useNavigate()
  const { mesa, productos, clienteNombre, qrToken, pedido } = useMesaStore()
  const { state: wsState, isConnected, sendMessage } = useClienteWebSocket()
  
  const [verPedidoAbierto, setVerPedidoAbierto] = useState(false)
  const [llamarMozoAbierto, setLlamarMozoAbierto] = useState(false)
  const [pedirCuentaAbierto, setPedirCuentaAbierto] = useState(false)

  useEffect(() => {
    if (!clienteNombre || !qrToken) {
      navigate(`/mesa/${qrToken || 'invalid'}`)
    }
    // Si el pedido no está en estado preparing, redirigir
    if (wsState?.estado && wsState.estado !== 'preparing' && wsState.estado !== 'pending') {
      if (wsState.estado === 'closed') {
        navigate('/pedido-cerrado')
      } else {
        navigate('/menu')
      }
    }
  }, [clienteNombre, qrToken, wsState?.estado])

  const todosLosItems = wsState?.items || []
  const totalPedido = wsState?.total || '0.00'

  const handleLlamarMozo = () => {
    sendMessage({ type: 'LLAMAR_MOZO', payload: {} })
    setLlamarMozoAbierto(true)
    toast.success('¡Mozo notificado!', {
      description: 'Un mozo se acercará a tu mesa pronto',
    })
  }

  const handlePedirCuenta = () => {
    setPedirCuentaAbierto(true)
  }

  const confirmarCerrarPedido = () => {
    sendMessage({ type: 'CERRAR_PEDIDO', payload: {} })
    setPedirCuentaAbierto(false)
  }

  const handleAumentarCantidad = (itemPedidoId: number) => {
    const item = todosLosItems.find(i => i.id === itemPedidoId)
    if (!item) return
    sendMessage({ type: 'ACTUALIZAR_CANTIDAD', payload: { itemId: itemPedidoId, cantidad: item.cantidad + 1 } })
  }

  const handleDisminuirCantidad = (itemPedidoId: number) => {
    const item = todosLosItems.find(i => i.id === itemPedidoId)
    if (!item || item.cantidad <= 1) return
    sendMessage({ type: 'ACTUALIZAR_CANTIDAD', payload: { itemId: itemPedidoId, cantidad: item.cantidad - 1 } })
  }

  const handleEliminarItem = (itemPedidoId: number) => {
    sendMessage({ type: 'ELIMINAR_ITEM', payload: { itemId: itemPedidoId } })
    toast.success('Producto eliminado')
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-2xl mx-auto px-5 pt-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">¡Pedido Confirmado!</h1>
          <p className="text-muted-foreground">
            Tu pedido ha sido enviado a la cocina
          </p>
          <p className="text-sm text-muted-foreground/80">
            La cocina comenzará a preparar tu pedido y los mozos te lo traerán en unos minutos
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3">
          <Button
            onClick={() => setVerPedidoAbierto(true)}
            className="w-full h-14 text-base font-semibold rounded-2xl"
            variant="outline"
          >
            <Receipt className="w-5 h-5 mr-2" />
            Ver Pedido
          </Button>

          <Button
            onClick={handleLlamarMozo}
            className="w-full h-14 text-base font-semibold rounded-2xl"
            variant="outline"
          >
            <Bell className="w-5 h-5 mr-2" />
            Llamar al Mozo
          </Button>

          <Button
            onClick={handlePedirCuenta}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90"
          >
            <Receipt className="w-5 h-5 mr-2" />
            Pedir la Cuenta
          </Button>
        </div>

        {/* Info adicional */}
        <Card className="p-4 bg-secondary/30">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Estado del pedido</p>
              <p className="text-xs text-muted-foreground">En preparación</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sheet Ver Pedido */}
      <Sheet open={verPedidoAbierto} onOpenChange={setVerPedidoAbierto}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <div className="flex flex-col h-full">
            <div className="px-5 py-4 flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full -ml-2 hover:bg-secondary"
                onClick={() => setVerPedidoAbierto(false)}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div>
                <SheetTitle className="text-xl">Tu Pedido</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todosLosItems.length} items
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              {todosLosItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                  <div className="bg-secondary p-6 rounded-full">
                    <UtensilsCrossed className="w-10 h-10" />
                  </div>
                  <p className="font-medium">El pedido está vacío.</p>
                </div>
              ) : (
                todosLosItems.map((item) => {
                  const esMio = item.clienteNombre === clienteNombre
                  const prodOriginal = productos.find(p => p.id === (item.productoId || item.id))
                  const imagen = item.imagenUrl || prodOriginal?.imagenUrl
                  const precio = parseFloat(item.precioUnitario || '0')

                  return (
                    <div 
                      key={item.id} 
                      className={`relative flex gap-4 p-3 rounded-2xl border transition-all ${
                        esMio ? 'bg-card border-primary/20 shadow-sm' : 'bg-secondary/30 border-transparent opacity-90'
                      }`}
                    >
                      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-secondary">
                        {imagen ? (
                          <img src={imagen} alt="img" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{item.nombreProducto || item.nombre}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="secondary" className={`h-5 text-[10px] px-1.5 font-normal rounded-md ${esMio ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : ''}`}>
                                {esMio ? 'Tú' : item.clienteNombre}
                              </Badge>
                            </div>
                          </div>
                          <p className="font-bold text-base">
                            ${(precio * item.cantidad).toFixed(2)}
                          </p>
                        </div>

                        {esMio && (
                          <div className="flex items-center justify-end gap-3 mt-2">
                            {item.cantidad === 1 ? (
                              <button 
                                onClick={() => handleEliminarItem(item.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleDisminuirCantidad(item.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className="w-4 text-center text-sm font-semibold tabular-nums">{item.cantidad}</span>
                            <button 
                              onClick={() => handleAumentarCantidad(item.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-5 bg-background border-t border-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground text-sm">Total</span>
                <span className="text-2xl font-black tracking-tight">${totalPedido}</span>
              </div>
              <Button 
                className="w-full h-12 text-base font-semibold rounded-2xl"
                onClick={() => navigate('/agregar-producto')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog Llamar Mozo */}
      <Dialog open={llamarMozoAbierto} onOpenChange={setLlamarMozoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Mozo Notificado!</DialogTitle>
            <DialogDescription>
              Hemos enviado una notificación al mozo. Se acercará a tu mesa en breve.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setLlamarMozoAbierto(false)} className="mt-4">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Cerrar Pedido */}
      <Dialog open={pedirCuentaAbierto} onOpenChange={setPedirCuentaAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Pedir la cuenta?</DialogTitle>
            <DialogDescription>
              Esto cerrará el pedido y te llevará a la pantalla de pago. ¿Estás seguro?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setPedirCuentaAbierto(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={confirmarCerrarPedido} className="flex-1">
              Sí, pedir cuenta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PedidoConfirmado

