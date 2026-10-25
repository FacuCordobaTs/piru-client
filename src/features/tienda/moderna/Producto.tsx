import { fotosDeProducto } from '@/lib/fotosProducto'
import { precioProducto } from '@/lib/tienda'
import { Plus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { EASE } from '../compartido/movimiento'
import { Precio } from '../compartido/Precio'
import type { ProductoCarta } from '../tipos'

/** Un plato con foto: la foto manda, redonda y grande, con el "+" sentado en su esquina. El primero de
 * una categoría larga ocupa el doble y abre el mosaico. */
export function TarjetaModerna<T extends ProductoCarta>({
    producto,
    indice,
    className = '',
    ancho = false,
    grande = false,
    forma = 'cuadrada',
    onAbrir,
}: {
    producto: T
    indice: number
    className?: string
    /** A lo ancho de la grilla en el celular. */
    ancho?: boolean
    /** Dos por dos en escritorio. */
    grande?: boolean
    /** En escritorio: cuadrada en el mosaico, apaisada si son dos, y a lo ancho con el texto al lado si
     * es el único plato con foto de la categoría. */
    forma?: 'cuadrada' | 'apaisada' | 'sola'
    onAbrir: (producto: T) => void
}) {
    const fotos = fotosDeProducto(producto)
    const { descuento } = precioProducto(producto)
    const sinMovimiento = useReducedMotion()
    return (
        <motion.button
            type="button"
            onClick={() => onAbrir(producto)}
            initial={sinMovimiento ? false : { opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{ delay: (indice % 4) * 0.07, duration: 0.8, ease: EASE }}
            className={`group flex min-w-0 flex-col text-left focus-visible:outline-none ${forma === 'sola' ? 'lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-x-12' : ''} ${className}`}
        >
            <span
                className={`relative block overflow-hidden rounded-[22px] bg-secondary ring-offset-4 ring-offset-background transition-[border-radius] duration-500 group-hover:rounded-[34px] group-focus-visible:ring-4 group-focus-visible:ring-ring sm:rounded-[28px] ${ancho ? 'aspect-[4/3]' : 'aspect-square'} ${grande ? 'lg:aspect-auto lg:min-h-[420px] lg:flex-1' : forma === 'cuadrada' ? 'lg:aspect-square' : 'lg:aspect-[4/3]'} ${forma === 'sola' ? 'lg:row-span-4' : ''}`}
            >
                <img
                    src={fotos[0]}
                    alt={producto.nombre}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
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
                {descuento > 0 && (
                    <span className="tienda-fondo-complemento tienda-display absolute left-2.5 top-2.5 rounded-full px-3 py-1.5 text-[15px] leading-none sm:left-3 sm:top-3 sm:text-[17px]">
                        -{descuento}%
                    </span>
                )}
                <span
                    aria-hidden
                    className="absolute bottom-2.5 right-2.5 grid size-11 place-items-center rounded-full bg-card text-foreground shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)] transition-[background-color,color,transform] duration-300 group-hover:rotate-90 group-hover:bg-primary group-hover:text-primary-foreground group-active:scale-90 sm:bottom-3 sm:right-3 sm:size-12"
                >
                    <Plus className="size-5" strokeWidth={2.5} />
                </span>
            </span>
            <span
                className={`tienda-display mt-3.5 block [overflow-wrap:anywhere] leading-[1.08] ${ancho ? 'text-[24px]' : 'text-[17px]'} ${grande || forma !== 'cuadrada' ? 'sm:text-[clamp(24px,2.6vw,34px)]' : 'sm:text-[21px]'} ${forma === 'sola' ? 'lg:text-[clamp(34px,3.6vw,52px)] lg:leading-[0.98]' : ''}`}
            >
                {producto.nombre}
            </span>
            {producto.descripcion && (
                <span
                    className={`mt-1.5 block text-muted-foreground line-clamp-2 leading-snug ${ancho ? 'text-[14px]' : 'text-[13px]'} ${grande || forma !== 'cuadrada' ? 'sm:text-[15px]' : 'sm:text-sm'} ${forma === 'sola' ? 'lg:line-clamp-none lg:text-lg' : ''}`}
                >
                    {producto.descripcion}
                </span>
            )}
            <span
                className={`mt-2 block text-[15px] ${grande || forma !== 'cuadrada' ? 'sm:text-lg' : ''} ${forma === 'sola' ? 'lg:mt-5 lg:text-xl' : ''}`}
            >
                <Precio producto={producto} />
            </span>
        </motion.button>
    )
}
