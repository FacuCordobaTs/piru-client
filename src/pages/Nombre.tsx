import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMesaStore } from '@/store/mesaStore'
import { mesaApi, ApiError } from '@/lib/api'
import { toast } from 'sonner'
import { User, Loader2 } from 'lucide-react'

const Nombre = () => {
  const navigate = useNavigate()
  const { qrToken: urlQrToken } = useParams<{ qrToken: string }>()
  const [nombre, setNombre] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [shouldAskName, setShouldAskName] = useState(false)
  const { 
    setMesa, setProductos, setQrToken, setClienteInfo, setPedidoId, setPedido, 
    pedido, clienteNombre, qrToken: storedQrToken, isHydrated, sessionEnded, 
    reset, clearPedidoCerrado
  } = useMesaStore()

  // Efecto para verificar si el usuario ya tiene datos guardados
  useEffect(() => {
    // Esperar a que el store se hidrate
    if (!isHydrated) return
    
    // Si es un nuevo QR diferente al guardado, o la sesión terminó, limpiar datos
    if (urlQrToken && (urlQrToken !== storedQrToken || sessionEnded)) {
      console.log('Nuevo QR o sesión terminada, limpiando datos anteriores')
      reset()
      clearPedidoCerrado()
    }
    
    // Si ya tiene nombre para este mismo QR y la sesión no terminó, redirigir automáticamente
    if (urlQrToken === storedQrToken && clienteNombre && !sessionEnded) {
      console.log('Usuario ya registrado, redirigiendo según estado del pedido')
      const estadoPedido = pedido?.estado
      if (estadoPedido === 'preparing') {
        navigate('/pedido-confirmado')
      } else if (estadoPedido === 'closed') {
        navigate('/pedido-cerrado')
      } else {
        navigate('/menu')
      }
    } else {
      setShouldAskName(true)
    }
  }, [isHydrated, urlQrToken, storedQrToken, clienteNombre, sessionEnded, pedido?.estado, navigate])

  // Efecto para cargar datos de la mesa
  useEffect(() => {
    const cargarMesa = async () => {
      if (!urlQrToken) {
        toast.error('Token de mesa no válido')
        navigate('/')
        return
      }

      setQrToken(urlQrToken)
      setIsLoading(true)

      try {
        const response = await mesaApi.join(urlQrToken) as {
          success: boolean
          data?: {
            mesa: {
              id: number
              nombre: string
              restauranteId: number
              qrToken: string
              createdAt: string
            }
            productos: Array<{
              id: number
              nombre: string
              descripcion: string | null
              precio: string
              imagenUrl: string | null
              categoria?: string
            }>
            pedido: {
              id: number
              mesaId: number
              restauranteId: number
              estado: string
              total: string
              createdAt: string
            }
          }
        } 

        console.log('response', response)
        
        if (response.success && response.data) {
          setMesa(response.data.mesa)
          setProductos(response.data.productos || [])
          setPedidoId(response.data.pedido.id)
          setPedido(response.data.pedido)
          toast.success('Mesa encontrada')
        } else {
          toast.error('Error al cargar la mesa')
          navigate('/')
        }
      } catch (error) {
        console.error('Error cargando mesa:', error)
        if (error instanceof ApiError) {
          toast.error('Mesa no encontrada', {
            description: error.message,
          })
        } else {
          toast.error('Error de conexión')
          console.error('Error de conexión:', error)
        }
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    cargarMesa()
  }, [urlQrToken])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nombre.trim()) {
      // Generar ID único para el cliente
      const clienteId = `cliente-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setClienteInfo(clienteId, nombre.trim())
      
      // Redirigir según el estado del pedido
      const estadoPedido = pedido?.estado
      if (estadoPedido === 'preparing') {
        navigate('/pedido-confirmado')
      } else if (estadoPedido === 'closed') {
        navigate('/pedido-cerrado')
      } else {
        navigate('/menu')
      }
    }
  }

  // Mostrar cargando mientras se hidrata el store o se carga la mesa
  if (isLoading || !isHydrated || !shouldAskName) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando mesa...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">¿Cómo te llamas?</CardTitle>
          <CardDescription>
            Ingresa tu nombre para unirte a la mesa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Tu nombre</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Ej: Juan"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
                className="text-lg h-12"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={!nombre.trim()}
            >
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Nombre

