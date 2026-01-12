import { useSearchParams, useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, Home } from 'lucide-react'
import { useMesaStore } from '@/store/mesaStore'
import { useEffect } from 'react'

// Datos de ejemplo
const pedidoCompletoEjemplo = [
  { id: 1, nombre: 'Pizza Margarita', cantidad: 2, precio: 12.50, cliente: 'Juan', subtotal: 25.00 },
  { id: 2, nombre: 'Coca Cola', cantidad: 1, precio: 2.50, cliente: 'María', subtotal: 2.50 },
  { id: 3, nombre: 'Hamburguesa Clásica', cantidad: 1, precio: 8.75, cliente: 'Pedro', subtotal: 8.75 },
  { id: 4, nombre: 'Papas Fritas', cantidad: 2, precio: 4.00, cliente: 'Juan', subtotal: 8.00 },
]

const Factura = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { sessionEnded, pedidoCerrado, isHydrated } = useMesaStore()
  const metodoPago = searchParams.get('metodo') || 'efectivo'
  const numeroFactura = `FAC-${Date.now().toString().slice(-6)}`
  const fecha = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Verificar que el usuario tenga acceso a esta página (solo si ya pagó)
  useEffect(() => {
    if (!isHydrated) return
    
    // Si no hay sesión terminada ni pedido cerrado, redirigir
    if (!sessionEnded && !pedidoCerrado) {
      navigate('/pedido-cerrado', { replace: true })
    }
  }, [isHydrated, sessionEnded, pedidoCerrado, navigate])

  const total = pedidoCompletoEjemplo.reduce((sum, item) => sum + item.subtotal, 0)
  const subtotal = total
  const iva = total * 0.21
  const totalFinal = subtotal + iva

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
              <h2 className="text-xl font-bold mb-2">Restaurante PIRU</h2>
              <p className="text-sm text-muted-foreground">
                Av. Principal 123, Ciudad
              </p>
              <p className="text-sm text-muted-foreground">
                CUIT: 20-12345678-9
              </p>
            </div>

            {/* Información de la Mesa */}
            <div className="pb-4 border-b">
              <p className="text-sm font-medium mb-1">Mesa: 5</p>
              <p className="text-sm text-muted-foreground">
                Clientes: {Array.from(new Set(pedidoCompletoEjemplo.map(i => i.cliente))).join(', ')}
              </p>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h3 className="font-semibold">Detalle del Pedido</h3>
              {pedidoCompletoEjemplo.map((item) => (
                <div key={item.id} className="flex items-start justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-muted-foreground">
                        {item.cantidad}x ${item.precio.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {item.cliente}
                      </Badge>
                    </div>
                  </div>
                  <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                </div>
              ))}
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
    </div>
  )
}

export default Factura

