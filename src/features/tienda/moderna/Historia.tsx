import { motion, useReducedMotion } from 'motion/react'
import { EASE } from '../compartido/movimiento'
import type { HistoriaProps } from '../tipos'

/** La casa: un campo entero de la tinta, con la historia grande y las fotos en una tira que se arrastra. */
export function HistoriaModerna({ historia, fotos, nombre }: HistoriaProps) {
    const sinMovimiento = useReducedMotion()
    if (!historia?.texto && !fotos.length) return null
    const parrafos = historia?.texto?.split(/\n+/).filter(Boolean) ?? []
    return (
        <section aria-label="La casa" className="px-2 pt-28 sm:px-3 sm:pt-36">
            <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[28px] bg-foreground text-background sm:rounded-[44px]">
                <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-24">
                    <div
                        className={`grid gap-8 ${parrafos.length ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-20' : ''}`}
                    >
                        <h2 className="tienda-display text-[clamp(42px,6.6vw,100px)] leading-[0.9] [overflow-wrap:anywhere] [text-wrap:balance]">
                            {historia?.titulo ||
                                (parrafos.length ? 'Detrás de cada plato' : `Así es ${nombre}`)}
                        </h2>
                        {parrafos.length > 0 && (
                            <div className="space-y-4 text-[17px] leading-relaxed text-background/80 sm:text-lg">
                                {parrafos.map((texto, i) => (
                                    <p key={i}>{texto}</p>
                                ))}
                                <p className="pt-2 font-bold text-background">{nombre}</p>
                            </div>
                        )}
                    </div>
                    {fotos.length > 0 && (
                        <div
                            className={`tienda-sin-barra -mx-5 mt-12 flex ${fotos.length <= 3 ? (fotos.length === 3 ? 'lg:grid-cols-3' : fotos.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1') + ' lg:mx-0 lg:grid lg:px-0' : ''} snap-x snap-mandatory scroll-px-5 items-end gap-3 overflow-x-auto px-5 sm:-mx-8 sm:mt-16 sm:scroll-px-8 sm:gap-4 sm:px-8`}
                        >
                            {fotos.map((foto, i) => (
                                <motion.img
                                    key={foto}
                                    src={foto}
                                    alt={`${nombre}, foto ${i + 1}`}
                                    loading="lazy"
                                    initial={sinMovimiento ? false : { opacity: 0, x: 60 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-5% 0px' }}
                                    transition={{ delay: i * 0.08, duration: 0.9, ease: EASE }}
                                    className={`shrink-0 snap-start rounded-[22px] object-cover sm:rounded-[30px] ${i % 2 === 0 ? 'h-[340px] w-[72vw] sm:h-[440px] sm:w-[360px]' : 'h-[260px] w-[60vw] sm:h-[340px] sm:w-[300px]'} ${fotos.length <= 3 ? 'lg:h-auto lg:w-full lg:aspect-[4/3]' : ''} ${fotos.length === 1 ? 'lg:aspect-[21/9]' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
