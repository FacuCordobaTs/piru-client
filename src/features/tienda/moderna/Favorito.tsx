import { fotosDeProducto } from '@/lib/fotosProducto'
import { ArrowUpRight } from 'lucide-react'
import { Precio } from '../compartido/Precio'
import type { PortadaProps } from '../tipos'

/** El recomendado tiene composición propia sin foto; no reserva un hueco para reemplazarla. */
export function FavoritoModerna({ producto, onAbrir }: NonNullable<PortadaProps['destacado']>) {
    const foto = fotosDeProducto(producto)[0]
    return (
        <button
            type="button"
            onClick={onAbrir}
            aria-label={`Nuestro favorito: ${producto.nombre}`}
            data-favorito-con-foto={!!foto}
            className="group block w-full overflow-hidden rounded-[32px] border-t-[6px] border-[var(--tienda-complemento)] bg-card text-left ring-1 ring-border transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
        >
            {foto && (
                <img
                    src={foto}
                    alt={producto.nombre}
                    className="aspect-[5/4] w-full object-cover"
                    fetchPriority="high"
                />
            )}
            <span className={`block ${foto ? 'p-6 sm:p-7' : 'p-7 sm:p-10'}`}>
                <span className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--tienda-acento-legible)]">
                    <span aria-hidden className="h-px w-8 bg-current" />
                    Nuestro favorito
                </span>
                <span
                    className={`tienda-display block [overflow-wrap:anywhere] ${foto ? 'text-[clamp(26px,3vw,38px)] leading-[1.15]' : 'text-[clamp(32px,4vw,52px)] leading-[1.12]'}`}
                >
                    {producto.nombre}
                </span>
                {producto.descripcion && (
                    <span
                        className={`mt-4 block text-base leading-relaxed text-muted-foreground ${foto ? 'line-clamp-3' : ''}`}
                    >
                        {producto.descripcion}
                    </span>
                )}
                <span
                    className={`mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5 ${foto ? '' : 'sm:mt-12'}`}
                >
                    <Precio producto={producto} />
                    <span className="inline-flex min-h-11 items-center gap-3 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform group-active:scale-95">
                        Ver plato <ArrowUpRight className="size-4" />
                    </span>
                </span>
            </span>
        </button>
    )
}
