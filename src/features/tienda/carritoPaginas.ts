import { etiquetaVarianteMedallon } from '@/components/CheckoutDeliveryGrupal'
import type { ItemCarritoTienda, ProductoTienda } from './datos'

/**
 * Handoff de Páginas (docs/PAGINAS_PROPIAS.md, §9): el sitio propio crea un carrito en el servidor
 * con sólo IDs y opciones, y el checkout de `my.piru.app/<username>/checkout?carrito=<id>` lo
 * convierte en el carrito de siempre con el catálogo actual. Los precios salen de acá, nunca del
 * sitio; el backend los vuelve a calcular en el alta.
 */

export type ItemCarritoPublico = {
    productoId: number
    cantidad: number
    varianteId?: number
    varianteSecundariaId?: number
    agregados?: number[]
    ingredientesExcluidos?: number[]
    nota?: string
}

export type CarritoPublico = {
    restauranteId: number
    username: string
    items: ItemCarritoPublico[]
    contexto: {
        campaniaSlug?: string
        campanaId?: string
        recetaToken?: string
        codigoPromocional?: string
    } | null
    returnUrl: string | null
}

const claveVolver = (username: string) => `piru_volver_sitio:${username.toLowerCase()}`

/** Las mismas cuentas que `agregarAlPedido` de la tienda. Descarta lo que ya no existe. */
export function hidratarCarrito(
    items: ItemCarritoPublico[],
    productos: ProductoTienda[]
): { items: ItemCarritoTienda[]; descartados: number } {
    const resultado: ItemCarritoTienda[] = []
    let descartados = 0
    for (const item of items) {
        const producto = productos.find((p) => p.id === item.productoId)
        if (!producto || producto.disponible === false || producto.soloCanjePuntos) {
            descartados++
            continue
        }
        const variante = producto.variantes?.find((v) => v.id === item.varianteId)
        const secundaria = producto.variantesSecundarias?.find((v) => v.id === item.varianteSecundariaId)
        const faltaVariante =
            (producto.variantes?.length ?? 0) > 0 !== Boolean(variante) ||
            (producto.variantesSecundarias?.length ?? 0) > 0 !== Boolean(secundaria)
        const agregados = (item.agregados ?? []).map((id) => producto.agregados?.find((a) => a.id === id))
        if (faltaVariante || agregados.some((a) => !a)) {
            descartados++
            continue
        }
        const base = (variante ? parseFloat(variante.precio) : Number(producto.precio)) + (secundaria ? parseFloat(secundaria.precio) : 0)
        const descuento = producto.descuento && producto.descuento > 0 ? producto.descuento : 0
        const conDescuento = descuento ? base * (1 - descuento / 100) : base
        const extras = agregados.reduce((suma, a) => suma + Number(a!.precio || 0), 0)
        const excluidos = (item.ingredientesExcluidos ?? []).filter((id) => producto.ingredientes?.some((i) => i.id === id))
        const variantes = [variante?.nombre, secundaria?.nombre].filter(Boolean).join(' · ')
        resultado.push({
            id: Math.random().toString(36).slice(2, 11),
            productoId: producto.id,
            categoria: producto.categoria,
            productoNombre: producto.nombre,
            tieneSelectorMedallon: producto.agregados?.some((a) => etiquetaVarianteMedallon(a.nombre) !== null) ?? false,
            nombre: variantes ? `${producto.nombre} - ${variantes}` : producto.nombre,
            precio: (conDescuento + extras).toFixed(2),
            precioOriginal: variante ? variante.precio : producto.precio,
            descuento,
            imagenUrl: producto.imagenUrl,
            cantidad: Math.max(1, Math.min(99, Math.floor(item.cantidad || 1))),
            varianteId: variante?.id,
            varianteNombre: variante?.nombre,
            varianteSecundariaId: secundaria?.id,
            varianteSecundariaNombre: secundaria?.nombre,
            ingredientesExcluidos: excluidos,
            ingredientesExcluidosNombres: (producto.ingredientes ?? []).filter((i) => excluidos.includes(i.id)).map((i) => i.nombre),
            agregados: agregados as NonNullable<(typeof agregados)[number]>[],
            nota: producto.permiteNota ? item.nota?.trim() || undefined : undefined,
            esCanjePuntos: false,
            puntosNecesarios: 0,
            puntosGanados: producto.puntosGanados,
        })
    }
    return { items: resultado, descartados }
}

/** Dónde vuelve "Volver a la tienda" después del pedido. Vive en el `sessionStorage` de my.piru.app. */
export function guardarVueltaSitio(username: string, url: string | null) {
    try {
        if (url && /^https:\/\//.test(url)) sessionStorage.setItem(claveVolver(username), url)
        else sessionStorage.removeItem(claveVolver(username))
    } catch {
        /* storage bloqueado */
    }
}

export function leerVueltaSitio(username: string | null | undefined): string | null {
    if (!username) return null
    try {
        const url = sessionStorage.getItem(claveVolver(username))
        if (!url) return null
        const destino = new URL(url)
        if (destino.protocol !== 'https:') return null
        destino.searchParams.set('ok', '1')
        return destino.toString()
    } catch {
        return null
    }
}
