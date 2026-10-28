/**
 * Lo puro del SDK: normaliza la respuesta pública de la tienda, arma la carta, calcula el carrito y
 * aplica los escenarios de la vista previa. No usa React ni el navegador.
 *
 * Reutiliza las reglas de la tienda estándar (precios, orden visual, horarios, destacado) en lugar de
 * copiarlas: si cambian allá, cambian acá.
 */
import { elegirProductoDestacado, seccionesDeProductos } from '@/features/tienda/catalogo'
import { checkIsOpen } from '@/features/tienda/horarios'
import { fotosDeProducto } from '@/lib/fotosProducto'
import { formatoPesos, leerTienda, ordenVisual, precioProducto, textoEstado } from '@/lib/tienda'
import type {
    Campana,
    Contenido,
    Escenario,
    Franja,
    Horarios,
    ItemCarrito,
    LineaCarrito,
    Local,
    MotivoBloqueo,
    Opcion,
    OpcionesProducto,
    ReglasPuntos,
    Turno,
} from './tipos'

/** Lo que devuelve `GET /public/restaurante/id/:id` en `data`. */
export type RespuestaTienda = {
    restaurante: Record<string, unknown> & { id: number; nombre: string }
    productos: Record<string, unknown>[]
    horarios?: Turno[]
    sucursales?: Record<string, unknown>[]
    franjas?: Franja[]
}

/** Producto sin los métodos (`abrir`, `agregar`), que agrega la capa de React. */
export type ProductoBase = {
    id: number
    nombre: string
    descripcion: string | null
    imagenUrl: string | null
    imagenesExtra: string[]
    fotos: string[]
    precio: number
    precioFinal: number
    descuento: number
    categoriaId: number | null
    categoria: string | null
    categoriaOrden?: number
    disponible: boolean
    soloCanjePuntos: boolean
    variantes: Opcion[]
    variantesSecundarias: Opcion[]
    agregados: Opcion[]
    agregadosPrimarios: Opcion[]
    agregadosSecundarios: Opcion[]
    ingredientes: { id: number; nombre: string }[]
    permiteNota: boolean
    tituloNota: string
    puntosNecesarios: number | null
    puntosGanados: number | null
    requiereOpciones: boolean
    tieneOpciones: boolean
    opciones: OpcionesProducto
}

export type SeccionBase = { id: string; nombre: string; productos: ProductoBase[] }

export type DatosTienda = {
    local: Local
    productos: ProductoBase[]
    secciones: SeccionBase[]
    canjes: ProductoBase[]
    destacado: ProductoBase | null
    contenido: Contenido
}

const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const numero = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}
const id = (v: unknown): number | null => (Number.isSafeInteger(v) && (v as number) > 0 ? (v as number) : null)

const opciones = (lista: unknown): Opcion[] =>
    Array.isArray(lista)
        ? lista
              .map((o) => o as Record<string, unknown>)
              .filter((o) => id(o.id) && texto(o.nombre))
              .map((o) => ({ id: o.id as number, nombre: texto(o.nombre)!, precio: numero(o.precio) ?? 0 }))
        : []

