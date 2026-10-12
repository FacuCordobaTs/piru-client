import { useEffect, useMemo, useState } from 'react'
import { marcarRecorridoDemoVisto, recorridoDemoVisto, type PedidoDemoInfo } from '@/lib/demo'
import { datosDemo } from './escenas/datos'
import { RecorridoDemo } from './RecorridoDemo'
import { IslaPanelDemo } from './IslaPanelDemo'
import { PedidoDemo } from './PedidoDemo'
import './demo.css'

type Props = {
  username: string
  restaurante: Parameters<typeof datosDemo>[0]
  productos: Parameters<typeof datosDemo>[1]
  scrollDir: 'up' | 'down' | null
  pedido: PedidoDemoInfo | null
  onCerrarPedido: () => void
}

/**
 * Lo que la demo (`?demo`, lib/demo.ts) le suma a la tienda: el recorrido de bienvenida, la isla
 * que lleva al panel y el final del pedido de prueba. El recorrido se abre la primera vez que el
 * local entra a su link en este navegador; la isla baja medio segundo después de cerrarlo (o de
 * cargar la tienda, si ya lo vio). MenuDelivery lo carga aparte (`lazy`): la tienda de siempre no
 * lo descarga.
 */
export default function DemoTienda({ username, restaurante, productos, scrollDir, pedido, onCerrarPedido }: Props) {
  const enlace = `${window.location.host}/${username}`
  const datos = useMemo(() => datosDemo(restaurante, productos, enlace), [restaurante, productos, enlace])
  const [recorrido, setRecorrido] = useState(() => !recorridoDemoVisto(username))
  const [isla, setIsla] = useState(false)

  useEffect(() => {
    if (recorrido) return
    const timer = window.setTimeout(() => setIsla(true), 500)
    return () => window.clearTimeout(timer)
  }, [recorrido])

  function terminarRecorrido() {
    marcarRecorridoDemoVisto(username)
    setRecorrido(false)
  }

  return (
    <>
      <IslaPanelDemo username={username} visible={isla} scrollDir={scrollDir} />
      <RecorridoDemo abierto={recorrido} datos={datos} onTerminar={terminarRecorrido} />
      <PedidoDemo pedido={pedido} local={restaurante.nombre} onCerrar={onCerrarPedido} />
    </>
  )
}
