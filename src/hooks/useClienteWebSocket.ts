import { useEffect, useRef, useState, useCallback } from 'react'
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
  ingredientesExcluidos?: number[] // IDs de ingredientes excluidos
  ingredientesExcluidosNombres?: string[] // Nombres de ingredientes excluidos
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
  const { 
    qrToken, clienteId, clienteNombre, setClientes, setPedidoId, 
    setPedidoCerrado, pedidoId, sessionEnded 
  } = useMesaStore()
  const { clearCarrito } = useCarritoStore()
  const [state, setState] = useState<WebSocketState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasConnectedRef = useRef(false)
  const connectionIdRef = useRef<string | null>(null)
  
  // Refs para acceder a los valores actuales sin causar reconexiones
  const clienteIdRef = useRef(clienteId)
  const clienteNombreRef = useRef(clienteNombre)
  
  // Mantener refs actualizados
  useEffect(() => {
    clienteIdRef.current = clienteId
    clienteNombreRef.current = clienteNombre
  }, [clienteId, clienteNombre])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const newMessage = {
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
  }, [])

  // Efecto separado para enviar CLIENTE_CONECTADO cuando los datos estén disponibles
  useEffect(() => {
    // No enviar si la sesión terminó o si ya se envió para esta conexión
    if (sessionEnded) return
    
    if (isConnected && clienteId && clienteNombre && !hasConnectedRef.current && connectionIdRef.current) {
      console.log('Enviando CLIENTE_CONECTADO para conexión:', connectionIdRef.current)
      hasConnectedRef.current = true
      sendMessage({
        type: 'CLIENTE_CONECTADO',
        payload: {
          clienteId,
          nombre: clienteNombre,
        },
      })
    }
  }, [isConnected, clienteId, clienteNombre, sendMessage, sessionEnded])

  // Efecto principal de conexión - SOLO depende de qrToken y sessionEnded
  useEffect(() => {
    // No conectar si no hay qrToken o si la sesión terminó
    if (!qrToken || sessionEnded) {
      console.log('No conectando WebSocket:', { qrToken, sessionEnded })
      return
    }

    // Limpiar conexión anterior si existe
    if (wsRef.current) {
      wsRef.current.close(1000, 'qrToken changed')
      wsRef.current = null
    }
    
    // Limpiar timeout de reconexión si existe
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Generar ID único para esta instancia de conexión
    const instanceId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    connectionIdRef.current = instanceId

    const connect = () => {
      // No reconectar si la sesión terminó
      if (sessionEnded) {
        console.log('Sesión terminada, no reconectando')
        return
      }
      
      // Prevenir múltiples conexiones simultáneas
      if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
        console.log('Ya hay una conexión en progreso, ignorando...')
        return
      }
      
      // Verificar que el ID de conexión no haya cambiado (componente desmontado y remontado)
      if (connectionIdRef.current !== instanceId) {
        console.log('ID de conexión cambió, abortando conexión antigua')
        return
      }
      
      try {
        console.log('Conectando WebSocket para qrToken:', qrToken, 'instancia:', instanceId)
        const ws = new WebSocket(`${WS_URL}/ws/${qrToken}`)
        wsRef.current = ws

        ws.onopen = () => {
          // Verificar que esta conexión sigue siendo la actual
          if (connectionIdRef.current !== instanceId) {
            console.log('Conexión obsoleta, cerrando')
            ws.close(1000, 'Obsolete connection')
            return
          }
          
          console.log('WebSocket conectado para cliente:', qrToken)
          setIsConnected(true)
          setError(null)
          // Resetear el flag para permitir envío de CLIENTE_CONECTADO
          hasConnectedRef.current = false
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('Mensaje WebSocket recibido:', data)

            switch (data.type) {
              case 'ESTADO_INICIAL':
                const nuevoEstado = data.payload.estado || 'pending'
                const nuevosItems = data.payload.items || []
                const nuevoTotal = data.payload.total || '0.00'
                
                setState((prevState) => {
                  // Si ya tenemos datos en 'preparing' o 'closed' y los nuevos están vacíos,
                  // es probable que sea una reconexión a un pedido nuevo - mantener los datos anteriores
                  // solo si el estado anterior era más avanzado
                  if (prevState && 
                      (prevState.estado === 'preparing' || prevState.estado === 'closed') &&
                      nuevosItems.length === 0 && 
                      prevState.items.length > 0) {
                    console.log('Manteniendo datos anteriores del estado', prevState.estado)
                    return prevState
                  }
                  
                  return {
                    items: nuevosItems,
                    total: nuevoTotal,
                    estado: nuevoEstado,
                  }
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
                // El estado se actualiza y los componentes reaccionan automáticamente
                // No usar window.location.href para evitar perder el estado
                break

              case 'PEDIDO_CERRADO':
                const cerradoItems = data.payload.items || []
                const cerradoTotal = data.payload.pedido?.total || '0.00'
                const cerradoPedidoId = data.payload.pedido?.id || pedidoId
                
                // Guardar datos del pedido cerrado en el store para poder mostrarlos en la factura
                if (cerradoItems.length > 0 && cerradoPedidoId) {
                  setPedidoCerrado({
                    items: cerradoItems,
                    total: cerradoTotal,
                    pedidoId: cerradoPedidoId,
                  })
                }
                
                setState({
                  items: cerradoItems,
                  total: cerradoTotal,
                  estado: 'closed',
                })
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

        ws.onclose = (event) => {
          // Verificar que esta conexión sigue siendo la actual
          if (connectionIdRef.current !== instanceId) {
            console.log('Conexión obsoleta cerrada, ignorando')
            return
          }
          
          console.log('WebSocket cerrado, código:', event.code)
          setIsConnected(false)
          hasConnectedRef.current = false
          
          // Solo reconectar si no fue un cierre intencional y la sesión no terminó
          if (event.code !== 1000 && !sessionEnded) {
            console.log('Intentando reconectar en 3 segundos...')
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, 3000)
          }
        }
      } catch (err) {
        console.error('Error creando WebSocket:', err)
        setError('No se pudo conectar al servidor')
      }
    }

    connect()

    return () => {
      console.log('Limpiando conexión WebSocket, instancia:', instanceId)
      connectionIdRef.current = null
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        // Cerrar con código 1000 para indicar cierre normal
        wsRef.current.close(1000, 'Component unmount')
        wsRef.current = null
      }
      hasConnectedRef.current = false
    }
  }, [qrToken, sessionEnded]) // Depender también de sessionEnded

  return { state, isConnected, error, sendMessage }
}

