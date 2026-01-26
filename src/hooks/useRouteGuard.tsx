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
  allowedStates: Array<'pending' | 'preparing' | 'closed' | 'delivered' | null>,
  options?: {
    redirectTo?: string
    disabled?: boolean
  }
) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { clienteNombre, qrToken, isHydrated, sessionEnded, restaurante } = useMesaStore()
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

    // LÓGICA ESPECIAL PARA CARRITOS:
    // Si estamos en un Carrito y el estado es 'preparing', el usuario DEBE poder estar en:
    // 1. /pedido-cerrado (para pagar)
    // 2. /esperando-pedido (si ya pagó)
    // Por lo tanto, si la ruta actual es /pedido-cerrado, consideramos 'preparing' como válido forzosamente.
    let isEffectiveStateAllowed = allowedStates.includes(currentState as any)

    if (restaurante?.esCarrito && currentState === 'preparing' && location.pathname === '/pedido-cerrado') {
      isEffectiveStateAllowed = true;
    }

    if (!isEffectiveStateAllowed) {
      const redirectKey = `${location.pathname}-${currentState}`

      // Evitar re-procesar la misma redirección
      if (lastRedirectedState.current === redirectKey) return

      let targetPath = ''

      if (redirectTo) {
        targetPath = redirectTo
      } else {
        // Lógica inteligente de redirección
        if (currentState === 'preparing' || currentState === 'delivered') {
          // Carritos: ir a pagar primero
          if (restaurante?.esCarrito) {
            targetPath = '/pedido-cerrado'
          } else {
            targetPath = '/pedido-confirmado'
          }
        } else if (currentState === 'closed') {
          targetPath = '/pedido-cerrado'
        } else {
          targetPath = '/menu' // Default para pending/null
        }
      }

      // CORRECCIÓN CRÍTICA ANTI-BUCLE:
      // Si la ruta destino es la misma en la que ya estamos, NO hacer nada.
      if (targetPath === location.pathname) {
        return;
      }

      lastRedirectedState.current = redirectKey
      navigate(targetPath, { replace: true })
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
    location.pathname,
    restaurante?.esCarrito
  ])
}

