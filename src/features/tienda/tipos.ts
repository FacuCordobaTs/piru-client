import type { TiendaConfig, Turno } from '@/lib/tienda'
import type { ComponentType, ReactNode } from 'react'

/** Contrato visual: las plantillas reciben datos y acciones, nunca hacen compras ni peticiones. */
export type ProductoCarta = {
    id: number
    nombre: string
    descripcion?: string | null
    precio?: number | string
    descuento?: number | null
    descuentoFechaFin?: string | Date | null
    imagenUrl?: string | null
    imagenesExtra?: string[] | null
}
export type SeccionCarta<T extends ProductoCarta = ProductoCarta> = { nombre: string; productos: T[] }
export type CartaProps<T extends ProductoCarta = ProductoCarta> = {
    secciones: SeccionCarta<T>[]
    onAbrir: (producto: T) => void
    titulo?: string
}
export type PortadaProps = {
    nombre: string
    logo: string | null
    frase?: string
    bajada?: string
    portadaUrl?: string
    datos: ReactNode[]
    aviso?: ReactNode
    accionPrincipal: { texto: string; onClick: () => void }
    acciones?: ReactNode
    contenido?: ReactNode
    destacado?: { producto: ProductoCarta; onAbrir: () => void } | null
}
export type HistoriaProps = { historia?: TiendaConfig['historia']; fotos: string[]; nombre: string }
export type PieProps = {
    nombre: string
    logo: string | null
    direccion?: string | null
    horarios: Turno[]
    instagram?: string
    whatsapp?: string
    onPedir?: () => void
}
export type PedidoProps = {
    cantidad: number
    total: string
    visible: boolean
    onClick: () => void
    pulso?: boolean
    texto?: string
}
export type Plantilla = {
    Portada: ComponentType<PortadaProps>
    Carta: <T extends ProductoCarta>(props: CartaProps<T>) => ReactNode
    Historia: ComponentType<HistoriaProps>
    Pie: ComponentType<PieProps>
    Pedido: ComponentType<PedidoProps>
}
