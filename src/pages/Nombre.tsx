import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMesaStore } from '@/store/mesaStore'
import { mesaApi, ApiError } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, Utensils, ChevronRight } from 'lucide-react'

const Nombre = () => {
  const navigate = useNavigate()
  const { qrToken: urlQrToken } = useParams<{ qrToken: string }>()
  const [nombre, setNombre] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [shouldAskName, setShouldAskName] = useState(false)
  const { 
    setMesa, setProductos, setQrToken, setClienteInfo, setPedidoId, setPedido, setRestaurante,
    pedido, clienteNombre, qrToken: storedQrToken, isHydrated, sessionEnded, 
    reset, clearPedidoCerrado, restaurante, mesa
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
              categoriaId: number | null
              categoria: string | null
            }>
            pedido: {
              id: number
              mesaId: number
              restauranteId: number
              estado: string
              total: string
              createdAt: string
            }
            restaurante: {
              id: number
              nombre: string
              imagenUrl: string | null
            } | null
          }
        } 

        console.log('response', response)
        
        if (response.success && response.data) {
          setMesa(response.data.mesa)
          setProductos(response.data.productos || [])
          setPedidoId(response.data.pedido.id)
          setPedido(response.data.pedido)
          setRestaurante(response.data.restaurante || null)
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
      <div className="min-h-screen bg-linear-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-white flex items-center justify-center animate-pulse">
            <Utensils className="h-8 w-8 text-white dark:text-neutral-900" />
          </div>
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 flex flex-col">
      {/* Header con logo del restaurante */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo del restaurante */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {restaurante?.imagenUrl ? (
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white dark:ring-neutral-800">
                <img 
                  src={restaurante.imagenUrl} 
                  alt={restaurante.nombre || 'Restaurante'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <Utensils className="h-4 w-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-28 h-28 rounded-3xl bg-neutral-900 dark:bg-white flex items-center justify-center shadow-2xl">
              <Utensils className="h-12 w-12 text-white dark:text-neutral-900" />
            </div>
          )}
        </div>

        {/* Nombre del restaurante */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            {restaurante?.nombre || 'Bienvenido'}
          </h1>
          <div className="flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
            <span className="text-sm">{mesa?.nombre || 'Tu mesa'}</span>
          </div>
        </div>

        {/* Card principal con formulario */}
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-xl border border-neutral-200 dark:border-neutral-800">
            {/* Instrucción clara */}
            <div className="text-center mb-6">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                Ingresa tu nombre para unirte al pedido compartido de la mesa
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Input
                  id="nombre"
                  type="text"
                  placeholder="¿Cómo te llamas?"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  autoFocus
                  autoComplete="off"
                  className="h-14 text-lg text-center rounded-2xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 transition-colors placeholder:text-neutral-400"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                disabled={!nombre.trim()}
              >
                <span>Ver el menú</span>
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>

          {/* Footer con info adicional */}
          <div className="mt-6 text-center animate-in fade-in duration-1000 delay-500">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Podrás agregar productos al pedido y ver lo que piden tus amigos
            </p>
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <div className="pb-6 pt-4 text-center">
        <p className="text-[10px] text-neutral-300 dark:text-neutral-700 font-medium tracking-wider uppercase">
          Powered by Piru
        </p>
      </div>
    </div>
  )
}

export default Nombre
