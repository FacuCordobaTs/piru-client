import { ArrowUpRight } from 'lucide-react'
import { Precio } from '../compartido/Precio'
import type { PortadaProps } from '../tipos'

export function FavoritoArtesanal({ producto, onAbrir }: NonNullable<PortadaProps['destacado']>) {
    return (
        <button
            type="button"
            onClick={onAbrir}
            aria-label={`Una recomendación para vos: ${producto.nombre}`}
            className="artesanal-papel group relative block w-full rounded-[4px] border border-border border-l-[6px] border-l-[var(--tienda-complemento)] p-5 text-left shadow-[5px_5px_0_0_var(--secondary)] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4 sm:p-7"
        >
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.13em] text-[color:var(--tienda-acento-legible)]">
                Una recomendación para vos
            </span>
            <span className="tienda-display block text-[clamp(28px,3vw,38px)] leading-[1.1] [overflow-wrap:anywhere]">
                {producto.nombre}
            </span>
            {producto.descripcion && (
                <span className="mt-3 block text-base leading-relaxed text-muted-foreground">
                    {producto.descripcion}
                </span>
            )}
            <span className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border pt-4">
                <Precio producto={producto} />
                <span className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[color:var(--tienda-acento-legible)]">
                    Me tentó <ArrowUpRight className="size-4" />
                </span>
            </span>
        </button>
    )
}
