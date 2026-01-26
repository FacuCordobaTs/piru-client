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

  // Resetear el flag cuando cambia la ruta
  useEffect(() => {
    lastRedirectedState.current = null
  }, [location.pathname])

  useEffect(() => {
    if (disabled) return
    if (!isHydrated) return
    if (sessionEnded) return

    // Validación de datos del cliente
    if (!clienteNombre || !qrToken) {
      const redirectKey = `no-cliente-${location.pathname}`
      if (lastRedirectedState.current !== redirectKey) {
        lastRedirectedState.current = redirectKey
        navigate(`/mesa/${qrToken || 'invalid'}`, { replace: true })
      }
      return
    }

    const currentState = wsState?.estado || null
    const esCarrito = restaurante?.esCarrito === true

    // === LÓGICA MAESTRA DE REDIRECCIÓN ===
    let targetPath = ''
    let shouldRedirect = false

    // 1. Caso Especial: Carrito en Preparing/Delivered -> SIEMPRE a Pedido Cerrado (Pago)
    if (esCarrito && (currentState === 'preparing' || currentState === 'delivered')) {
      // Si YA estamos en pedido-cerrado o esperando-pedido, estamos bien.
      if (location.pathname !== '/pedido-cerrado' && location.pathname !== '/esperando-pedido') {
        targetPath = '/pedido-cerrado'
        shouldRedirect = true
      }
    }
    // 2. Caso Normal: Verificar estados permitidos
    else if (!allowedStates.includes(currentState as any)) {
      shouldRedirect = true
      if (redirectTo) {
        targetPath = redirectTo
      } else {
        // Lógica por defecto
        if (currentState === 'preparing' || currentState === 'delivered') {
          targetPath = '/pedido-confirmado' // Solo restaurantes clásicos llegan aquí
        } else if (currentState === 'closed') {
          targetPath = '/pedido-cerrado'
        } else {
          targetPath = '/menu'
        }
      }
    }

    // Ejecutar redirección si es necesaria
    if (shouldRedirect && targetPath) {
      // Protección anti-bucle: Si ya estamos en el target, no hacer nada
      if (location.pathname === targetPath) return

      const redirectKey = `${location.pathname}-${currentState}`
      if (lastRedirectedState.current === redirectKey) return

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

