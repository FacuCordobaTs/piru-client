export type PedidoHistorico = {
    id: number
    tipo: 'delivery' | 'takeaway'
    estado: string
    nombreCliente: string | null
    direccion: string | null
    latitud: string | null
    longitud: string | null
    sucursalId: number | null
    metodoPago: string | null
    items: {
        productoId: number
        cantidad: number | null
        varianteId: number | null
        varianteSecundariaId: number | null
        ingredientesExcluidos: unknown
        agregados: unknown
        nota: string | null
        esCanjePuntos: boolean | null
    }[]
}

export const firmaPedido = (pedido: PedidoHistorico) =>
    pedido.items
        .map((item) =>
            JSON.stringify({
                productoId: item.productoId,
                cantidad: item.cantidad ?? 1,
                varianteId: item.varianteId ?? null,
                varianteSecundariaId: item.varianteSecundariaId ?? null,
                ingredientesExcluidos: Array.isArray(item.ingredientesExcluidos)
                    ? [...item.ingredientesExcluidos].map(Number).sort((a, b) => a - b)
                    : [],
                agregados: Array.isArray(item.agregados)
                    ? item.agregados
                          .map((a: { id?: unknown } | null) => Number(a?.id))
                          .filter(Number.isFinite)
                          .sort((a: number, b: number) => a - b)
                    : [],
                nota: item.nota?.trim() || null,
                esCanjePuntos: !!item.esCanjePuntos,
            })
        )
        .sort()
        .join('|')

export const nombreMetodoPago = (metodo?: string | null) => {
    if (!metodo) return ''
    return (
        {
            cash: 'efectivo',
            manual_transfer: 'transferencia',
            transferencia_automatica_cucuru: 'transferencia',
            transferencia_automatica_talo: 'transferencia',
            mercadopago_checkout: 'Mercado Pago',
            mercadopago_bricks: 'tarjeta',
        }[metodo] || metodo.replace(/_/g, ' ')
    )
}

export type HorarioTurno = { diaSemana: number; horaApertura: string; horaCierre: string }

export function formatTimeLeft(fechaFin: string | Date | null): string | null {
    if (!fechaFin) return null
    const now = Date.now()
    const end = new Date(fechaFin).getTime()
    const diff = end - now
    if (diff <= 0) return null
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'menos de 1h'
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

export interface CampanaPublica {
    campanaId: number
    nombre: string
    slug: string
    tipo?: 'adquisicion' | 'recompra' | 'retencion' | 'lo_mismo' | 'reactivacion'
    destinoTipo?: 'tienda' | 'producto' | 'carrito'
    productoId: number | null
    carritoRep?: string | null
    descuentoPorcentaje: number
    beneficioTipo?: 'descuento' | 'puntos'
    puntosBeneficio?: number
    puntosMontoMinimo?: number
    limiteUsos: number | null
    usosActuales: number
    usosRestantes: number | null
    fechaInicio: string | null
    fechaFin: string | null
}

export type CampanaProductoPublica = CampanaPublica

export type ItemCarritoPrearmado = {
    productoId: number
    cantidad: number
    varianteId?: number
    varianteSecundariaId?: number
    agregadoIds: number[]
}

export function parseCarritoPrearmado(rep: string): ItemCarritoPrearmado[] {
    if (/^\d+x\d+(?:-\d+x\d+)*$/.test(rep)) {
        return rep.split('-').map((parte) => {
            const [productoId, cantidad] = parte.split('x').map(Number)
            return { productoId, cantidad, agregadoIds: [] }
        })
    }
    if (!rep.startsWith('v2:')) return []
    try {
        const bruto: unknown = JSON.parse(rep.slice(3))
        if (!Array.isArray(bruto)) return []
        return bruto.flatMap((item): ItemCarritoPrearmado[] => {
            if (!item || typeof item !== 'object') return []
            const raw = item as Record<string, unknown>
            if (!Number.isInteger(raw.p) || !Number.isInteger(raw.q) || (raw.q as number) < 1) return []
            if (raw.v !== undefined && !Number.isInteger(raw.v)) return []
            if (raw.s !== undefined && !Number.isInteger(raw.s)) return []
            if (raw.a !== undefined && (!Array.isArray(raw.a) || raw.a.some((id) => !Number.isInteger(id))))
                return []
            return [
                {
                    productoId: raw.p as number,
                    cantidad: Math.min(99, raw.q as number),
                    ...(raw.v === undefined ? {} : { varianteId: raw.v as number }),
                    ...(raw.s === undefined ? {} : { varianteSecundariaId: raw.s as number }),
                    agregadoIds: (raw.a ?? []) as number[],
                },
            ]
        })
    } catch {
        return []
    }
}

export const extrasTrackingCampana = (
    campana: CampanaPublica | null,
    metadata: Record<string, unknown> = {}
) => ({
    ...(campana ? { touch: { tipo: 'campana' as const, campanaId: campana.campanaId } } : {}),
    ...(campana || Object.keys(metadata).length
        ? {
              metadata: { ...metadata, ...(campana ? { campaniaSlug: campana.slug } : {}) },
          }
        : {}),
})

export type AvisoDescuento = { titulo: string; detalle: string }

export const avisoDescuento = (porcentaje: number, exclusivo = false): AvisoDescuento =>
    exclusivo
        ? { titulo: 'Oferta exclusiva', detalle: `${porcentaje}% OFF por 48 horas, aplicado a tu pedido` }
        : { titulo: '¡Te extrañamos!', detalle: `${porcentaje}% OFF aplicado a tu pedido` }
