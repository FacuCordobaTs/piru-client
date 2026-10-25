import { fotosDeProducto } from '@/lib/fotosProducto'
import { precioProducto } from '@/lib/tienda'
import { Plus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { EASE } from '../compartido/movimiento'
import type { ProductoCarta } from '../tipos'
import { PrecioArtesanal } from './Precio'

const GIROS = ['-rotate-[1.6deg]', 'rotate-[1.2deg]', '-rotate-[0.6deg]', 'rotate-[1.8deg]']

/** Un plato con foto: una copia en papel pegada con cinta, un poco torcida, que se endereza al tocarla. */
export function FotoArtesanal<T extends ProductoCarta>({
    producto,
    indice,
    sola = false,
    onAbrir,
}: {
    producto: T
    indice: number
    /** Única foto de su categoría: a lo ancho, con el texto grande al lado en escritorio. */
    sola?: boolean
    onAbrir: (producto: T) => void
}) {
    const fotos = fotosDeProducto(producto)
    const { descuento } = precioProducto(producto)
    const sinMovimiento = useReducedMotion()
    return (
        <motion.button
            type="button"
            onClick={() => onAbrir(producto)}
            initial={sinMovimiento ? false : { opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-6% 0px' }}
            transition={{ delay: (indice % 3) * 0.08, duration: 0.8, ease: EASE }}
            className={`group flex min-w-0 flex-col text-left focus-visible:outline-none ${sola ? 'col-span-2 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:content-center lg:items-center lg:gap-x-16' : ''}`}
        >
            <span
                className={`relative block bg-card p-2 pb-2.5 ${sola ? 'lg:row-span-4' : ''} shadow-[0_16px_30px_-20px_rgba(40,25,15,0.6)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:rotate-0 group-focus-visible:rotate-0 group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ring sm:p-3 ${GIROS[indice % GIROS.length]}`}
            >
                <span
                    className={`artesanal-cinta-papel -top-3 ${indice % 2 ? 'left-[calc(50%-30px)] rotate-3' : 'left-[calc(50%-62px)] -rotate-3'}`}
                />
                <span
                    className={`relative block overflow-hidden bg-secondary ${sola ? 'aspect-[4/3] lg:aspect-square' : 'aspect-square'}`}
                >
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
                {descuento > 0 && (
                    <span className="artesanal-sello tienda-fondo-complemento tienda-display absolute -right-2.5 -top-3 grid size-14 rotate-12 place-items-center text-[17px] leading-none sm:-right-4 sm:-top-5 sm:size-[70px] sm:text-[21px]">
                        -{descuento}%
                    </span>
                )}
            </span>
            <span
                className={`tienda-display mt-5 block leading-[1.08] [overflow-wrap:anywhere] ${sola ? 'text-[28px] sm:text-[34px] lg:mt-0 lg:self-end lg:text-[clamp(40px,4.4vw,60px)] lg:leading-[1]' : 'text-[19px] sm:text-[25px]'}`}
            >
                {producto.nombre}
            </span>
            {producto.descripcion && (
                <span
                    className={`mt-1.5 block leading-snug text-foreground/70 ${sola ? 'text-[15px] sm:text-[17px] lg:mt-4 lg:text-lg lg:leading-relaxed' : 'line-clamp-2 text-[13.5px] sm:text-[15px]'}`}
                >
                    {producto.descripcion}
                </span>
            )}
            <span
                className={`mt-auto flex items-center gap-2.5 pt-3 ${sola ? 'lg:max-w-md lg:self-start lg:pt-6' : ''}`}
            >
                <PrecioArtesanal
                    producto={producto}
                    className={sola ? 'text-[24px] sm:text-[30px]' : 'text-[19px] sm:text-[22px]'}
                />
                <span
                    aria-hidden
                    className="mb-1 min-w-3 flex-1 self-end border-b-2 border-dotted border-foreground/30"
                />
                <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-[4px] bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] transition-transform duration-150 group-hover:-translate-y-0.5 group-active:translate-x-0.5 group-active:translate-y-0.5 group-active:shadow-none sm:size-10"
                >
                    <Plus className="size-5" strokeWidth={2.5} />
                </span>
            </span>
        </motion.button>
    )
}

/** Un plato sin foto: un renglón escrito con tiza, con puntos hasta el precio. */
export function RenglonPizarra<T extends ProductoCarta>({
    producto,
    onAbrir,
}: {
    producto: T
    onAbrir: (producto: T) => void
}) {
    const { descuento } = precioProducto(producto)
    return (
        <button
            type="button"
            onClick={() => onAbrir(producto)}
            className="group -mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3 rounded-[4px] px-3 py-3.5 text-left transition-colors duration-200 hover:bg-background/[0.07] focus-visible:bg-background/[0.07] focus-visible:outline-none active:bg-background/10"
        >
            <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-3">
                    <span className="tienda-display min-w-0 text-[21px] leading-tight decoration-2 underline-offset-4 [overflow-wrap:anywhere] group-hover:underline sm:text-[25px]">
                        {producto.nombre}
                        {descuento > 0 && (
                            <span className="ml-2 inline-block -rotate-3 border-2 border-current px-1.5 align-middle font-sans text-[11px] font-bold not-italic leading-tight">
                                -{descuento}%
                            </span>
                        )}
                    </span>
                    <span
                        aria-hidden
                        className="mb-1.5 min-w-5 flex-1 border-b-2 border-dotted border-current opacity-35"
                    />
                    <PrecioArtesanal producto={producto} className="shrink-0 text-[20px] sm:text-[23px]" />
                </span>
                {producto.descripcion && (
                    <span className="mt-1 block text-[14px] leading-snug text-muted-foreground sm:text-[15px]">
                        {producto.descripcion}
                    </span>
                )}
            </span>
            <span
                aria-hidden
                className="mt-1 grid size-7 shrink-0 place-items-center opacity-60 transition-[opacity,transform] duration-200 group-hover:rotate-90 group-hover:opacity-100"
            >
                <Plus className="size-5" strokeWidth={2.5} />
            </span>
        </button>
    )
}
