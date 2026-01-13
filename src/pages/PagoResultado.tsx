import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useMesaStore } from '@/store/mesaStore'
import { CheckCircle2, XCircle, Clock, Home, Sparkles } from 'lucide-react'

type ResultadoTipo = 'success' | 'failure' | 'pending'

interface Props {
  tipo: ResultadoTipo
}

const PagoResultado = ({ tipo }: Props) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { restaurante, mesa, endSession, reset, clearPedidoCerrado } = useMesaStore()
  
  const pedidoId = searchParams.get('pedido_id')

  // Si el pago fue exitoso, terminar la sesión y redirigir a factura
  useEffect(() => {
    if (tipo === 'success') {
      endSession()
      // Redirigir a factura con método MercadoPago
      navigate('/factura?metodo=mercadopago', { replace: true })
    }
  }, [tipo, endSession, navigate])

  const handleNuevoEscaneo = () => {
    reset()
    clearPedidoCerrado()
    navigate('/')
  }

  const config = {
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      title: '¡Pago exitoso!',
      subtitle: 'Tu pago ha sido procesado correctamente',
      description: 'Gracias por tu compra. El restaurante ha recibido la confirmación del pago.',
    },
    failure: {
      icon: XCircle,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'Pago rechazado',
      subtitle: 'No se pudo procesar tu pago',
      description: 'Por favor, intenta con otro método de pago o contacta a tu banco.',
    },
    pending: {
      icon: Clock,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: 'Pago pendiente',
      subtitle: 'Tu pago está siendo procesado',
      description: 'Recibirás una confirmación cuando el pago sea aprobado.',
    },
  }

  const current = config[tipo]
  const Icon = current.icon

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-100 to-neutral-200 dark:from-neutral-950 dark:to-neutral-900 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Success animation for approved payments */}
        {tipo === 'success' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-emerald-300 rounded-full animate-ping delay-100" />
            <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-emerald-500 rounded-full animate-ping delay-200" />
          </div>
        )}

        {/* Icon */}
        <div className={`p-6 rounded-full ${current.iconBg} mb-6 animate-in zoom-in duration-500`}>
          <Icon className={`w-16 h-16 ${current.iconColor}`} />
        </div>

        {/* Restaurant info */}
        {restaurante && (
          <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            {restaurante.imagenUrl ? (
              <img 
                src={restaurante.imagenUrl} 
                alt={restaurante.nombre || 'Restaurante'}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-neutral-400" />
              </div>
            )}
            <div className="text-left">
              <p className="font-semibold text-neutral-900 dark:text-white">
                {restaurante.nombre || 'Restaurante'}
              </p>
              {mesa && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Mesa {mesa.nombre}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white text-center mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {current.title}
        </h1>
        
        <p className="text-neutral-600 dark:text-neutral-400 text-center mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          {current.subtitle}
        </p>
        
        <p className="text-sm text-neutral-500 dark:text-neutral-500 text-center max-w-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          {current.description}
        </p>

        {pedidoId && (
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mb-8 animate-in fade-in duration-500 delay-500">
            Pedido #{pedidoId}
          </p>
        )}

        {/* Actions */}
        <div className="w-full max-w-xs space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          {tipo === 'success' && (
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Puedes cerrar esta pestaña
            </p>
          )}
          
          {tipo === 'failure' && (
            <Button
              onClick={() => navigate('/pedido-cerrado')}
              className="w-full h-12 rounded-xl"
            >
              Intentar de nuevo
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleNuevoEscaneo}
            className="w-full h-12 rounded-xl"
          >
            <Home className="w-4 h-4 mr-2" />
            Nuevo escaneo
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 pt-4 text-center">
        <p className="text-[10px] text-neutral-300 dark:text-neutral-700 font-medium tracking-wider uppercase">
          Powered by Piru
        </p>
      </div>
    </div>
  )
}

// Export wrapper components for each result type
export const PagoExitoso = () => <PagoResultado tipo="success" />
export const PagoFallido = () => <PagoResultado tipo="failure" />
export const PagoPendiente = () => <PagoResultado tipo="pending" />

export default PagoResultado