export function normalizarProducto(p: Record<string, unknown>): ProductoBase {
    const agregados = Array.isArray(p.agregados) ? (p.agregados as Record<string, unknown>[]) : []
    const primarios = Array.isArray(p.agregadosPrimarios)
        ? opciones(p.agregadosPrimarios)
        : opciones(agregados.filter((a) => (a.grupo ?? 1) === 1))
    const secundarios = Array.isArray(p.agregadosSecundarios)
        ? opciones(p.agregadosSecundarios)
        : opciones(agregados.filter((a) => a.grupo === 2))
    const variantes = opciones(p.variantes)
    const variantesSecundarias = opciones(p.variantesSecundarias)
    const ingredientes = Array.isArray(p.ingredientes)
        ? (p.ingredientes as Record<string, unknown>[])
              .filter((i) => id(i.id) && texto(i.nombre))
              .map((i) => ({ id: i.id as number, nombre: texto(i.nombre)! }))
        : []
    const permiteNota = p.permiteNota === true
    const tituloNota = texto(p.tituloNota) ?? 'Nota para la cocina'
    const imagenesExtra = Array.isArray(p.imagenesExtra) ? (p.imagenesExtra as unknown[]).filter((u): u is string => typeof u === 'string') : []
    const imagenUrl = texto(p.imagenUrl)
    const precios = precioProducto({ precio: numero(p.precio) ?? 0, descuento: numero(p.descuento) })
    return {
        id: p.id as number,
        nombre: texto(p.nombre) ?? 'Producto',
        descripcion: texto(p.descripcion),
        imagenUrl,
        imagenesExtra,
        fotos: fotosDeProducto({ imagenUrl, imagenesExtra }),
        precio: precios.original,
        precioFinal: precios.final,
        descuento: precios.descuento,
        categoriaId: id(p.categoriaId),
        categoria: texto(p.categoria),
        categoriaOrden: numero(p.categoriaOrden) ?? 0,
        disponible: p.disponible !== false && p.activo !== false,
        soloCanjePuntos: p.soloCanjePuntos === true,
        variantes,
        variantesSecundarias,
        agregados: [...primarios, ...secundarios],
        agregadosPrimarios: primarios,
        agregadosSecundarios: secundarios,
        ingredientes,
        permiteNota,
        tituloNota,
        puntosNecesarios: numero(p.puntosNecesarios),
        puntosGanados: numero(p.puntosGanados),
        requiereOpciones: variantes.length > 0 || variantesSecundarias.length > 0,
        tieneOpciones:
            variantes.length + variantesSecundarias.length + primarios.length + secundarios.length + ingredientes.length > 0 ||
            permiteNota,
        opciones: {
            variantes,
            tituloVariantes: texto(p.tituloVariantesPrimarias) ?? 'Elegí una opción',
            variantesSecundarias,
            tituloVariantesSecundarias: texto(p.tituloVariantesSecundarias) ?? 'Elegí otra opción',
            agregadosPrimarios: primarios,
            tituloAgregadosPrimarios: texto(p.tituloExtrasPrimarios) ?? 'Extras',
            agregadosSecundarios: secundarios,
            tituloAgregadosSecundarios: texto(p.tituloExtrasSecundarios) ?? 'Extras',
            ingredientes,
            permiteNota,
            tituloNota,
        },
    }
}

const slugSeccion = (nombre: string, indice: number) =>
    `${
        nombre
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'seccion'
    }-${indice + 1}`

export function armarCarta(productos: ProductoBase[]): SeccionBase[] {
    const venta = productos.filter((p) => !p.soloCanjePuntos)
    return seccionesDeProductos(
        venta.map((p) => ({ ...p, categoria: p.categoria ?? undefined }))
    ).map((seccion, indice) => {
        const { conFoto, sinFoto } = ordenVisual(seccion.productos)
        const porId = new Map(venta.map((p) => [p.id, p]))
        return {
            id: slugSeccion(seccion.nombre, indice),
            nombre: seccion.nombre,
            productos: [...conFoto, ...sinFoto].map((p) => porId.get(p.id)!),
        }
    })
}

export function normalizarContenido(bruto: unknown): Contenido {
    const t = leerTienda(bruto)
    return {
        plantilla: t.plantilla ?? 'artesanal',
        frase: t.frase ?? null,
        bajada: t.bajada ?? null,
        portadaUrl: t.portadaUrl ?? null,
        galeria: t.galeria ?? [],
        cinta: t.cinta ?? [],
        historia: t.historia?.texto ? { titulo: t.historia.titulo ?? null, texto: t.historia.texto } : null,
        instagram: t.instagram ?? null,
        whatsapp: t.whatsapp ?? null,
        colores: {
            fondo: t.colores?.fondo ?? null,
            texto: t.colores?.texto ?? null,
            acento: t.colores?.acento ?? null,
            superficie: t.colores?.superficie ?? null,
        },
        fuentes: { titulos: t.fuentes?.titulos ?? null, cuerpo: t.fuentes?.cuerpo ?? null },
    }
}

function reglasPuntos(bruto: unknown): ReglasPuntos | null {
    if (!bruto || typeof bruto !== 'object') return null
    const c = bruto as Record<string, unknown>
    return {
        pesosPorPunto: numero(c.pesosPorPunto),
        permiteCanjeEnvioGratis: c.permitirCanjeEnvioGratis === true,
        permiteCanjeDescuento: c.permitirCanjeDescuento === true,
    }
}

