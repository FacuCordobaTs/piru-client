import { ArrowDown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { EASE } from '../compartido/movimiento'
import type { PortadaProps } from '../tipos'
import { Estrella } from './Estrella'
import { FavoritoModerna } from './Favorito'
import './moderna.css'

/** Sin `cinta` propia, palabras que valen para cualquier local que vende por su tienda. */
const CINTA_BASE = ['Pedí online', 'Directo de la cocina', 'Sin intermediarios']

/** La portada es un afiche: un campo entero del color de la marca con el logo, el nombre enorme y el
 * favorito de la casa como una tarjeta apoyada encima. Debajo corre la cinta en el segundo color. */
export function PortadaModerna({
    nombre,
    logo,
    frase,
    bajada,
    portadaUrl,
    cinta,
    datos,
    aviso,
    accionPrincipal,
    acciones,
    destacado,
    contenido,
}: PortadaProps) {
    const sinMovimiento = useReducedMotion()
    const aparecer = (demora: number) => ({
        initial: sinMovimiento ? false : { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: demora, duration: 0.9, ease: EASE },
    })
    const visibles = datos.filter(Boolean)
    const visual = destacado ? (
        <FavoritoModerna {...destacado} />
    ) : portadaUrl ? (
        <img
            src={portadaUrl}
            alt={`La casa de ${nombre}`}
            className="aspect-[5/4] w-full rounded-[24px] object-cover sm:rounded-[32px]"
            fetchPriority="high"
        />
    ) : null

    return (
        <header aria-label="Presentación del restaurante" className="px-2 pt-2 sm:px-3 sm:pt-3">
            <div
                data-color-marca="primario"
                className="tienda-fondo-marca mx-auto max-w-[1600px] overflow-hidden rounded-[28px] sm:rounded-[44px]"
            >
                <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-8 sm:pb-12 sm:pt-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        {logo && (
                            <motion.span
                                initial={sinMovimiento ? false : { opacity: 0, scale: 0.6, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 17 }}
                                className="block shrink-0 rounded-[24px] bg-card p-3 sm:rounded-[30px] sm:p-4"
                            >
                                <img
                                    src={logo}
                                    alt=""
                                    className="h-32 w-auto max-w-[200px] object-contain sm:max-w-[240px]"
                                    fetchPriority="high"
                                />
                            </motion.span>
                        )}
                        {visibles.length > 0 && (
                            <motion.ul
                                {...aparecer(0.25)}
                                className="flex min-w-0 max-w-full flex-wrap gap-2 text-[13px] font-semibold sm:justify-end sm:text-sm"
                            >
                                {visibles.map((dato, i) => (
                                    <li
                                        key={i}
                                        className="moderna-dato min-w-0 max-w-full truncate rounded-full px-3.5 py-2"
                                    >
                                        {dato}
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </div>

                    <div
                        className={`mt-10 grid gap-10 sm:mt-14 ${visual ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] lg:gap-16' : ''}`}
                    >
                        <div className="flex min-w-0 flex-col justify-between gap-10">
                            <motion.h1
                                {...aparecer(0.15)}
                                className={`tienda-display max-w-[14ch] leading-[0.86] [overflow-wrap:anywhere] [text-wrap:balance] text-[18vw] ${visual ? 'sm:text-[clamp(58px,10.5vw,156px)]' : 'sm:text-[clamp(58px,12.5vw,184px)]'}`}
                            >
                                {nombre}
                            </motion.h1>
                            <div className="moderna-sobre-marca max-w-2xl">
                                {frase && frase !== nombre && (
                                    <motion.p
                                        {...aparecer(0.3)}
                                        className="tienda-display max-w-xl text-[clamp(26px,3.3vw,44px)] leading-[1.02] [overflow-wrap:anywhere] [text-wrap:balance]"
                                    >
                                        {frase}
                                    </motion.p>
                                )}
                                {bajada && (
                                    <motion.p
                                        {...aparecer(0.4)}
                                        className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground sm:text-lg"
                                    >
                                        {bajada}
                                    </motion.p>
                                )}
                                <motion.div
                                    {...aparecer(0.5)}
                                    className="mt-8 flex flex-wrap gap-2.5 sm:mt-10"
                                >
                                    <button
                                        type="button"
                                        onClick={accionPrincipal.onClick}
                                        className="group inline-flex h-14 items-center gap-4 rounded-full bg-[var(--tienda-marca-texto)] pl-6 pr-2 text-[15px] font-bold text-[var(--tienda-marca)] transition-transform duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tienda-marca-texto)]/40"
                                    >
                                        {accionPrincipal.texto}
                                        <span className="tienda-fondo-complemento grid size-10 place-items-center rounded-full transition-transform duration-300 group-hover:translate-y-0.5">
                                            <ArrowDown className="size-4" />
                                        </span>
                                    </button>
                                    <div className="moderna-acciones flex flex-wrap gap-2.5">{acciones}</div>
                                </motion.div>
                            </div>
                        </div>
                        {visual && (
                            <motion.div
                                initial={sinMovimiento ? false : { opacity: 0, y: 60, rotate: 5 }}
                                animate={{ opacity: 1, y: 0, rotate: 1.5 }}
                                transition={{ delay: 0.35, duration: 1.1, ease: EASE }}
                                className="relative min-w-0 lg:-mb-2"
                            >
                                {visual}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <Cinta palabras={cinta?.length ? cinta : CINTA_BASE} />

            {(aviso || contenido) && (
                <div className="mx-auto max-w-7xl px-3 pt-10 sm:px-5">
                    {aviso}
                    {contenido}
                </div>
            )}
        </header>
    )
}

/** La cinta del segundo color: las palabras del local corriendo de lado a lado. */
function Cinta({ palabras }: { palabras: string[] }) {
    // Cada copia tiene que ser más ancha que la pantalla para que la vuelta no se note.
    const tira = Array.from({ length: Math.ceil(10 / palabras.length) }, () => palabras).flat()
    return (
        <div
            aria-hidden
            data-color-marca="secundario"
            className="tienda-fondo-complemento mx-auto mt-2 max-w-[1600px] overflow-hidden rounded-[20px] sm:mt-3 sm:rounded-[28px]"
        >
            <div className="moderna-cinta flex w-max">
                {[0, 1].map((copia) => (
                    <div key={copia} className="flex shrink-0 items-center">
                        {tira.map((palabra, i) => (
                            <span
                                key={i}
                                className="tienda-display flex items-center gap-6 whitespace-nowrap py-4 pl-6 text-[22px] uppercase leading-none sm:py-6 sm:text-[32px]"
                            >
                                {palabra}
                                <Estrella className="size-5 sm:size-7" />
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
