import { fotosDeProducto } from '@/lib/fotosProducto'
import { formatoPesos } from '@/lib/tienda'
import { Plus, Utensils } from 'lucide-react'
import type { ProductoTienda } from '../datos'
import { formatTimeLeft, type CampanaProductoPublica } from './modelo'

/** La oferta de un Smart Link con producto: va antes de la carta, con la foto y el precio grandes. */
export const CampanaProductoHero = ({
    campana,
    producto,
    onClick,
}: {
    campana: CampanaProductoPublica
    producto: ProductoTienda
    onClick: () => void
}) => {
    const precioOriginal = Number(producto.precio || 0)
    const descuento = Math.max(0, Number(producto.descuento || campana.descuentoPorcentaje || 0))
    const precioFinal = precioOriginal * (1 - descuento / 100)
    const portada = fotosDeProducto(producto)[0]
    const plazo = campana.fechaFin ? formatTimeLeft(campana.fechaFin) : null
    return (
        <section className="overflow-hidden rounded-[32px] bg-foreground text-background">
            <button
                type="button"
                onClick={onClick}
                className="grid w-full text-left sm:grid-cols-[minmax(240px,1fr)_1.1fr]"
            >
                {portada ? (
                    <img
                        src={portada}
                        alt={producto.nombre}
                        className="h-64 w-full object-cover sm:h-full sm:min-h-80"
                    />
                ) : (
                    <div className="flex min-h-48 items-center justify-center bg-primary">
                        <Utensils className="size-14 text-primary-foreground/70" />
                    </div>
                )}
                <div className="flex flex-col justify-center p-6 sm:p-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                            Oferta especial
                        </span>
                        {campana.usosRestantes != null && (
                            <span className="text-xs font-semibold opacity-60">
                                Quedan {campana.usosRestantes}
                            </span>
                        )}
                    </div>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
                        {campana.nombre}
                    </p>
                    <h2 className="tienda-display mt-2 text-4xl leading-[0.95] [overflow-wrap:anywhere] sm:text-5xl">
                        {producto.nombre}
                    </h2>
                    {producto.descripcion && (
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed opacity-70">
                            {producto.descripcion}
                        </p>
                    )}
                    <div className="mt-6 flex items-end gap-3 tabular-nums">
                        <span className="tienda-display text-4xl leading-none">
                            {formatoPesos(precioFinal)}
                        </span>
                        {descuento > 0 && (
                            <>
                                <span className="pb-0.5 text-sm font-semibold line-through opacity-50">
                                    {formatoPesos(precioOriginal)}
                                </span>
                                <span className="mb-0.5 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                                    -{descuento}%
                                </span>
                            </>
                        )}
                    </div>
                    <div className="mt-7 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium opacity-60">
                            {plazo ? `Termina en ${plazo}` : 'Disponible desde este link'}
                        </span>
                        <span className="inline-flex h-11 items-center gap-1.5 rounded-full bg-background px-5 text-sm font-semibold text-foreground">
                            Lo quiero <Plus className="size-4" />
                        </span>
                    </div>
                </div>
            </button>
        </section>
    )
}
