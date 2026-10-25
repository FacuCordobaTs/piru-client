import { formatoPesos, precioProducto } from '@/lib/tienda'
import type { ProductoCarta } from '../tipos'

/** El precio escrito con la letra de los títulos, como en una pizarra o una etiqueta. */
export function PrecioArtesanal({
    producto,
    className = '',
}: {
    producto: ProductoCarta
    className?: string
}) {
    const { original, final, descuento } = precioProducto(producto)
    return (
        <span className={`inline-flex flex-wrap items-baseline gap-x-2 tabular-nums ${className}`}>
            {descuento > 0 && (
                <del className="text-[0.62em] font-normal opacity-60">{formatoPesos(original)}</del>
            )}
            <span className="tienda-display">{formatoPesos(final)}</span>
        </span>
    )
}
