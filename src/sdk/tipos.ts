/**
 * Contrato público de `@piru/tienda`, el SDK de los sitios de Páginas (docs/PAGINAS_PROPIAS.md, §6).
 *
 * Este archivo es la fuente de los tipos que ven el editor (Monaco) y la Guía para Claude:
 * `scripts/build-runtime.ts` lo convierte en `piru-tienda.d.ts` (declara cada export de `ApiTienda`).
 * Por eso no importa nada salvo tipos de React. `index.ts` se verifica contra `ApiTienda` con
 * `satisfies`: si cambia una firma, cambia acá.
 */
import type { ReactElement } from 'react'

export type EstadoCarga = 'cargando' | 'listo' | 'error'

/** Escenarios de la vista previa del editor. En producción siempre es `null`. */
export type Escenario =
    | 'cargando'
    | 'error'
    | 'abierto'
    | 'cerrado'
    | 'cerrado-programados'
    | 'pausado'
    | 'sin-productos'
    | 'sin-categorias'
    | 'producto-agotado'
    | 'solo-canje'
    | 'con-puntos'
    | 'con-campana'
    | 'carrito-vacio'
    | 'carrito-con-items'

export interface Sitio {
    slug: string
    username: string
    restauranteId: number
    /** `true` dentro del editor: el checkout no navega y el tracking está apagado. */
    isPreview: boolean
    escenario: Escenario | null
}

/** Un turno de atención. `diaSemana`: 0 = domingo. Horas `HH:MM:SS`. */
export interface Turno {
    diaSemana: number
    horaApertura: string
    horaCierre: string
}

export interface Franja {
    id: number
    nombre: string
    horaInicio: string
    horaFin: string
}

export interface Sucursal {
    id: number
    nombre: string
    direccion: string | null
}

export interface MetodoPago {
    id: string
    label: string
}

export interface ReglasPuntos {
    /** Pesos gastados por cada punto que se suma. */
    pesosPorPunto: number | null
    permiteCanjeEnvioGratis: boolean
    permiteCanjeDescuento: boolean
}

export interface Local {
    id: number
    username: string
    nombre: string
    /** Logo para fondos oscuros (o el único que haya). */
    logo: string | null
    /** Logo para fondos claros (o el único que haya). */
    logoClaro: string | null
    colores: { primario: string | null; secundario: string | null }
    direccion: string | null
    telefono: string | null
    instagram: string | null
    whatsapp: string | null
    abierto: boolean
    /** "hoy a las 19:30", "Vie 20:00"… o `null`. */
    proximaApertura: string | null
    /** La tienda está pausada por la suscripción: se ve, pero no toma pedidos. */
    pausado: boolean
    deliveryEnabled: boolean
    takeawayEnabled: boolean
    /** Costo de envío base ("envío desde"); el final se calcula en el checkout. */
    deliveryFee: number | null
    metodosPago: MetodoPago[]
    sistemaPuntos: boolean
    configuracionPuntos: ReglasPuntos | null
    horarios: Turno[]
    sucursales: Sucursal[]
    franjas: Franja[]
    permiteProgramados: boolean
    soloProgramados: boolean
}

export type EstadoLocal =
    | { estado: 'cargando'; local: null }
    | { estado: 'error'; local: null }
    | { estado: 'listo'; local: Local }

export interface Opcion {
    id: number
    nombre: string
    /** Variantes: precio de la variante. Extras: lo que suma. */
    precio: number
}

export interface Ingrediente {
    id: number
    nombre: string
}

export interface OpcionesProducto {
    variantes: Opcion[]
    tituloVariantes: string
    variantesSecundarias: Opcion[]
    tituloVariantesSecundarias: string
    agregadosPrimarios: Opcion[]
    tituloAgregadosPrimarios: string
    agregadosSecundarios: Opcion[]
    tituloAgregadosSecundarios: string
    ingredientes: Ingrediente[]
    permiteNota: boolean
    tituloNota: string
}

export type ResultadoAgregar = { ok: true } | { ok: false; reason: 'requires-options' | 'unavailable' }

export interface Producto {
    id: number
    nombre: string
    descripcion: string | null
    imagenUrl: string | null
    imagenesExtra: string[]
    /** Portada + galería, sin repetidas. */
    fotos: string[]
    /** Precio de lista (sin descuento). */
    precio: number
    /** Precio con el descuento vigente del producto. */
    precioFinal: number
    /** Porcentaje 0–100. */
    descuento: number
    categoriaId: number | null
    categoria: string | null
    disponible: boolean
    soloCanjePuntos: boolean
    variantes: Opcion[]
    variantesSecundarias: Opcion[]
    agregados: Opcion[]
    agregadosPrimarios: Opcion[]
    agregadosSecundarios: Opcion[]
    ingredientes: Ingrediente[]
    permiteNota: boolean
    tituloNota: string
    puntosNecesarios: number | null
    puntosGanados: number | null
    /** Tiene variantes que hay que elegir: `agregar()` devuelve `requires-options`. */
    requiereOpciones: boolean
    /** Tiene algo para personalizar (variantes, extras, ingredientes o nota). */
    tieneOpciones: boolean
    opciones: OpcionesProducto
    /** Abre la hoja de opciones de Piru (variantes, extras, ingredientes, nota y cantidad). */
    abrir(): void
    /** Agrega sin opciones. Con variantes obligatorias no agrega y devuelve `requires-options`. */
    agregar(cantidad?: number): ResultadoAgregar
}

