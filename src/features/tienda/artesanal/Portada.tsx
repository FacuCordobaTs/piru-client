import { fotosDeProducto } from '@/lib/fotosProducto'
import { ArrowDown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { EASE } from '../compartido/movimiento'
import type { PortadaProps } from '../tipos'
import { FavoritoArtesanal } from './Favorito'
import { Garabato } from './Garabato'
import './artesanal.css'

/** La entrada del almacén: el toldo a rayas, el cartel con el nombre, la foto de la casa pegada con
 * cinta, la recomendación escrita en la pizarra y el mantel debajo. */
export function PortadaArtesanal({
    nombre,
    logo,
    frase,
    bajada,
    portadaUrl,
    datos,
    aviso,
    accionPrincipal,
    acciones,
    destacado,
    contenido,
}: PortadaProps) {
    const sinMovimiento = useReducedMotion()
    const aparecer = (demora: number) => ({
        initial: sinMovimiento ? false : { opacity: 0, y: 22 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: demora, duration: 0.8, ease: EASE },
    })
    const foto = portadaUrl || (destacado ? fotosDeProducto(destacado.producto)[0] : undefined)
    const visibles = datos.filter(Boolean)
    return (
        <header aria-label="Bienvenida a la casa">
            <div aria-hidden data-color-marca="primario" className="tienda-fondo-marca h-3 sm:h-4" />
            <motion.div
                aria-hidden
                initial={sinMovimiento ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.9, ease: EASE }}
                className="artesanal-toldo h-16 origin-top sm:h-24"
            />

            <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 sm:pt-12">
                {(logo || visibles.length > 0) && (
                    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
                        {logo && (
                            <motion.span
                                initial={sinMovimiento ? false : { opacity: 0, rotate: -6, y: -20 }}
                                animate={{ opacity: 1, rotate: -2, y: 0 }}
                                transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 14 }}
                                className="artesanal-papel block rounded-[4px] border-2 border-foreground p-2.5 shadow-[5px_5px_0_0_var(--foreground)] sm:p-3"
                            >
                                <img
                                    src={logo}
                                    alt=""
                                    className="h-16 w-auto max-w-[180px] object-contain sm:h-20"
                                    fetchPriority="high"
                                />
                            </motion.span>
                        )}
                        {visibles.length > 0 && (
                            <motion.ul
                                {...aparecer(0.4)}
                                className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 text-[14px] font-bold text-foreground/80"
                            >
                                {visibles.map((dato, i) => (
                                    <li key={i} className="flex min-w-0 items-center gap-3">
                                        {i > 0 && (
                                            <span aria-hidden className="tienda-acento text-xs">
                                                ✦
                                            </span>
                                        )}
                                        <span className="min-w-0 break-words">{dato}</span>
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </div>
                )}

                <div
                    className={`grid gap-14 pb-16 pt-10 sm:pt-14 ${foto || destacado ? 'lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-16' : 'max-w-3xl'}`}
                >
                    <div className="min-w-0">
                        {aviso}
                        <motion.p
                            data-color-marca="secundario"
                            initial={sinMovimiento ? false : { opacity: 0, x: -30, rotate: -2 }}
                            animate={{ opacity: 1, x: 0, rotate: -2 }}
                            transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
                            className="artesanal-lazo tienda-fondo-complemento tienda-display inline-block py-2 text-[19px] italic leading-snug sm:text-2xl"
                        >
                            Qué bueno tenerte por acá.
                        </motion.p>
                        <motion.h1
                            {...aparecer(0.3)}
                            className="tienda-display tienda-acento mt-6 text-[clamp(60px,10.5vw,136px)] leading-[0.88] [overflow-wrap:anywhere] [text-wrap:balance]"
                        >
                            {nombre}
                        </motion.h1>
                        <Garabato className="tienda-acento mt-3 h-4 w-44 sm:w-60" />
                        {frase && frase !== nombre && (
                            <motion.p
                                {...aparecer(0.45)}
                                className="tienda-display mt-7 max-w-xl text-[clamp(26px,3vw,38px)] italic leading-[1.1] [overflow-wrap:anywhere]"
                            >
                                {frase}
                            </motion.p>
                        )}
                        {bajada && (
                            <motion.p
                                {...aparecer(0.55)}
                                className="mt-4 max-w-lg text-[17px] leading-relaxed text-foreground/80 sm:text-lg"
                            >
                                {bajada}
                            </motion.p>
                        )}
                        {contenido}
                        <motion.div {...aparecer(0.65)} className="mt-9 space-y-3">
                            <button
                                type="button"
                                onClick={accionPrincipal.onClick}
                                className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-[4px] bg-primary px-7 py-3 text-base font-bold text-primary-foreground shadow-[4px_4px_0_0_var(--foreground)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--foreground)] active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                            >
                                {accionPrincipal.texto}
                                <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                            </button>
                            <div className="artesanal-acciones flex flex-wrap gap-3">{acciones}</div>
                        </motion.div>
                    </div>

                    {(foto || destacado) && (
                        <div className="relative min-w-0 px-2 sm:px-6 lg:px-0">
                            {foto && (
                                <motion.figure
                                    initial={sinMovimiento ? false : { opacity: 0, y: 40, rotate: 7 }}
                                    animate={{ opacity: 1, y: 0, rotate: 2 }}
                                    transition={{ delay: 0.35, duration: 1, ease: EASE }}
                                    className={`relative ml-auto w-[92%] bg-card p-3 shadow-[0_26px_44px_-26px_rgba(40,25,15,0.55)] sm:w-[86%] sm:p-4 ${destacado ? 'pb-3 sm:pb-4' : 'pb-12 sm:pb-14'}`}
                                >
                                    <span className="artesanal-cinta-papel -left-5 top-3 -rotate-[38deg]" />
                                    <span className="artesanal-cinta-papel -right-5 top-3 rotate-[38deg]" />
                                    <img
                                        src={foto}
                                        alt={
                                            portadaUrl
                                                ? `Un poquito de ${nombre}`
                                                : destacado?.producto.nombre
                                        }
                                        fetchPriority="high"
                                        className="aspect-[4/5] w-full object-cover sm:aspect-square"
                                    />
                                    {!destacado && (
                                        <figcaption className="tienda-display absolute inset-x-0 bottom-3 text-center text-lg italic text-foreground/75 sm:bottom-4 sm:text-xl">
                                            Un ratito para disfrutar.
                                        </figcaption>
                                    )}
                                </motion.figure>
                            )}
                            {destacado && (
                                <motion.div
                                    initial={sinMovimiento ? false : { opacity: 0, y: 50, rotate: -6 }}
                                    animate={{ opacity: 1, y: 0, rotate: -2 }}
                                    transition={{ delay: 0.6, duration: 1, ease: EASE }}
                                    className={`relative z-10 ${foto ? '-mt-28 w-[90%] sm:-mt-40 sm:w-[78%]' : ''}`}
                                >
                                    <FavoritoArtesanal {...destacado} />
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div aria-hidden className="artesanal-cuadros h-10 sm:h-14" />
        </header>
    )
}