export function normalizarTienda(respuesta: RespuestaTienda, ahora = new Date()): DatosTienda {
    const r = respuesta.restaurante
    const horarios = Array.isArray(respuesta.horarios) ? respuesta.horarios : []
    const estado = checkIsOpen(horarios, ahora)
    const contenido = normalizarContenido(r.tienda)
    const telefono = texto(r.telefono)
    const local: Local = {
        id: r.id,
        username: texto(r.username) ?? '',
        nombre: texto(r.nombre) ?? '',
        logo: texto(r.imagenUrl) ?? texto(r.imagenLightUrl),
        logoClaro: texto(r.imagenLightUrl) ?? texto(r.imagenUrl),
        colores: { primario: texto(r.colorPrimario), secundario: texto(r.colorSecundario) },
        direccion: texto(r.direccionTexto) ?? texto(r.direccion),
        telefono,
        instagram: contenido.instagram,
        whatsapp: contenido.whatsapp ?? (telefono ? telefono.replace(/\D/g, '') : null),
        abierto: estado.abierto,
        proximaApertura: estado.proximaApertura,
        pausado: r.pausadoPorSuscripcion === true,
        deliveryEnabled: r.deliveryEnabled !== false,
        takeawayEnabled: r.takeawayEnabled !== false,
        deliveryFee: numero(r.deliveryFee),
        metodosPago: Array.isArray(r.metodosPago)
            ? (r.metodosPago as Record<string, unknown>[])
                  .filter((m) => texto(m.id))
                  .map((m) => ({ id: texto(m.id)!, label: texto(m.label) ?? texto(m.nombre) ?? texto(m.id)! }))
            : [],
        sistemaPuntos: r.sistemaPuntos === true,
        configuracionPuntos: r.sistemaPuntos === true ? reglasPuntos(r.configuracionPuntos) : null,
        horarios,
        sucursales: Array.isArray(respuesta.sucursales)
            ? respuesta.sucursales
                  .filter((s) => id(s.id))
                  .map((s) => ({ id: s.id as number, nombre: texto(s.nombre) ?? '', direccion: texto(s.direccion) }))
            : [],
        franjas: Array.isArray(respuesta.franjas) ? respuesta.franjas : [],
        permiteProgramados: r.permitirPedidosProgramados === true,
        soloProgramados: r.soloPedidosProgramados === true,
    }
    const productos = (Array.isArray(respuesta.productos) ? respuesta.productos : [])
        .filter((p) => id(p.id))
        .map(normalizarProducto)
    const secciones = armarCarta(productos)
    const tiendaBruta = leerTienda(r.tienda)
    return {
        local,
        productos: secciones.flatMap((s) => s.productos),
        secciones,
        canjes: productos.filter((p) => p.soloCanjePuntos && p.disponible && local.sistemaPuntos),
        destacado: elegirProductoDestacado(productos, tiendaBruta.productoDestacadoId),
        contenido,
    }
}

export function horariosDe(local: Local): Horarios {
    return {
        abierto: local.abierto,
        proximaApertura: local.proximaApertura,
        texto: local.pausado
            ? 'Cerrado temporalmente'
            : textoEstado(local.horarios, { abierto: local.abierto, proximaApertura: local.proximaApertura }),
        turnos: local.horarios,
        franjas: local.franjas,
        permiteProgramados: local.permiteProgramados,
        soloProgramados: local.soloProgramados,
    }
}

// ── Carrito ──

/** Una línea guardada: sólo IDs y cantidades, como viaja al servidor. */
export type LineaGuardada = Required<Pick<ItemCarrito, 'productoId'>> & {
    key: string
    cantidad: number
    varianteId?: number
    varianteSecundariaId?: number
    agregados: number[]
    ingredientesExcluidos: number[]
    nota?: string
}

/** La misma combinación de opciones suma cantidad en la misma línea. */
export function claveLinea(item: ItemCarrito): string {
    const agregados = [...new Set(item.agregados ?? [])].sort((a, b) => a - b).join(',')
    const sin = [...new Set(item.ingredientesExcluidos ?? [])].sort((a, b) => a - b).join(',')
    const nota = (item.nota ?? '').trim()
    return [item.productoId, item.varianteId ?? '', item.varianteSecundariaId ?? '', agregados, sin, nota].join('|')
}

export type ValidacionItem = { ok: true; linea: Omit<LineaGuardada, 'key' | 'cantidad'> } | { ok: false; reason: 'requires-options' | 'unavailable' }

