import { motion, useReducedMotion } from 'motion/react'
import { EASE } from '../compartido/movimiento'
import type { HistoriaProps } from '../tipos'

export function HistoriaElegante({ historia, fotos, nombre }: HistoriaProps) {
    const sinMovimiento = useReducedMotion()
    if (!historia?.texto && fotos.length === 0) return null
    const parrafos = historia?.texto?.split(/\n+/).filter(Boolean) ?? []
    return (
        <section aria-label="La casa" className="mx-auto max-w-6xl px-4 pt-32 sm:px-6">
            {historia?.texto && (
                <div className="mx-auto max-w-3xl text-center">
                    <span
                        aria-hidden
                        className="tienda-display tienda-acento block h-16 text-[140px] leading-[0.9]"
                    >
                        “
                    </span>
                    {historia.titulo && (
                        <h2 className="tienda-display text-[clamp(34px,8vw,64px)] leading-[0.95] text-foreground">
                            {historia.titulo}
                        </h2>
                    )}
                    <div className="mt-6 space-y-4 text-[18px] leading-relaxed text-foreground/80 sm:text-xl">
                        {parrafos.map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>
                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        — {nombre}
                    </p>
                </div>
            )}
            {fotos.length > 0 && (
                <div
                    className={`tienda-sin-barra -mx-4 flex snap-x snap-mandatory scroll-px-4 items-end gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 ${fotos.length <= 3 ? 'md:justify-center' : ''} ${historia?.texto ? 'mt-16' : ''}`}
                >
                    {fotos.map((src, i) => (
                        <motion.img
                            key={src}
                            src={src}
                            alt={nombre}
                            loading="lazy"
                            initial={sinMovimiento ? false : { opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-10% 0px' }}
                            transition={{ delay: i * 0.1, duration: 1, ease: EASE }}
                            className={`shrink-0 snap-start border border-foreground/30 object-cover p-1.5 ${i % 2 === 0 ? 'h-[380px] w-[64vw] sm:w-[300px]' : 'h-[300px] w-[52vw] sm:w-[240px]'}`}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
