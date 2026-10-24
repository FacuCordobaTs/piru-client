import { ordenVisual } from '@/lib/tienda'
import type { ProductoCarta, SeccionCarta } from './tipos'

export function seccionesDeProductos<
    T extends ProductoCarta & {
        categoria?: string | null
        categoriaOrden?: number
        soloCanjePuntos?: boolean
    },
>(productos: T[]): SeccionCarta<T>[] {
    const grupos = new Map<string, { orden: number; productos: T[] }>()
    for (const producto of productos) {
        if (producto.soloCanjePuntos) continue
        const nombre = producto.categoria || 'Sin categoría'
        const grupo = grupos.get(nombre) ?? { orden: producto.categoriaOrden ?? 0, productos: [] }
        grupo.productos.push(producto)
        grupos.set(nombre, grupo)
    }
    return [...grupos.entries()]
        .sort(([a, x], [b, y]) =>
            a === b
                ? 0
                : a === 'Sin categoría'
                  ? 1
                  : b === 'Sin categoría'
                    ? -1
                    : x.orden - y.orden || a.localeCompare(b)
        )
        .map(([nombre, grupo]) => ({ nombre, productos: grupo.productos }))
}

/** Las tres cartas muestran primero las fotos y luego los productos sin foto. El detalle usa ese orden. */
export function productosDeSecciones<T extends ProductoCarta>(secciones: SeccionCarta<T>[]): T[] {
    return secciones.flatMap(({ productos }) => {
        const { conFoto, sinFoto } = ordenVisual(productos)
        return [...conFoto, ...sinFoto]
    })
}
