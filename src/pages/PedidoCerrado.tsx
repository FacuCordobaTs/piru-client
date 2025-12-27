import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useMesaStore } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import { toast } from 'sonner'
import { Receipt, Package, DollarSign, CreditCard, CheckCircle2 } from 'lucide-react'

const PedidoCerrado = () => {
  const navigate = useNavigate()
  const { mesa, productos, clienteNombre, qrToken } = useMesaStore()
  const { state: wsState, sendMessage } = useClienteWebSocket()
  
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'mercadopago' | null>(null)

  useEffect(() => {
    if (!clienteNombre || !qrToken) {
      navigate(`/mesa/${qrToken || 'invalid'}`)
    }
    // Si el pedido no está cerrado, redirigir
    if (wsState?.estado && wsState.estado !== 'closed') {
      if (wsState.estado === 'preparing') {
        navigate('/pedido-confirmado')
      } else {
        navigate('/menu')
      }
    }
  }, [clienteNombre, qrToken, wsState?.estado])

  const todosLosItems = wsState?.items || []
  const totalPedido = wsState?.total || '0.00'

  const handlePagarEfectivo = () => {
    sendMessage({ 
      type: 'PAGAR_PEDIDO', 
      payload: { metodo: 'efectivo' } 
    })
    toast.success('Pago registrado', {
      description: 'Gracias por tu visita',
    })
    // Aquí podrías redirigir a una pantalla de agradecimiento o cerrar
  }

  const handlePagarMercadoPago = () => {
    // TODO: Implementar integración con MercadoPago
    toast.info('Próximamente', {
      description: 'La integración con MercadoPago estará disponible pronto',
    })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-5 pt-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Receipt className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Factura</h1>
          <p className="text-muted-foreground">
            Mesa {mesa?.nombre}
          </p>
        </div>

        {/* Factura */}
        <Card className="p-6 space-y-4">
          <div className="space-y-3">
            {todosLosItems.map((item) => {
              const prodOriginal = productos.find(p => p.id === (item.productoId || item.id))
              const imagen = item.imagenUrl || prodOriginal?.imagenUrl
              const precio = parseFloat(item.precioUnitario || '0')
              const esMio = item.clienteNombre === clienteNombre

              return (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-secondary">
                    {imagen ? (
                      <img src={imagen} alt="img" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{item.nombreProducto || item.nombre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {esMio ? 'Tú' : item.clienteNombre}
                          </Badge>
                          <span className="text-xs text-muted-foreground">x{item.cantidad}</span>
                        </div>
                      </div>
                      <p className="font-bold text-sm shrink-0">
                        ${(precio * item.cantidad).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-black">${totalPedido}</span>
          </div>
        </Card>

        {/* Métodos de Pago */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold px-1">Método de Pago</h2>
          
          <Button
            onClick={handlePagarEfectivo}
            className="w-full h-14 text-base font-semibold rounded-2xl"
            variant={metodoPago === 'efectivo' ? 'default' : 'outline'}
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Pagar en Efectivo
          </Button>

          <Button
            onClick={handlePagarMercadoPago}
            className="w-full h-14 text-base font-semibold rounded-2xl"
            variant={metodoPago === 'mercadopago' ? 'default' : 'outline'}
            disabled
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pagar con MercadoPago
            <Badge variant="secondary" className="ml-2 text-xs">Próximamente</Badge>
          </Button>
        </div>

        {/* Info adicional */}
        <Card className="p-4 bg-secondary/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Pedido cerrado</p>
              <p className="text-xs text-muted-foreground">Gracias por tu visita</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default PedidoCerrado

