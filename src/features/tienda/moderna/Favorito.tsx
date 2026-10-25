import { fotosDeProducto } from '@/lib/fotosProducto'
import { precioProducto } from '@/lib/tienda'
import { ArrowUpRight } from 'lucide-react'
import { Precio } from '../compartido/Precio'
import { TextoCircular } from '../compartido/TextoCircular'
import type { PortadaProps } from '../tipos'
import { Estrella } from './Estrella'

/** El favorito es una tarjeta apoyada sobre el afiche, con un sello que gira. Sin foto, el nombre del
 * plato ocupa su lugar: nunca se reserva un hueco para una imagen que no existe. */
export function FavoritoModerna({ producto, onAbrir }: NonNullable<PortadaProps['destacado']>) {
    const foto = fotosDeProducto(producto)[0]
    const { descuento } = precioProducto(producto)
    return (
        <button
            type="button"
            onClick={onAbrir}
            aria-label={`Nuestro favorito: ${producto.nombre}`}
            data-favorito-con-foto={!!foto}
            className="group relative block w-full pt-5 text-left focus-visible:outline-none sm:pt-8"
        >
            <span className="block overflow-hidden rounded-[24px] bg-card text-card-foreground shadow-[0_40px_70px_-35px_rgba(0,0,0,0.55)] ring-0 transition-transform duration-500 group-hover:-translate-y-1 group-focus-visible:ring-4 group-focus-visible:ring-[var(--tienda-marca-texto)]/50 sm:rounded-[32px]">
                {foto && (
                    <span className="block aspect-[4/3] overflow-hidden bg-secondary">
                        <img
                            src={foto}
                            alt={producto.nombre}
                            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                            fetchPriority="high"
                        />
                    </span>
                )}
                <span className={`block ${foto ? 'p-5 sm:p-7' : 'p-6 pt-8 sm:p-9 sm:pt-12'}`}>
                    <span className="flex items-center gap-2 text-[13px] font-bold text-[color:var(--tienda-acento-legible)]">
                        <Estrella className="size-3.5" />
                        Nuestro favorito
                    </span>
                    <span
                        className={`tienda-display mt-3 block [overflow-wrap:anywhere] ${foto ? 'text-[clamp(26px,2.8vw,38px)] leading-[1.02]' : 'text-[clamp(34px,4.2vw,56px)] leading-[0.98]'}`}
                    >
                        {producto.nombre}
                    </span>
                    {producto.descripcion && (
                        <span
                            className={`mt-3 block text-[15px] leading-relaxed text-muted-foreground sm:text-base ${foto ? 'line-clamp-2' : ''}`}
                        >
                            {producto.descripcion}
                        </span>
                    )}
                    <span className="mt-6 flex flex-wrap items-center justify-between gap-3 text-lg">
                        <Precio producto={producto} />
                        <span className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                            Ver plato{' '}
                            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
                        </span>
                    </span>
                </span>
            </span>
            <span
                aria-hidden
                className="tienda-fondo-complemento pointer-events-none absolute right-3 top-0 grid size-[88px] place-items-center rounded-full sm:-right-5 sm:size-28"
            >
                <TextoCircular
                    texto="NUESTRO FAVORITO ✦ PEDILO YA ✦ "
                    className="moderna-giro absolute inset-0 size-full"
                />
                {descuento > 0 ? (
                    <span className="tienda-display text-[20px] leading-none sm:text-[24px]">
                        -{descuento}%
                    </span>
                ) : (
                    <Estrella className="size-6 sm:size-7" />
                )}
            </span>
        </button>
    )
}
