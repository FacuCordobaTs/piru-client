import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useMesaStore } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'

/**
 * Hook que protege las rutas redirigiendo al usuario a la pantalla correcta
 * según el estado del pedido. Esto previene que el usuario esté en una
 * pantalla incorrecta si navega hacia atrás o accede directamente a una URL.
 * 
 * @param allowedStates - Estados del pedido permitidos para esta ruta
 * @param options - Opciones adicionales:
 *   - redirectTo: Ruta a la que redirigir si el estado no es permitido (opcional)
 *   - disabled: Si es true, el guard no se ejecuta (útil para pantallas finales)
 */
export const useRouteGuard = (
  allowedStates: Array<'pending' | 'preparing' | 'closed' | null>,
  options?: {
    redirectTo?: string
    disabled?: boolean
  }
) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { clienteNombre, qrToken, isHydrated, sessionEnded } = useMesaStore()
  const { state: wsState } = useClienteWebSocket()
  const lastRedirectedState = useRef<string | null>(null)
  const redirectTo = options?.redirectTo
  const disabled = options?.disabled

  // Resetear el flag cuando cambia la ruta (cada componente maneja su propia lógica)
  useEffect(() => {
    lastRedirectedState.current = null
  }, [location.pathname])

  useEffect(() => {
    // Si está deshabilitado, no hacer nada
    if (disabled) return

    // Esperar a que el store se hidrate
    if (!isHydrated) return

    // Si la sesión terminó, no hacer nada (ya está en la pantalla final)
    if (sessionEnded) return

    // Si no hay datos del cliente, redirigir a escanear QR
    if (!clienteNombre || !qrToken) {
      const redirectKey = `no-cliente-${location.pathname}`
      if (lastRedirectedState.current !== redirectKey) {
        lastRedirectedState.current = redirectKey
        navigate(`/mesa/${qrToken || 'invalid'}`, { replace: true })
      }
      return
    }

    // Obtener el estado actual del pedido
    const currentState = wsState?.estado || null

    // Verificar si el estado actual está permitido para esta ruta
    const isStateAllowed = allowedStates.includes(currentState as 'pending' | 'preparing' | 'closed' | null)

    // Si el estado no está permitido, redirigir a la pantalla correcta
    // Usar una clave única basada en la ruta y el estado para evitar loops
    if (!isStateAllowed) {
      const redirectKey = `${location.pathname}-${currentState}`
      
      // Solo redirigir si no hemos redirigido ya para esta combinación de ruta+estado
      if (lastRedirectedState.current !== redirectKey) {
        lastRedirectedState.current = redirectKey
        
        if (redirectTo) {
          navigate(redirectTo, { replace: true })
        } else {
          // Redirigir según el estado del pedido
          if (currentState === 'preparing' || currentState === 'delivered') {
            navigate('/pedido-confirmado', { replace: true })
          } else if (currentState === 'closed') {
            navigate('/pedido-cerrado', { replace: true })
          } else {
            // Estado 'pending' o null - ir al menú
            navigate('/menu', { replace: true })
          }
        }
      }
    }
  }, [
    isHydrated,
    sessionEnded,
    clienteNombre,
    qrToken,
    wsState?.estado,
    allowedStates,
    redirectTo,
    disabled,
    navigate,
    location.pathname
  ])
}

