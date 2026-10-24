import { fotosDeProducto } from '@/lib/fotosProducto'
import { ArrowUpRight } from 'lucide-react'
import { Precio } from '../compartido/Precio'
import type { ProductoCarta } from '../tipos'

export function ProductoArtesanal<T extends ProductoCarta>({
    producto,
    onAbrir,
}: {
    producto: T
    onAbrir: (producto: T) => void
}) {
    const foto = fotosDeProducto(producto)[0]
    return (
        <button
            type="button"
            onClick={() => onAbrir(producto)}
            className={`artesanal-papel group grid min-w-0 gap-4 rounded-[4px] border border-border/80 p-3 text-left shadow-[3px_3px_0_0_var(--secondary)] transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4 sm:gap-5 sm:p-4 ${foto ? 'grid-cols-[128px_minmax(0,1fr)] sm:grid-cols-[176px_minmax(0,1fr)]' : 'grid-cols-1'}`}
        >
            {foto && (
                <img
                    src={foto}
                    alt={producto.nombre}
                    loading="lazy"
                    className="aspect-square w-full self-start object-cover"
                />
            )}
            <span className="flex min-w-0 flex-col items-start py-1">
                <span className="tienda-display block text-[26px] leading-[1.08] [overflow-wrap:anywhere] sm:text-[30px]">
                    {producto.nombre}
                </span>
                {producto.descripcion && (
                    <span className="mt-2 line-clamp-3 block text-sm leading-relaxed text-muted-foreground">
                        {producto.descripcion}
                    </span>
                )}
                <span className="mt-auto flex w-full flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-5 text-sm">
                    <Precio producto={producto} />
                    <span className="inline-flex min-h-8 items-center gap-1.5 font-bold text-[color:var(--tienda-acento-legible)]">
                        Elegir <ArrowUpRight className="size-3.5" />
                    </span>
                </span>
            </span>
        </button>
    )
}
