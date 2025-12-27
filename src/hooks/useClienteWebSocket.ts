import { useEffect, useRef, useState } from 'react'
import { useMesaStore } from '@/store/mesaStore'
import { useCarritoStore } from '@/store/carritoStore'

interface ItemPedido {
  id: number
  productoId: number
  clienteNombre: string
  cantidad: number
  precioUnitario: string
  nombreProducto?: string // Nombre del producto desde el servidor
  nombre?: string // Para compatibilidad
  precio?: number // Para compatibilidad con ItemCarrito
  imagenUrl?: string | null // URL de la imagen del producto
}

interface WebSocketState {
  items: ItemPedido[]
  total: string
  estado: 'pending' | 'preparing' | 'delivered' | 'closed'
}

interface UseClienteWebSocketReturn {
  state: WebSocketState | null
  isConnected: boolean
  error: string | null
  sendMessage: (message: any) => void
}

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.piru.app'

export const useClienteWebSocket = (): UseClienteWebSocketReturn => {
  const { qrToken, clienteId, clienteNombre, setClientes, setPedidoId } = useMesaStore()
  const { clearCarrito } = useCarritoStore()
  const [state, setState] = useState<WebSocketState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasConnectedRef = useRef(false)

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // No enviar mesaId ni pedidoId, el backend ya los tiene guardados en el WebSocket
      let newMessage = {
        type: message.type,
        payload: {
          ...message.payload,
        },
      }
      console.log('Enviando mensaje a WebSocket:', newMessage)
      wsRef.current.send(JSON.stringify(newMessage))
    } else {
      console.error('WebSocket no está conectado')
    }
  }

  useEffect(() => {
    if (!qrToken) return

    const connect = () => {
      try {
        const ws = new WebSocket(`${WS_URL}/ws/${qrToken}`)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket conectado para cliente:', qrToken)
          setIsConnected(true)
          setError(null)

          // Enviar mensaje de cliente conectado si tenemos la info
          if (clienteId && clienteNombre && !hasConnectedRef.current) {
            hasConnectedRef.current = true
            sendMessage({
              type: 'CLIENTE_CONECTADO',
              payload: {
                clienteId,
                nombre: clienteNombre,
              },
            })
          }
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('Mensaje WebSocket recibido:', data)

            switch (data.type) {
              case 'ESTADO_INICIAL':
                setState({
                  items: data.payload.items || [],
                  total: data.payload.total || '0.00',
                  estado: data.payload.estado || 'pending',
                })
                setClientes(data.payload.clientes || [])
                setPedidoId(data.payload.pedidoId)
                break

              case 'CLIENTE_UNIDO':
                setClientes(data.payload.clientes || [])
                break

              case 'CLIENTE_DESCONECTADO':
                setClientes(data.payload.clientes || [])
                break

              case 'ITEM_AGREGADO':
                setState((prev) => prev ? {
                  ...prev,
                  items: data.payload.items || prev.items,
                  total: data.payload.total || prev.total,
                } : null)
                break

              case 'ITEM_ELIMINADO':
                setState((prev) => prev ? {
                  ...prev,
                  items: data.payload.items || prev.items,
                  total: data.payload.total || prev.total,
                } : null)
                break

              case 'CANTIDAD_ACTUALIZADA':
                setState((prev) => prev ? {
                  ...prev,
                  items: data.payload.items || prev.items,
                  total: data.payload.total || prev.total,
                } : null)
                break

              case 'PEDIDO_ACTUALIZADO':
                // Actualizar el estado con los items y pedido del servidor
                setState({
                  items: data.payload.items || [],
                  total: data.payload.pedido?.total || '0.00',
                  estado: data.payload.pedido?.estado || 'pending',
                })
                // Limpiar el carrito local ya que el servidor es la fuente de verdad
                // Esto evita duplicados y mantiene sincronización
                clearCarrito()
                break

              case 'PEDIDO_CONFIRMADO':
                setState({
                  items: data.payload.items || [],
                  total: data.payload.pedido?.total || '0.00',
                  estado: 'preparing',
                })
                // Redirigir a la pantalla de pedido confirmado
                window.location.href = '/pedido-confirmado'
                break

              case 'PEDIDO_CERRADO':
                setState({
                  items: data.payload.items || [],
                  total: data.payload.pedido?.total || '0.00',
                  estado: 'closed',
                })
                // Redirigir a la pantalla de pedido cerrado
                window.location.href = '/pedido-cerrado'
                break

              case 'MOZO_NOTIFICADO':
                // Este mensaje se maneja en la página PedidoConfirmado
                break

              case 'ERROR':
                console.error('Error del servidor:', data.payload)
                setError(data.payload.message)
                break
            }
          } catch (err) {
            console.error('Error parseando mensaje WebSocket:', err)
          }
        }

        ws.onerror = (event) => {
          console.error('Error WebSocket:', event)
          setError('Error de conexión WebSocket')
          setIsConnected(false)
        }

        ws.onclose = () => {
          console.log('WebSocket cerrado, intentando reconectar...')
          setIsConnected(false)
          hasConnectedRef.current = false
          
          // Intentar reconectar después de 3 segundos
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      } catch (err) {
        console.error('Error creando WebSocket:', err)
        setError('No se pudo conectar al servidor')
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      hasConnectedRef.current = false
    }
  }, [qrToken, clienteId, clienteNombre])

  return { state, isConnected, error, sendMessage }
}