/** Valida que las opciones existan en el producto y que estén las obligatorias. */
export function validarItem(producto: ProductoBase | undefined, item: ItemCarrito): ValidacionItem {
    if (!producto || !producto.disponible || producto.soloCanjePuntos) return { ok: false, reason: 'unavailable' }
    const existe = (lista: { id: number }[], valor: number | undefined) => valor === undefined || lista.some((o) => o.id === valor)
    if (producto.variantes.length > 0 && item.varianteId === undefined) return { ok: false, reason: 'requires-options' }
    if (producto.variantesSecundarias.length > 0 && item.varianteSecundariaId === undefined)
        return { ok: false, reason: 'requires-options' }
    if (!existe(producto.variantes, item.varianteId) || !existe(producto.variantesSecundarias, item.varianteSecundariaId))
        return { ok: false, reason: 'unavailable' }
    const agregados = [...new Set(item.agregados ?? [])]
    const sin = [...new Set(item.ingredientesExcluidos ?? [])]
    if (!agregados.every((a) => producto.agregados.some((o) => o.id === a))) return { ok: false, reason: 'unavailable' }
    if (!sin.every((i) => producto.ingredientes.some((o) => o.id === i))) return { ok: false, reason: 'unavailable' }
    const nota = producto.permiteNota ? item.nota?.trim().slice(0, 300) || undefined : undefined
    return {
        ok: true,
        linea: {
            productoId: producto.id,
            ...(item.varianteId !== undefined ? { varianteId: item.varianteId } : {}),
            ...(item.varianteSecundariaId !== undefined ? { varianteSecundariaId: item.varianteSecundariaId } : {}),
            agregados,
            ingredientesExcluidos: sin,
            ...(nota ? { nota } : {}),
        },
    }
}

/** Precio unitario con las mismas reglas que `agregarAlPedido` de la tienda estándar. */
export function precioUnitario(producto: ProductoBase, linea: Omit<LineaGuardada, 'key' | 'cantidad'>): number {
    const variante = producto.variantes.find((v) => v.id === linea.varianteId)
    const secundaria = producto.variantesSecundarias.find((v) => v.id === linea.varianteSecundariaId)
    const base = (variante ? variante.precio : producto.precio) + (secundaria ? secundaria.precio : 0)
    const conDescuento = producto.descuento > 0 ? base * (1 - producto.descuento / 100) : base
    const extras = linea.agregados.reduce((suma, a) => suma + (producto.agregados.find((o) => o.id === a)?.precio ?? 0), 0)
    return Math.round((conDescuento + extras) * 100) / 100
}

export function describirLinea(producto: ProductoBase, linea: Omit<LineaGuardada, 'key' | 'cantidad'>): string[] {
    const partes: string[] = []
    const variante = producto.variantes.find((v) => v.id === linea.varianteId)
    const secundaria = producto.variantesSecundarias.find((v) => v.id === linea.varianteSecundariaId)
    if (variante) partes.push(variante.nombre)
    if (secundaria) partes.push(secundaria.nombre)
    for (const a of linea.agregados) {
        const agregado = producto.agregados.find((o) => o.id === a)
        if (agregado) partes.push(`+ ${agregado.nombre}`)
    }
    for (const i of linea.ingredientesExcluidos) {
        const ingrediente = producto.ingredientes.find((o) => o.id === i)
        if (ingrediente) partes.push(`Sin ${ingrediente.nombre}`)
    }
    if (linea.nota) partes.push(`“${linea.nota}”`)
    return partes
}

export function lineasCarrito(guardadas: LineaGuardada[], productos: ProductoBase[]): LineaCarrito[] {
    const porId = new Map(productos.map((p) => [p.id, p]))
    return guardadas.map((g) => {
        const producto = porId.get(g.productoId)
        const valida = validarItem(producto, g)
        const unitario = producto && valida.ok ? precioUnitario(producto, valida.linea) : 0
        return {
            key: g.key,
            productoId: g.productoId,
            nombre: producto?.nombre ?? 'Producto no disponible',
            imagenUrl: producto?.imagenUrl ?? null,
            cantidad: g.cantidad,
            opciones: producto ? describirLinea(producto, g) : [],
            precioUnitario: unitario,
            subtotal: unitario * g.cantidad,
            subtotalFormatted: formatoPesos(unitario * g.cantidad),
            disponible: valida.ok,
        }
    })
}

export function motivoBloqueo(lineas: LineaCarrito[], local: Local | null): MotivoBloqueo {
    if (lineas.length === 0) return 'empty'
    if (local?.pausado) return 'paused'
    if (local && !local.abierto && !local.permiteProgramados) return 'closed'
    if (lineas.some((l) => !l.disponible)) return 'unavailable'
    return null
}

