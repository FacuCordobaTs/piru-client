/**
 * Cuentas puras del checkout de Páginas: el pedido que se manda al backend y los totales que se
 * muestran. No usan React ni el navegador, para poder probarlas y para que el checkout del runtime
 * no dependa de la tienda estándar. El backend vuelve a calcular todo al crear el pedido.
 */
import type { ConfiguracionPuntosCheckout, LineaGuardada, ProductoBase } from './datos'

export type AgregadoPedido = { id: number; nombre: string; precio: string }

export type ItemPedido = {
    productoId: number
    cantidad: number
    varianteId?: number
    varianteSecundariaId?: number
    agregados: AgregadoPedido[]
    ingredientesExcluidos: number[]
    nota?: string
}

/** Traduce el carrito del sitio (IDs y cantidades) al alta pública, con los extras del catálogo. */
export function itemsParaPedido(lineas: LineaGuardada[], productos: ProductoBase[]): ItemPedido[] {
    const porId = new Map(productos.map((p) => [p.id, p]))
    return lineas.map((linea) => {
        const producto = porId.get(linea.productoId)
        const agregados = linea.agregados.flatMap((id) => {
            const agregado = producto?.agregados.find((a) => a.id === id)
            return agregado ? [{ id: agregado.id, nombre: agregado.nombre, precio: String(agregado.precio) }] : []
        })
        return {
            productoId: linea.productoId,
            cantidad: Math.max(1, Math.min(99, Math.floor(linea.cantidad))),
            ...(linea.varianteId !== undefined ? { varianteId: linea.varianteId } : {}),
            ...(linea.varianteSecundariaId !== undefined ? { varianteSecundariaId: linea.varianteSecundariaId } : {}),
            agregados,
            ingredientesExcluidos: linea.ingredientesExcluidos,
            ...(linea.nota ? { nota: linea.nota } : {}),
        }
    })
}

/** Descuento por puntos, con la misma regla del backend: sobre los ítems y con tope opcional. */
export function descuentoPuntosCheckout(config: ConfiguracionPuntosCheckout | null, itemsTotal: number): number {
    if (!config?.permiteCanjeDescuento || itemsTotal < config.descuentoMontoMinimo) return 0
    const bruto =
        config.descuentoTipo === 'porcentaje'
            ? itemsTotal * (config.descuentoValor / 100)
            : config.descuentoValor
    const conTope = config.descuentoTope > 0 ? Math.min(bruto, config.descuentoTope) : bruto
    return Math.round(Math.min(Math.max(0, conTope), itemsTotal) * 100) / 100
}

export type TotalesCheckout = {
    subtotal: number
    envio: number
    descuentoPuntos: number
    descuento: number
    total: number
}

/** Ordena los descuentos como el backend: puntos sobre los ítems, envío y cupón al final. */
export function calcularTotalesCheckout({
    itemsTotal,
    deliveryFee,
    canjeEnvio,
    descuentoPuntos,
    descuento,
}: {
    itemsTotal: number
    deliveryFee: number
    canjeEnvio: boolean
    descuentoPuntos: number
    descuento: number
}): TotalesCheckout {
    const subtotal = Math.max(0, itemsTotal)
    const envio = canjeEnvio ? 0 : Math.max(0, deliveryFee)
    const puntos = Math.min(subtotal, Math.max(0, descuentoPuntos))
    const cupon = Math.max(0, descuento)
    const total = Math.max(0, subtotal - puntos + envio - cupon)
    return {
        subtotal: redondear(subtotal),
        envio: redondear(envio),
        descuentoPuntos: redondear(puntos),
        descuento: redondear(cupon),
        total: redondear(total),
    }
}

const redondear = (valor: number) => Math.round(valor * 100) / 100
