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
  const { qrToken } = useParams<{ qrToken: string }>()
  const [nombre, setNombre] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { setMesa, setProductos, setQrToken, setClienteInfo } = useMesaStore()

  useEffect(() => {
    const cargarMesa = async () => {
      if (!qrToken) {
        toast.error('Token de mesa no válido')
        navigate('/')
        return
      }

      setQrToken(qrToken)
      setIsLoading(true)

      try {
        const response = await mesaApi.join(qrToken) as {
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
          }
        }
        
        if (response.success && response.data) {
          setMesa(response.data.mesa)
          setProductos(response.data.productos || [])
          toast.success('Mesa encontrada', {
            description: `Bienvenido a ${response.data.mesa.nombre}`,
          })
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
  }, [qrToken])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nombre.trim()) {
      // Generar ID único para el cliente
      const clienteId = `cliente-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setClienteInfo(clienteId, nombre.trim())
      navigate('/menu')
    }
  }

  if (isLoading) {
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

