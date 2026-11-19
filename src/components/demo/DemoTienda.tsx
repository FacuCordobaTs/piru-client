import { useEffect, useMemo, useState } from 'react'
import { marcarRecorridoDemoVisto, recorridoDemoVisto, type PedidoDemoInfo } from '@/lib/demo'
import { datosDemo } from './escenas/datos'
import { RecorridoDemo } from './RecorridoDemo'
import { IslaPanelDemo } from './IslaPanelDemo'
import { PedidoDemo } from './PedidoDemo'
import { IntroDemo, productoIntro } from './IntroDemo'
import { ESTILO_VISTA, VistaSitio, esVistaSitio, urlVistaSitio } from './VistaSitio'
import { useTemaSitio } from './temaSitio'
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
 * lo descarga. Antes del recorrido pasa la intro (en cada carga) y la intro y el recorrido toman
 * los colores y las fuentes de la tienda (`temaSitio.ts`). El celular muestra la tienda real
 * (`VistaSitio`), con su plantilla, y no la réplica de `TiendaReplica`.
 */
export default function DemoTienda(props: Props) {
  // Adentro del celular de la demo (`VistaSitio`) va la tienda sola.
  if (esVistaSitio()) return <style>{ESTILO_VISTA}</style>
  return <Demo {...props} />
}

function Demo({ username, restaurante, productos, scrollDir, pedido, onCerrarPedido }: Props) {
  const enlace = `${window.location.host}/${username}`
  const vistaUrl = useMemo(urlVistaSitio, [])
  const datos = useMemo(
    () => ({ ...datosDemo(restaurante, productos, enlace), vistaUrl }),
    [restaurante, productos, enlace, vistaUrl]
  )
  const [recorrido, setRecorrido] = useState(() => !recorridoDemoVisto(username))
  const [isla, setIsla] = useState(false)
  const [intro, setIntro] = useState(true)
  const tema = useTemaSitio()

  useEffect(() => {
    if (recorrido || intro) return
    const timer = window.setTimeout(() => setIsla(true), 500)
    return () => window.clearTimeout(timer)
  }, [recorrido, intro])

  function terminarRecorrido() {
    marcarRecorridoDemoVisto(username)
    setRecorrido(false)
  }

  return (
    <>
      <IslaPanelDemo username={username} visible={isla} scrollDir={scrollDir} />
      {intro && (
        <IntroDemo
          local={restaurante.nombre}
          tema={tema}
          logo={restaurante.imagenLightUrl || restaurante.imagenUrl || null}
          producto={productoIntro(datos.destacados)}
          pagina={<VistaSitio url={vistaUrl} />}
          onTerminar={() => setIntro(false)}
        />
      )}
      <RecorridoDemo abierto={recorrido && !intro} datos={datos} onTerminar={terminarRecorrido} tema={tema} />
      <PedidoDemo pedido={pedido} local={restaurante.nombre} onCerrar={onCerrarPedido} />
    </>
  )
}
