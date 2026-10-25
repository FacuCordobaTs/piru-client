import { precioProducto } from '@/lib/tienda'
import { ArrowUpRight } from 'lucide-react'
import type { PortadaProps } from '../tipos'
import { Garabato } from './Garabato'
import { PrecioArtesanal } from './Precio'

/** La recomendación de la casa, escrita con tiza en la pizarra del mostrador. */
export function FavoritoArtesanal({ producto, onAbrir }: NonNullable<PortadaProps['destacado']>) {
    const { descuento } = precioProducto(producto)
    return (
        <button
            type="button"
            onClick={onAbrir}
            aria-label={`Una recomendación para vos: ${producto.nombre}`}
            className="artesanal-pizarra group relative block w-full rounded-[4px] px-6 pb-6 pt-7 text-left transition-transform duration-300 hover:-rotate-1 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:px-8 sm:pb-8 sm:pt-9"
        >
            <span
                className={`tienda-display block text-lg italic opacity-80 sm:text-xl ${descuento > 0 ? 'pr-14 sm:pr-16' : ''}`}
            >
                Una recomendación para vos
            </span>
            <span className="tienda-display mt-2 block text-[clamp(32px,3.8vw,48px)] leading-[1] [overflow-wrap:anywhere]">
                {producto.nombre}
            </span>
            <Garabato className="mt-2 h-3 w-36 opacity-70" />
            {producto.descripcion && (
                <span className="mt-4 block text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                    {producto.descripcion}
                </span>
            )}
            <span className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <PrecioArtesanal producto={producto} className="text-[30px] leading-none sm:text-[34px]" />
                <span className="inline-flex items-center gap-1.5 border-b-2 border-current pb-0.5 text-[15px] font-bold">
                    Me tentó
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
            </span>
            {descuento > 0 && (
                <span className="artesanal-sello tienda-fondo-complemento tienda-display absolute -right-3 -top-7 grid size-[76px] rotate-12 place-items-center text-[22px] leading-none shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] sm:-right-6 sm:size-[88px] sm:text-[26px]">
                    -{descuento}%
                </span>
            )}
        </button>
    )
}
