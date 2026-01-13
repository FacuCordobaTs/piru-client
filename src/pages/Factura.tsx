import { useSearchParams } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, Home } from 'lucide-react'
import { usePreventBackNavigation } from '@/hooks/usePreventBackNavigation'
import { useMesaStore } from '@/store/mesaStore'

const Factura = () => {
  const [searchParams] = useSearchParams()
  const { pedidoCerrado, mesa, restaurante } = useMesaStore()
  const metodoPago = searchParams.get('metodo') || 'efectivo'
  const numeroFactura = `FAC-${Date.now().toString().slice(-6)}`
  const fecha = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Hook para prevenir navegación hacia atrás
  const { ExitDialog } = usePreventBackNavigation(true)

  // Usar datos del pedido cerrado del store
  const items = pedidoCerrado?.items || []
  const totalPedido = pedidoCerrado?.total || '0.00'
  const total = parseFloat(totalPedido)
  const subtotal = total
  const iva = total * 0.21
  const totalFinal = subtotal + iva

  // Obtener lista única de clientes
  const clientes = Array.from(new Set(items.map(item => item.clienteNombre || item.nombre)))

  const handleDescargar = () => {
    // Aquí se implementaría la descarga de la factura
    window.print()
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header de Éxito */}
        <Card className="bg-primary/5 border-primary">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">¡Pago Realizado!</h1>
            <p className="text-muted-foreground">
              Tu pago se ha procesado correctamente
            </p>
            <Badge variant="default" className="text-lg px-3 py-1">
              {metodoPago === 'mercadopago' ? 'MercadoPago' : 'Efectivo'}
            </Badge>
          </CardContent>
        </Card>

        {/* Factura */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Factura</CardTitle>
                <CardDescription>N° {numeroFactura}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{fecha}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Información del Restaurante */}
            <div className="pb-4 border-b">
              <h2 className="text-xl font-bold mb-2">{restaurante?.nombre || 'Restaurante'}</h2>
              {restaurante?.imagenUrl && (
                <img 
                  src={restaurante.imagenUrl} 
                  alt={restaurante.nombre || 'Restaurante'}
                  className="w-16 h-16 rounded-lg object-cover mb-2"
                />
              )}
            </div>

            {/* Información de la Mesa */}
            <div className="pb-4 border-b">
              <p className="text-sm font-medium mb-1">Mesa: {mesa?.nombre || 'N/A'}</p>
              {clientes.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Clientes: {clientes.join(', ')}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h3 className="font-semibold">Detalle del Pedido</h3>
              {items.length > 0 ? (
                items.map((item) => {
                  const precio = parseFloat(item.precioUnitario || '0')
                  const subtotalItem = precio * (item.cantidad || 1)
                  return (
                    <div key={item.id} className="flex items-start justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.nombreProducto || item.nombre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-muted-foreground">
                            {item.cantidad || 1}x ${precio.toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {item.clienteNombre}
                          </Badge>
                        </div>
                        {(item as any).ingredientesExcluidosNombres && (item as any).ingredientesExcluidosNombres.length > 0 && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                            ⚠️ Sin: {(item as any).ingredientesExcluidosNombres.join(', ')}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">${subtotalItem.toFixed(2)}</p>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No hay items en el pedido</p>
              )}
            </div>

            <Separator />

            {/* Totales */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (21%)</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${totalFinal.toFixed(2)}</span>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Método de Pago</p>
              <p className="font-medium">
                {metodoPago === 'mercadopago' ? 'MercadoPago' : 'Efectivo'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDescargar}
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar Factura
          </Button>
          <Button
            className="w-full"
            onClick={() => window.location.href = '/'}
          >
            <Home className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>
        </div>
      </div>

      {/* Dialog para prevenir navegación hacia atrás */}
      <ExitDialog />
    </div>
  )
}

export default Factura

