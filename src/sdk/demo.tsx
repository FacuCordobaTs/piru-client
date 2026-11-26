/**
 * La demo de un sitio de Páginas (`<username>.piru.app?demo`). El Worker pone `demo: true` en la
 * config del HTML y `PiruSiteRoot` carga este módulo aparte (`lazy`): el sitio publicado que no es
 * una demo no descarga nada de esto.
 *
 * Son los mismos componentes de la tienda estándar (`components/demo/`): la animación de
 * pantalla completa (`PeliculaDemo`) y el pedido de prueba. Se montan sobre el diseño propio
 * en un contenedor `[data-piru-demo]` y su CSS (Tailwind compilado en `build-runtime.ts`) va bajo
 * `@scope`, así no toca los estilos del sitio.
 *
 * La animación toma el aspecto del sitio (`temaSitio.ts`) y su celular muestra la página real en
 * un iframe (`?demo&vista`); adentro de ese iframe esta demo no monta nada.
 */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { PedidoDemo } from '@/components/demo/PedidoDemo'
import { PeliculaDemo } from '@/components/demo/PeliculaDemo'
import { ESTILO_VISTA, esVistaSitio, urlVistaSitio } from '@/components/demo/VistaSitio'
import { useTemaSitio } from '@/components/demo/temaSitio'
import { datosDemo } from '@/components/demo/escenas/datos'
import { useCarta, useLocal, useSitio } from '@piru/tienda'
import { marcarRecorridoDemoVisto, recorridoDemoVisto, type PedidoDemoInfo } from '@/lib/demo'
import type { Tienda } from './store'
import CSS_DEMO from 'piru:demo-css'

export default function PiruDemo({ tienda }: { tienda: Tienda }) {
    if (esVistaSitio()) return <style>{ESTILO_VISTA}</style>
    return <Demo tienda={tienda} />
}

function Demo({ tienda }: { tienda: Tienda }) {
    const { local } = useLocal()
    const carta = useCarta()
    const sitio = useSitio()
    const [host, setHost] = useState<HTMLDivElement | null>(null)
    const [pedido, setPedido] = useState<PedidoDemoInfo | null>(tienda.get().pedidoDemo)
    const [saltable] = useState(() => recorridoDemoVisto(sitio.username))
    const [pelicula, setPelicula] = useState(true)
    const tema = useTemaSitio(local?.colores.primario)
    const vistaUrl = useMemo(() => urlVistaSitio(), [])

    // El checkout de la página no crea el pedido en la demo: guarda acá el mensaje de WhatsApp.
    useEffect(() => tienda.subscribe(() => setPedido(tienda.get().pedidoDemo)), [tienda])

    // La misma información que la demo de la tienda estándar: el local, su logo y su carta.
    const datos = useMemo(() => {
        if (!local) return null
        const productos = carta.secciones.flatMap((seccion, orden) =>
            seccion.productos.map((p) => ({
                id: p.id,
                nombre: p.nombre,
                descripcion: p.descripcion,
                precio: p.precio,
                imagenUrl: p.imagenUrl,
                categoria: seccion.nombre,
                categoriaOrden: orden,
                disponible: p.disponible,
            }))
        )
        return datosDemo(
            { nombre: local.nombre, imagenUrl: local.logo, imagenLightUrl: local.logoClaro, orderGroupEnabled: false },
            productos,
            window.location.host
        )
    }, [local, carta])

    return (
        <div ref={setHost} data-piru-demo="" style={{ display: 'contents' }}>
            {host &&
                createPortal(
                    <>
                        <style>{CSS_DEMO}</style>
                        {local && datos && (
                            <>
                                {pelicula && (
                                    <PeliculaDemo
                                        datos={datos}
                                        tema={tema}
                                        vistaUrl={vistaUrl}
                                        saltable={saltable}
                                        onVista={() => marcarRecorridoDemoVisto(sitio.username)}
                                        onTerminar={() => setPelicula(false)}
                                    />
                                )}
                                <PedidoDemo
                                    pedido={pedido}
                                    local={local.nombre}
                                    onCerrar={() => tienda.set({ pedidoDemo: null })}
                                    contenedor={host}
                                />
                            </>
                        )}
                    </>,
                    host
                )}
        </div>
    )
}
