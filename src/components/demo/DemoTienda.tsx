import { useMemo, useState } from 'react'
import { marcarRecorridoDemoVisto, recorridoDemoVisto, type PedidoDemoInfo } from '@/lib/demo'
import { datosDemo } from './escenas/datos'
import { PeliculaDemo } from './PeliculaDemo'
import { PedidoDemo } from './PedidoDemo'
import { ESTILO_VISTA, esVistaSitio, urlVistaSitio } from './VistaSitio'
import { useTemaSitio } from './temaSitio'
import './demo.css'

type Props = {
  username: string
  restaurante: Parameters<typeof datosDemo>[0]
  productos: Parameters<typeof datosDemo>[1]
  pedido: PedidoDemoInfo | null
  onCerrarPedido: () => void
}

/**
 * Lo que la demo (`?demo`, lib/demo.ts) le suma a la tienda: la animación de pantalla completa que
 * recorre la tienda y hace un pedido hasta el panel (`PeliculaDemo`, en cada carga; la primera vez
 * no se puede saltar) y el final del pedido de prueba. MenuDelivery lo carga aparte (`lazy`): la
 * tienda de siempre no lo descarga.
 */
export default function DemoTienda(props: Props) {
  // Adentro del celular de la animación (`?demo&vista`) va la tienda sola.
  if (esVistaSitio()) return <style>{ESTILO_VISTA}</style>
  return <Demo {...props} />
}

function Demo({ username, restaurante, productos, pedido, onCerrarPedido }: Props) {
  const enlace = `${window.location.host}/${username}`
  const datos = useMemo(() => datosDemo(restaurante, productos, enlace), [restaurante, productos, enlace])
  const vistaUrl = useMemo(() => urlVistaSitio(), [])
  const [saltable] = useState(() => recorridoDemoVisto(username))
  const [pelicula, setPelicula] = useState(true)
  const tema = useTemaSitio()

  return (
    <>
      {pelicula && (
        <PeliculaDemo
          datos={datos}
          tema={tema}
          vistaUrl={vistaUrl}
          saltable={saltable}
          onVista={() => marcarRecorridoDemoVisto(username)}
          onTerminar={() => setPelicula(false)}
        />
      )}
      <PedidoDemo pedido={pedido} local={restaurante.nombre} onCerrar={onCerrarPedido} />
    </>
  )
}
