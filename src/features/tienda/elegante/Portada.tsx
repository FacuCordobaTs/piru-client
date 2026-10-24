import { FirmaMarca } from '../compartido/FirmaMarca'
import { fotosDeProducto } from '@/lib/fotosProducto'
import { precioProducto } from '@/lib/tienda'
import { ArrowDown, Plus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { LineaDatos } from '../compartido/LineaDatos'
import { EASE } from '../compartido/movimiento'
import type { PortadaProps, ProductoCarta } from '../tipos'
import { Mancheta } from './Mancheta'
import { Precio } from './Producto'

export function BotonPrincipal({ children, onClick }: { children: ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group inline-flex h-14 items-center gap-3 rounded-full bg-foreground pl-6 pr-2 text-[15px] font-semibold text-background transition-transform duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            {children}
            <span className="grid size-10 place-items-center rounded-full tienda-fondo-marca transition-transform duration-300 group-hover:translate-y-0.5">
                <ArrowDown className="size-4" />
            </span>
        </button>
    )
}

/** La portada: la mancheta, la línea de datos y debajo dos columnas: el logo con el slogan, la bajada
 * y las acciones; y el "Recomendado de la casa", un plato enmarcado como en una carta impresa. */
export function PortadaElegante({
    nombre,
    logo,
    frase,
    bajada,
    datos,
    aviso,
    accionPrincipal,
    acciones,
    destacado,
    contenido,
}: PortadaProps) {
    const sinMovimiento = useReducedMotion()
    const aparecer = (demora: number) => ({
        initial: sinMovimiento ? false : { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: demora, duration: 0.8, ease: EASE },
    })

    return (
        <header className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
            <Mancheta nombre={nombre} />
            <FirmaMarca className="mt-4 h-1.5" />
            <motion.div {...aparecer(0.3)}>
                <LineaDatos items={datos} />
            </motion.div>

            <div
                className={`mt-10 grid items-center gap-14 md:mt-14 ${destacado ? 'md:grid-cols-[1.05fr_0.95fr] md:gap-16' : ''}`}
            >
                <div>
                    {aviso}
                    <div className={frase ? 'flex items-start gap-5' : ''}>
                        {logo && (
                            <motion.span
                                initial={sinMovimiento ? false : { opacity: 0, scale: 0.7, rotate: -12 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ delay: 0.35, type: 'spring', stiffness: 220, damping: 16 }}
                                className={`block shrink-0 ${frase ? 'size-20 sm:size-24' : 'size-28 sm:size-32'}`}
                            >
                                <img src={logo} alt={nombre} className="size-full object-contain" />
                            </motion.span>
                        )}
                        {frase && (
                            <motion.p
                                {...aparecer(0.45)}
                                className="tienda-display min-w-0 text-[clamp(32px,8.5vw,64px)] leading-[0.96] text-foreground break-words hyphens-auto"
                            >
                                {frase}
                            </motion.p>
                        )}
                    </div>
                    {bajada && (
                        <motion.p
                            {...aparecer(0.55)}
                            className={`max-w-md text-[16px] leading-relaxed text-foreground/75 sm:text-[17px] ${frase || logo ? 'mt-6' : ''}`}
                        >
                            {bajada}
                        </motion.p>
                    )}
                    {contenido}
                    <motion.div
                        {...aparecer(0.65)}
                        className={`flex flex-wrap items-center gap-2.5 ${frase || bajada || logo || aviso ? 'mt-8' : ''}`}
                    >
                        <BotonPrincipal onClick={accionPrincipal.onClick}>
                            {accionPrincipal.texto}
                        </BotonPrincipal>
                        {acciones}
                    </motion.div>
                </div>

                {destacado && (
                    <motion.div
                        initial={sinMovimiento ? false : { opacity: 0, y: 40, rotate: 1.5 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        transition={{ delay: 0.5, duration: 1, ease: EASE }}
                    >
                        <PlatoDestacado producto={destacado.producto} onClick={destacado.onAbrir} />
                    </motion.div>
                )}
            </div>
        </header>
    )
}

/** El plato recomendado: una ficha con doble filete, como un recuadro de carta impresa, con su
 * título calado en el borde. Con foto, la foto arriba; sin foto, sólo tipografía. */
function PlatoDestacado({ producto, onClick }: { producto: ProductoCarta; onClick: () => void }) {
    const foto = fotosDeProducto(producto)[0]
    const { descuento } = precioProducto(producto)
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative block w-full border-[1.5px] border-[var(--tienda-complemento)] p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-background px-3 text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-foreground">
                Recomendado de la casa
            </span>
            <span className="block border border-foreground/40 p-3 sm:p-4">
                {foto && (
                    <span className="relative block aspect-[4/3] overflow-hidden bg-secondary">
                        <img
                            src={foto}
                            alt={producto.nombre}
                            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />
                        {descuento > 0 && (
                            <span className="tienda-display absolute right-3 top-3 grid size-14 rotate-12 place-items-center rounded-full bg-primary text-[17px] leading-none text-primary-foreground shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)]">
                                -{descuento}%
                            </span>
                        )}
                    </span>
                )}
                <span className={`block ${foto ? 'pt-5' : 'pt-4'}`}>
                    <span className="tienda-display block text-[clamp(28px,7.5vw,44px)] leading-[0.98] text-foreground break-words hyphens-auto">
                        {producto.nombre}
                    </span>
                    {producto.descripcion && (
                        <span className="mt-2 line-clamp-3 block text-[14.5px] leading-snug text-muted-foreground">
                            {producto.descripcion}
                        </span>
                    )}
                    <span className="mt-5 flex items-center gap-3">
                        <Precio producto={producto} />
                        <span
                            aria-hidden
                            className="min-w-6 flex-1 border-b-2 border-dotted border-foreground/30"
                        />
                        <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform group-active:scale-95">
                            Lo quiero <Plus className="size-4" />
                        </span>
                    </span>
                </span>
            </span>
        </button>
    )
}
