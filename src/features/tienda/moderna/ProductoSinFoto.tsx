import { ArrowUpRight } from 'lucide-react'
import { Precio } from '../compartido/Precio'
import type { ProductoCarta } from '../tipos'

/** Una fila de carta diseñada alrededor del nombre y la descripción, sin una falsa imagen. */
export function ProductoSinFotoModerna<T extends ProductoCarta>({
    producto,
    onAbrir,
}: {
    producto: T
    onAbrir: (producto: T) => void
}) {
    return (
        <button
            type="button"
            onClick={() => onAbrir(producto)}
            className="group grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 gap-y-4 border-b border-border py-6 text-left transition-colors hover:border-foreground/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
        >
            <span className="min-w-0">
                <span className="tienda-display block text-[clamp(22px,2.2vw,30px)] leading-[1.2] tracking-[-0.035em] [overflow-wrap:anywhere]">
                    {producto.nombre}
                </span>
                {producto.descripcion && (
                    <span className="mt-3 block max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {producto.descripcion}
                    </span>
                )}
            </span>
            <span className="flex max-w-36 flex-col items-end gap-4 pt-1 text-right">
                <Precio producto={producto} />
                <span className="inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                    Elegir <ArrowUpRight className="size-4" />
                </span>
            </span>
        </button>
    )
}
