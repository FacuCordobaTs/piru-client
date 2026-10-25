import { resolverPlantilla } from '@/lib/plantillas'
import type { TiendaConfig } from '@/lib/tienda'
import type { ReactNode, Ref } from 'react'
import { plantillas } from './plantillas'
import type { CartaProps, PedidoProps, PieProps, PortadaProps, ProductoCarta } from './tipos'

/** Única composición visual para compra individual, sala y mesa. Las operaciones viven en sus controladores. */
export function TiendaVista<T extends ProductoCarta>({
    tienda,
    portada,
    carta,
    pie,
    pedido,
    antesDeCarta,
    cartaRef,
    children,
}: {
    tienda: TiendaConfig
    portada: PortadaProps
    carta: CartaProps<T>
    pie: PieProps
    pedido: PedidoProps
    antesDeCarta?: ReactNode
    cartaRef?: Ref<HTMLDivElement>
    children?: ReactNode
}) {
    const plantilla = resolverPlantilla(tienda.plantilla)
    const { Portada, Carta, Historia, Pie, Pedido } = plantillas[plantilla]
    const fotos = [
        ...new Set([tienda.portadaUrl, ...(tienda.galeria ?? [])].filter((foto): foto is string => !!foto)),
    ]
    return (
        <div data-plantilla={plantilla}>
            <Portada {...portada} portadaUrl={tienda.portadaUrl} cinta={tienda.cinta} />
            <main className={`mx-auto px-5 sm:px-8 ${plantilla === 'moderna' ? 'max-w-7xl' : 'max-w-6xl'}`}>
                {antesDeCarta}
                <div ref={cartaRef} className="pb-4 pt-16 sm:pt-20">
                    <Carta {...carta} />
                </div>
            </main>
            <Historia historia={tienda.historia} fotos={fotos} nombre={portada.nombre} />
            <Pie {...pie} />
            <Pedido {...pedido} />
            {children}
        </div>
    )
}