export interface Seccion {
    id: string
    nombre: string
    productos: Producto[]
}

export interface Carta {
    /** Categorías en el orden del local; dentro de cada una, primero los productos con foto. */
    secciones: Seccion[]
    /** Todos los productos de venta, en el orden de `secciones`. */
    productos: Producto[]
    /** Productos que sólo se canjean por puntos (el canje se resuelve en el checkout). */
    canjes: Producto[]
    /** El producto destacado elegido por el local en Ajustes → Tienda, o `null`. */
    destacado: Producto | null
}

/** La personalización de Ajustes → Tienda, normalizada. Todo es opcional. */
export interface Contenido {
    plantilla: 'elegante' | 'moderna' | 'artesanal'
    frase: string | null
    bajada: string | null
    portadaUrl: string | null
    galeria: string[]
    cinta: string[]
    historia: { titulo: string | null; texto: string } | null
    instagram: string | null
    whatsapp: string | null
    colores: { fondo: string | null; texto: string | null; acento: string | null; superficie: string | null }
    fuentes: { titulos: string | null; cuerpo: string | null }
}

export interface Horarios {
    abierto: boolean
    proximaApertura: string | null
    /** "Abierto · hasta las 23:45", "Cerrado · abrimos hoy a las 19:45"… */
    texto: string
    turnos: Turno[]
    franjas: Franja[]
    permiteProgramados: boolean
    soloProgramados: boolean
}

export interface ItemCarrito {
    productoId: number
    cantidad?: number
    varianteId?: number
    varianteSecundariaId?: number
    agregados?: number[]
    ingredientesExcluidos?: number[]
    nota?: string
}

export interface LineaCarrito {
    key: string
    productoId: number
    nombre: string
    imagenUrl: string | null
    cantidad: number
    /** Variantes, extras, "Sin …" y la nota, como texto. */
    opciones: string[]
    precioUnitario: number
    subtotal: number
    subtotalFormatted: string
    disponible: boolean
}

export type MotivoBloqueo = null | 'empty' | 'closed' | 'paused' | 'unavailable'

export interface CarritoApi {
    add(item: ItemCarrito): ResultadoAgregar
    /** Sin `key` saca todas las líneas del producto. */
    remove(productoId: number, key?: string): void
    set(key: string, cantidad: number): void
    quantity(productoId: number): number
    clear(): void
    lines: LineaCarrito[]
    count: number
    /** Subtotal de los ítems, decimal como string. El envío, los cupones y los puntos van en el checkout. */
    total: string
    totalFormatted: string
    canCheckout: boolean
    blockReason: MotivoBloqueo
    submitting: boolean
    error: string | null
    /** Lleva el carrito al checkout de Piru (`my.piru.app`). En la vista previa sólo avisa. */
    checkout(): Promise<void>
}

export interface Campana {
    slug: string
    nombre: string
    descuentoPorcentaje: number
    /** Si la campaña apunta a un producto. */
    productoId: number | null
}

export interface EstadoCampana {
    campana: Campana
    producto: Producto | null
}

export interface Puntos {
    habilitado: boolean
    reglas: ReglasPuntos | null
}

export interface Links {
    tiendaEstandar: string
    whatsapp: string | null
    instagram: string | null
}

export interface NavegacionCarta {
    /** Índice de la sección visible. */
    activa: number
    /** Asignar `ref={(el) => (seccionesRef.current[i] = el)}` a cada sección. */
    seccionesRef: { current: (HTMLElement | null)[] }
    id(indice: number): string
    ir(indice: number): void
}

export interface ApiTienda {
    useSitio(): Sitio
    useLocal(): EstadoLocal
    useCarta(): Carta
    useContenido(): Contenido
    useHorarios(): Horarios
    useCarrito(): CarritoApi
    useCampana(): EstadoCampana | null
    usePuntos(): Puntos
    useLinks(): Links
    useNavegacionCarta(cantidad: number): NavegacionCarta
    /** $2.000 o $2.000,50. */
    formatPesos(valor: number | string): string
    /** "19:30" a partir de "19:30:00". */
    formatHora(hora: string): string
    /** "12:00 – 15:00 · 20:00 – 00:00" para un día (0 = domingo). */
    turnosDelDia(turnos: Turno[], dia: number): string
    textoEstado(turnos: Turno[], estado: { abierto: boolean; proximaApertura: string | null }): string
    DIAS: string[]
    /** Días en orden de lunes a domingo (índices de `DIAS`). */
    SEMANA: number[]
    fotosDeProducto(producto: { imagenUrl?: string | null; imagenesExtra?: string[] | null }): string[]
    logoPara(local: Local, sobreOscuro: boolean): string | null
    precioProducto(producto: { precio: number | string; descuento?: number | null }): { original: number; descuento: number; final: number }
    ordenVisual<T extends { imagenUrl?: string | null; imagenesExtra?: string[] | null }>(productos: T[]): { conFoto: T[]; sinFoto: T[] }
    /** Bloque de canjes de puntos de Piru (opcional). No muestra nada si el local no tiene canjes. */
    PiruCanjes(props: { titulo?: string }): ReactElement | null
}
