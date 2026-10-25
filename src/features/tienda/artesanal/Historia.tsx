import { motion, useReducedMotion } from 'motion/react'
import { EASE } from '../compartido/movimiento'
import type { HistoriaProps } from '../tipos'

const GIROS = [-3, 2.5, -1.5, 3, -2.5, 1.5, -2, 2]

/** La casa contada en una hoja de cuaderno, firmada, con las fotos del local pegadas al lado. */
export function HistoriaArtesanal({ historia, fotos, nombre }: HistoriaProps) {
    const sinMovimiento = useReducedMotion()
    if (!historia?.texto && !fotos.length) return null
    const parrafos = historia?.texto?.split(/\n+/).filter(Boolean) ?? []
    const ambos = fotos.length > 0 && parrafos.length > 0
    return (
        <section aria-label="La casa" className="mx-auto mt-28 max-w-6xl px-5 sm:mt-36 sm:px-8">
            <div
                className={`grid items-center gap-16 ${ambos ? 'lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20' : ''}`}
            >
                {fotos.length > 0 && (
                    <div
                        className={`grid items-start gap-x-5 gap-y-8 px-2 sm:gap-x-8 ${fotos.length > 1 ? 'grid-cols-2' : 'mx-auto w-full max-w-md'} ${!ambos && fotos.length > 2 ? 'lg:grid-cols-4' : ''}`}
                    >
                        {fotos.map((foto, i) => (
                            <motion.figure
                                key={foto}
                                initial={sinMovimiento ? false : { opacity: 0, y: 40, rotate: 0 }}
                                whileInView={{ opacity: 1, y: 0, rotate: GIROS[i % GIROS.length] }}
                                viewport={{ once: true, margin: '-8% 0px' }}
                                transition={{ delay: i * 0.1, duration: 0.9, ease: EASE }}
                                style={sinMovimiento ? { rotate: GIROS[i % GIROS.length] } : undefined}
                                className={`relative bg-card p-2 pb-9 shadow-[0_18px_34px_-22px_rgba(40,25,15,0.6)] sm:p-3 sm:pb-11 ${i % 2 ? 'mt-10' : ''}`}
                            >
                                <span className="artesanal-cinta-papel -top-3 left-[calc(50%-46px)] rotate-2" />
                                <img
                                    src={foto}
                                    alt={`${nombre}, foto ${i + 1}`}
                                    loading="lazy"
                                    className="aspect-[4/5] w-full object-cover"
                                />
                                <figcaption className="tienda-display absolute inset-x-0 bottom-2 text-center text-[15px] italic text-foreground/70 sm:bottom-3 sm:text-base">
                                    {i === 0 ? 'Nuestra casa' : 'Un poquito de acá'}
                                </figcaption>
                            </motion.figure>
                        ))}
                    </div>
                )}
                {parrafos.length > 0 && (
                    <motion.div
                        initial={sinMovimiento ? false : { opacity: 0, y: 30, rotate: 0 }}
                        whileInView={{ opacity: 1, y: 0, rotate: 0.6 }}
                        viewport={{ once: true, margin: '-10% 0px' }}
                        transition={{ duration: 1, ease: EASE }}
                        className="artesanal-renglones min-w-0 py-10 pl-14 pr-6 shadow-[0_22px_40px_-26px_rgba(40,25,15,0.55)] sm:py-14 sm:pl-16 sm:pr-12"
                    >
                        <p className="tienda-display tienda-acento text-xl italic leading-8 sm:text-2xl">
                            Detrás del mostrador
                        </p>
                        <h2 className="tienda-display mt-2 text-[clamp(38px,4.6vw,60px)] leading-[1.02] [overflow-wrap:anywhere]">
                            {historia?.titulo || 'Esta es nuestra casa'}
                        </h2>
                        <div className="mt-6 space-y-8 text-[17px] leading-8 text-foreground sm:text-lg sm:leading-8">
                            {parrafos.map((texto, i) => (
                                <p key={i}>{texto}</p>
                            ))}
                        </div>
                        <p className="tienda-display tienda-acento mt-8 -rotate-2 text-[30px] italic leading-8 sm:text-[36px]">
                            Con cariño, {nombre}.
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    )
}
