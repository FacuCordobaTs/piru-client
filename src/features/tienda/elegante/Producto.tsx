import { fotosDeProducto } from '@/lib/fotosProducto'
import { formatoPesos, precioProducto } from '@/lib/tienda'
import { Clock, Plus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { EASE } from '../compartido/movimiento'
import type { ProductoCarta } from '../tipos'

const vence = (fechaFin?: string | Date | null) => {
    if (!fechaFin) return null
    const diff = new Date(fechaFin).getTime() - Date.now()
    if (diff <= 0) return null
    const horas = Math.floor(diff / 3600000)
    if (horas < 1) return 'menos de 1h'
    return horas < 24 ? `${horas}h` : `${Math.floor(horas / 24)}d`
}

export function Precio({ producto, centrado = false }: { producto: ProductoCarta; centrado?: boolean }) {
    const { original, descuento, final } = precioProducto(producto)
    const plazo = descuento > 0 ? vence(producto.descuentoFechaFin) : null
    return (
        <span
            className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums ${centrado ? 'justify-center' : 'justify-end'}`}
        >
            {descuento > 0 && (
                <span className="text-xs text-muted-foreground line-through">{formatoPesos(original)}</span>
            )}
            <span className={`text-[15px] font-bold ${descuento > 0 ? 'tienda-acento' : 'text-foreground'}`}>
                {formatoPesos(final)}
            </span>
            {plazo && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {plazo}
                </span>
            )}
        </span>
    )
}

/** Un plato con foto: la foto enmarcada, el "+" sentado en su borde y el texto centrado debajo. */
export function PlatoLamina({
    producto,
    indice,
    suelto,
    onClick,
}: {
    producto: ProductoCarta
    indice: number
    suelto: boolean
    onClick: () => void
}) {
    const fotos = fotosDeProducto(producto)
    const { descuento } = precioProducto(producto)
    const sinMovimiento = useReducedMotion()
    return (
        <motion.button
            type="button"
            onClick={onClick}
            initial={sinMovimiento ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-6% 0px' }}
            transition={{ delay: (indice % 2) * 0.08, duration: 0.8, ease: EASE }}
            className={`group flex min-w-0 flex-col items-center text-center focus-visible:outline-none ${suelto ? 'col-span-2 mx-auto w-[calc(50%-8px)] md:col-span-1 md:w-full' : ''}`}
        >
            <span className="relative block w-full">
                {/* La foto en un marco fino, como una lámina pegada en la carta. */}
                <span className="block border border-foreground/30 p-1.5 transition-colors duration-300 group-hover:border-foreground group-focus-visible:border-foreground">
                    <span className="relative block aspect-[4/5] w-full overflow-hidden bg-secondary">
                        <img
                            src={fotos[0]}
                            alt={producto.nombre}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        />
                        {fotos[1] && (
                            <img
                                src={fotos[1]}
                                alt=""
                                aria-hidden
                                loading="lazy"
                                className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 [@media(hover:hover)]:group-hover:opacity-100"
                            />
                        )}
                    </span>
                </span>
                {descuento > 0 && (
                    <span className="tienda-display absolute -right-2 -top-2 grid size-14 rotate-12 place-items-center rounded-full bg-primary text-[17px] leading-none text-primary-foreground shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)]">
                        -{descuento}%
                    </span>
                )}
                <span
                    aria-hidden
                    className="absolute -bottom-5 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full bg-foreground text-background ring-4 ring-background transition-[background-color,color,transform] duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-active:scale-95"
                >
                    <Plus className="size-5" />
                </span>
            </span>
            <span className="mt-8 block px-1 text-[16px] font-semibold leading-snug text-foreground break-words sm:text-[17px]">
                {producto.nombre}
            </span>
            {producto.descripcion && (
                <span className="mt-1 line-clamp-2 px-1 text-[13px] leading-snug text-muted-foreground">
                    {producto.descripcion}
                </span>
            )}
            <span className="mt-2 block">
                <Precio producto={producto} centrado />
            </span>
        </motion.button>
    )
}

/** Un plato sin foto: un renglón de carta impresa, con puntos guía hasta el precio y un "+" al final
 * que dice que se agrega tocándolo. Todo el renglón se resalta al pasar o tocar. */
export function PlatoRenglon({ producto, onClick }: { producto: ProductoCarta; onClick: () => void }) {
    const { descuento } = precioProducto(producto)
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Agregar ${producto.nombre}`}
            className="group -mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3 rounded-2xl px-3 py-4 text-left transition-colors duration-200 hover:bg-secondary active:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
        >
            <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-3">
                    <span className="min-w-0 text-[17px] font-semibold leading-snug text-foreground">
                        {producto.nombre}
                        {descuento > 0 && (
                            <span className="ml-2 inline-block rounded-full bg-primary px-2 py-0.5 align-middle text-[10px] font-bold text-primary-foreground">
                                -{descuento}%
                            </span>
                        )}
                    </span>
                    <span
                        aria-hidden
                        className="mb-1 min-w-6 flex-1 border-b-2 border-dotted border-foreground/25"
                    />
                    <span className="shrink-0">
                        <Precio producto={producto} />
                    </span>
                </span>
                {producto.descripcion && (
                    <span className="mt-1 block text-[13.5px] leading-snug text-muted-foreground">
                        {producto.descripcion}
                    </span>
                )}
            </span>
            <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center text-foreground transition-[color,transform] duration-200 group-hover:text-[color:var(--tienda-acento-legible)] group-active:scale-90"
            >
                <Plus className="size-6" strokeWidth={2.25} />
            </span>
        </button>
    )
}

// ── La casa y el colofón ──

/** La historia del local como una cita grande y sus fotos enmarcadas y escalonadas. Sin ninguna de las
 * dos, no aparece. */
