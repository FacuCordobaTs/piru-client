/**
 * La demo de un sitio de Páginas (`<username>.piru.app?demo`). El Worker pone `demo: true` en la
 * config del HTML y `PiruSiteRoot` carga este módulo aparte (`lazy`): el sitio publicado que no es
 * una demo no descarga nada de esto.
 *
 * Son los mismos componentes de la tienda estándar (`components/demo/`): el recorrido de
 * bienvenida, la isla que lleva al panel y el pedido de prueba. Se montan sobre el diseño propio
 * en un contenedor `[data-piru-demo]` y su CSS (Tailwind compilado en `build-runtime.ts`) va bajo
 * `@scope`, así no toca los estilos del sitio.
 */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { IslaPanelDemo } from '@/components/demo/IslaPanelDemo'
import { PedidoDemo } from '@/components/demo/PedidoDemo'
import { RecorridoDemo } from '@/components/demo/RecorridoDemo'
import { datosDemo } from '@/components/demo/escenas/datos'
import { useCarta, useLocal, useSitio } from '@piru/tienda'
import { marcarRecorridoDemoVisto, recorridoDemoVisto, type PedidoDemoInfo } from '@/lib/demo'
import type { Tienda } from './store'
import CSS_DEMO from 'piru:demo-css'

export default function PiruDemo({ tienda }: { tienda: Tienda }) {
    const { local } = useLocal()
    const carta = useCarta()
    const sitio = useSitio()
    const [host, setHost] = useState<HTMLDivElement | null>(null)
    const [pedido, setPedido] = useState<PedidoDemoInfo | null>(tienda.get().pedidoDemo)
    const [recorrido, setRecorrido] = useState(() => !recorridoDemoVisto(sitio.username))
    const [isla, setIsla] = useState(false)
    const [scrollDir, setScrollDir] = useState<'up' | 'down' | null>(null)

    // El checkout de la página no crea el pedido en la demo: guarda acá el mensaje de WhatsApp.
    useEffect(() => tienda.subscribe(() => setPedido(tienda.get().pedidoDemo)), [tienda])

    // La isla baja medio segundo después de cerrar el recorrido (o de cargar, si ya lo vio).
    useEffect(() => {
        if (recorrido) return
        const tiempo = window.setTimeout(() => setIsla(true), 500)
        return () => window.clearTimeout(tiempo)
    }, [recorrido])

    // La isla se corre un poco con el scroll, como en la tienda estándar.
    useEffect(() => {
        let ultimo = window.scrollY
        let timer: number | null = null
        const alScroll = () => {
            const y = window.scrollY
            const delta = y - ultimo
            ultimo = y
            if (Math.abs(delta) < 2) return
            setScrollDir(delta > 0 ? 'down' : 'up')
            if (timer) window.clearTimeout(timer)
            timer = window.setTimeout(() => setScrollDir(null), 150)
        }
        window.addEventListener('scroll', alScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', alScroll)
            if (timer) window.clearTimeout(timer)
        }
    }, [])

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
            {
                nombre: local.nombre,
                imagenUrl: local.logo,
                imagenLightUrl: local.logoClaro,
                // El pedido grupal (sala) todavía no existe en Páginas: no se lo ofrecemos.
                orderGroupEnabled: false,
            },
            productos,
            window.location.host
        )
    }, [local, carta])

    const terminarRecorrido = () => {
        marcarRecorridoDemoVisto(sitio.username)
        setRecorrido(false)
    }

    return (
        <div ref={setHost} data-piru-demo="" style={{ display: 'contents' }}>
            {host &&
                createPortal(
                    <>
                        <style>{CSS_DEMO}</style>
                        {local && datos && (
                            <>
                                <IslaPanelDemo username={sitio.username} visible={isla} scrollDir={scrollDir} />
                                <RecorridoDemo
                                    abierto={recorrido}
                                    datos={datos}
                                    onTerminar={terminarRecorrido}
                                    contenedor={host}
                                />
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
