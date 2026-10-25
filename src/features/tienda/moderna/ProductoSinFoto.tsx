import { Plus } from 'lucide-react'
import { Precio } from '../compartido/Precio'
import type { ProductoCarta } from '../tipos'

/** Un renglón grande alrededor del nombre y la descripción, sin una falsa imagen. Se enciende entero al
 * pasar o tocar. */
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
            className="group flex w-full min-w-0 items-center gap-4 rounded-[22px] px-4 py-4 text-left transition-colors duration-200 hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none active:bg-secondary sm:gap-5 sm:px-5 sm:py-5"
        >
            <span className="min-w-0 flex-1">
                <span className="tienda-display block text-[19px] leading-[1.1] [overflow-wrap:anywhere] sm:text-[24px]">
                    {producto.nombre}
                </span>
                {producto.descripcion && (
                    <span className="mt-1.5 block text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                        {producto.descripcion}
                    </span>
                )}
                <span className="mt-2.5 block text-[15px] sm:hidden">
                    <Precio producto={producto} />
                </span>
            </span>
            <span className="hidden shrink-0 text-[17px] sm:block">
                <Precio producto={producto} />
            </span>
            <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition-[background-color,color,transform] duration-300 group-hover:rotate-90 group-hover:bg-primary group-hover:text-primary-foreground group-active:scale-90 sm:size-11"
            >
                <Plus className="size-5" strokeWidth={2.5} />
            </span>
        </button>
    )
}
