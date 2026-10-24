import { formatoPesos, precioProducto } from '@/lib/tienda'
import type { ProductoCarta } from '../tipos'

export function Precio({ producto }: { producto: ProductoCarta }) {
    const { original, final, descuento } = precioProducto(producto)
    return (
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums">
            <span className="font-bold">{formatoPesos(final)}</span>
            {descuento > 0 && (
                <>
                    <del className="text-xs font-normal text-muted-foreground">{formatoPesos(original)}</del>
                    <span className="text-xs font-bold text-[color:var(--tienda-acento-legible)]">
                        −{descuento}%
                    </span>
                </>
            )}
        </span>
    )
}
