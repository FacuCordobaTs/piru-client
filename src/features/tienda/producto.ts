export interface Ingrediente {
    id: number
    nombre: string
}

export interface Agregado {
    id: number
    nombre: string
    precio: string
    grupo?: number
}

export interface Variante {
    id: number
    nombre: string
    precio: string
}

export interface ConfiguracionPuntos {
    pesosPorPunto?: number | string | null
    modoAcumulacion?: string | null
}

export interface Product {
    id: number
    nombre: string
    descripcion: string | null
    precio: number | string
    imagenUrl: string | null
    /** Galería opcional: se recorre deslizando la foto del detalle. La portada es `imagenUrl`. */
    imagenesExtra?: string[] | null
    categoria?: string
    ingredientes?: Ingrediente[]
    agregados?: Agregado[]
    agregadosPrimarios?: Agregado[]
    agregadosSecundarios?: Agregado[]
    variantes?: Variante[]
    variantesSecundarias?: Variante[]
    tituloVariantesPrimarias?: string
    tituloVariantesSecundarias?: string
    tituloExtrasPrimarios?: string
    tituloExtrasSecundarios?: string
    permiteNota?: boolean
    tituloNota?: string
    descuento?: number | null
    descuentoFechaFin?: string | null
    esCanjePuntos?: boolean
    intentandoCanjear?: boolean
    puntosNecesarios?: number | string | null
    puntosDisponiblesUsuario?: number
    puntosGanados?: number | string | null
    sistemaPuntos?: boolean
    configuracionPuntos?: ConfiguracionPuntos | null
}