/** Lee lo guardado en `sessionStorage` y descarta lo que no tiene forma de línea. */
export function leerLineasGuardadas(bruto: unknown): LineaGuardada[] {
    if (!Array.isArray(bruto)) return []
    const lineas: LineaGuardada[] = []
    for (const v of bruto.slice(0, 50)) {
        if (!v || typeof v !== 'object') continue
        const l = v as Record<string, unknown>
        const productoId = id(l.productoId)
        const cantidad = Number(l.cantidad)
        if (!productoId || !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 99) continue
        const lista = (x: unknown) => (Array.isArray(x) ? x.filter((n): n is number => id(n) !== null) : [])
        const item: ItemCarrito = {
            productoId,
            ...(id(l.varianteId) ? { varianteId: l.varianteId as number } : {}),
            ...(id(l.varianteSecundariaId) ? { varianteSecundariaId: l.varianteSecundariaId as number } : {}),
            agregados: lista(l.agregados),
            ingredientesExcluidos: lista(l.ingredientesExcluidos),
            ...(typeof l.nota === 'string' && l.nota.trim() ? { nota: l.nota.trim().slice(0, 300) } : {}),
        }
        lineas.push({ ...(item as LineaGuardada), agregados: item.agregados!, ingredientesExcluidos: item.ingredientesExcluidos!, cantidad, key: claveLinea(item) })
    }
    return lineas
}

// ── Escenarios de la vista previa ──

export const ESCENARIOS: { id: Escenario; nombre: string }[] = [
    { id: 'abierto', nombre: 'Abierto' },
    { id: 'cargando', nombre: 'Cargando' },
    { id: 'error', nombre: 'Error al cargar' },
    { id: 'cerrado', nombre: 'Cerrado' },
    { id: 'cerrado-programados', nombre: 'Cerrado, con programados' },
    { id: 'pausado', nombre: 'Pausado por suscripción' },
    { id: 'sin-productos', nombre: 'Sin productos' },
    { id: 'sin-categorias', nombre: 'Productos sin categoría' },
    { id: 'producto-agotado', nombre: 'Producto no disponible' },
    { id: 'solo-canje', nombre: 'Productos sólo de canje' },
    { id: 'con-puntos', nombre: 'Con puntos' },
    { id: 'con-campana', nombre: 'Con campaña' },
    { id: 'carrito-vacio', nombre: 'Carrito vacío' },
    { id: 'carrito-con-items', nombre: 'Carrito con ítems' },
]

/** Transforma la respuesta real para probar un estado. `cargando` y `error` los resuelve el runtime. */
export function aplicarEscenario(respuesta: RespuestaTienda, escenario: Escenario | null): RespuestaTienda {
    if (!escenario) return respuesta
    const r = { ...respuesta, restaurante: { ...respuesta.restaurante }, productos: respuesta.productos.map((p) => ({ ...p })) }
    // Un horario que no está abierto ahora: un solo turno, mañana a la noche.
    const cerrado = () => {
        const manana = (new Date().getDay() + 1) % 7
        r.horarios = [{ diaSemana: manana, horaApertura: '20:00:00', horaCierre: '23:30:00' }]
    }
    switch (escenario) {
        case 'abierto':
            r.horarios = []
            r.restaurante.pausadoPorSuscripcion = false
            break
        case 'cerrado':
            cerrado()
            r.restaurante.permitirPedidosProgramados = false
            break
        case 'cerrado-programados':
            cerrado()
            r.restaurante.permitirPedidosProgramados = true
            r.franjas = [{ id: 1, nombre: 'Noche', horaInicio: '20:00:00', horaFin: '23:00:00' }]
            break
        case 'pausado':
            r.restaurante.pausadoPorSuscripcion = true
            break
        case 'sin-productos':
            r.productos = []
            break
        case 'sin-categorias':
            r.productos = r.productos.map((p) => ({ ...p, categoria: null, categoriaId: null }))
            break
        case 'producto-agotado':
            if (r.productos[0]) r.productos[0] = { ...r.productos[0], disponible: false }
            break
        case 'solo-canje':
            r.restaurante.sistemaPuntos = true
            r.productos = r.productos.map((p, i) => (i < 2 ? { ...p, soloCanjePuntos: true, puntosNecesarios: 500 } : p))
            break
        case 'con-puntos':
            r.restaurante.sistemaPuntos = true
            r.restaurante.configuracionPuntos = { pesosPorPunto: 100, permitirCanjeEnvioGratis: true, permitirCanjeDescuento: true }
            break
    }
    return r
}

/** Campaña de ejemplo del escenario `con-campana`: 15% sobre el primer producto. */
export function campanaDeEjemplo(productos: ProductoBase[]): Campana {
    return { slug: 'ejemplo', nombre: 'Campaña de ejemplo', descuentoPorcentaje: 15, productoId: productos[0]?.id ?? null }
}

export { formatoPesos }

/** Una línea como viaja al servidor: sin la clave interna. */
export function sinClave(linea: LineaGuardada): Omit<LineaGuardada, 'key'> {
    const { productoId, cantidad, varianteId, varianteSecundariaId, agregados, ingredientesExcluidos, nota } = linea
    return { productoId, cantidad, varianteId, varianteSecundariaId, agregados, ingredientesExcluidos, nota }
}
