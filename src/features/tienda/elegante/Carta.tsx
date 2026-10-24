import { ordenVisual } from '@/lib/tienda'
import { ChevronDown, Utensils } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { EASE } from '../compartido/movimiento'
import type { CartaProps, ProductoCarta, SeccionCarta } from '../tipos'
import { PlatoLamina, PlatoRenglon } from './Producto'

export function CartaElegante<T extends ProductoCarta>({
    secciones,
    onAbrir,
    titulo = 'La carta',
}: CartaProps<T>) {
    const [activa, setActiva] = useState(0)
    const [barra, setBarra] = useState(false)
    const [indiceAbierto, setIndiceAbierto] = useState(false)
    const indiceRef = useRef<HTMLElement | null>(null)
    const finRef = useRef<HTMLDivElement | null>(null)
    const seccionesRef = useRef<(HTMLElement | null)[]>([])
    const total = secciones.reduce((n, s) => n + s.productos.length, 0)
    const conIndice = secciones.length > 1

    useEffect(() => {
        if (!conIndice) return
        const medir = () => {
            const indice = indiceRef.current?.getBoundingClientRect()
            const fin = finRef.current?.getBoundingClientRect()
            const visible = !!indice && indice.bottom < 0 && !!fin && fin.top > 120
            setBarra(visible)
            if (!visible) setIndiceAbierto(false)
        }
        medir()
        window.addEventListener('scroll', medir, { passive: true })
        return () => window.removeEventListener('scroll', medir)
    }, [conIndice])

    useEffect(() => {
        const io = new IntersectionObserver(
            (entradas) => {
                for (const e of entradas) {
                    if (!e.isIntersecting) continue
                    const i = seccionesRef.current.indexOf(e.target as HTMLElement)
                    if (i >= 0) setActiva(i)
                }
            },
            { rootMargin: '-25% 0px -70% 0px' }
        )
        seccionesRef.current.forEach((el) => el && io.observe(el))
        return () => io.disconnect()
    }, [secciones.length])

    const ir = (i: number) => {
        const el = seccionesRef.current[i]
        if (!el) return
        setIndiceAbierto(false)
        const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - 72,
            behavior: sinMovimiento ? 'auto' : 'smooth',
        })
    }

    if (secciones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                <Utensils className="mb-3 size-8 opacity-60" />
                <p className="text-sm">Pronto vas a ver la carta acá.</p>
            </div>
        )
    }

    return (
        <>
            <section ref={indiceRef} aria-label={titulo}>
                <div className="flex items-end justify-between gap-4 border-b border-foreground pb-3">
                    <h2 className="tienda-display text-[clamp(44px,12vw,88px)] leading-[0.85] text-foreground">
                        {titulo}
                    </h2>
                    <span className="shrink-0 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {total} {total === 1 ? 'plato' : 'platos'}
                    </span>
                </div>
                {conIndice && (
                    <ol className="mt-1 md:columns-2 md:gap-14">
                        {secciones.map((s, i) => (
                            <li key={s.nombre} className="break-inside-avoid">
                                <button
                                    type="button"
                                    onClick={() => ir(i)}
                                    className="group flex w-full items-baseline gap-3 py-3 text-left"
                                >
                                    <span className="tienda-display text-[26px] leading-tight text-foreground transition-colors group-hover:text-[color:var(--tienda-acento-legible)] sm:text-[30px]">
                                        {s.nombre}
                                    </span>
                                    <span
                                        aria-hidden
                                        className="mb-1.5 min-w-6 flex-1 border-b-2 border-dotted border-foreground/30"
                                    />
                                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                                        {s.productos.length}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            <AnimatePresence>
                {barra && (
                    <motion.div
                        key="barra"
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="fixed inset-x-0 top-0 z-30 border-b border-foreground bg-background/92 backdrop-blur-xl"
                    >
                        <div className="mx-auto max-w-6xl px-4 sm:px-6">
                            <button
                                type="button"
                                onClick={() => setIndiceAbierto((v) => !v)}
                                aria-expanded={indiceAbierto}
                                className="flex h-14 w-full items-center justify-between gap-3 text-left"
                            >
                                <span className="flex min-w-0 items-baseline gap-2.5">
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        {titulo}
                                    </span>
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={activa}
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -10, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: EASE }}
                                            className="tienda-display truncate text-[22px] leading-none text-foreground"
                                        >
                                            {secciones[activa]?.nombre}
                                        </motion.span>
                                    </AnimatePresence>
                                </span>
                                <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold">
                                    Índice{' '}
                                    <ChevronDown
                                        className={`size-4 transition-transform duration-300 ${indiceAbierto ? 'rotate-180' : ''}`}
                                    />
                                </span>
                            </button>
                            <AnimatePresence initial={false}>
                                {indiceAbierto && (
                                    <motion.ol
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        transition={{ duration: 0.35, ease: EASE }}
                                        className="max-h-[60vh] overflow-y-auto"
                                    >
                                        {secciones.map((s, i) => (
                                            <li key={s.nombre}>
                                                <button
                                                    type="button"
                                                    onClick={() => ir(i)}
                                                    className="flex w-full items-baseline gap-3 border-t border-dotted border-foreground/25 py-3 text-left"
                                                >
                                                    <span
                                                        className={`tienda-display text-[22px] leading-tight ${i === activa ? 'tienda-acento' : 'text-foreground'}`}
                                                    >
                                                        {s.nombre}
                                                    </span>
                                                    <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                                                        {s.productos.length}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </motion.ol>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-16 space-y-20">
                {secciones.map((s, i) => (
                    <section
                        key={s.nombre}
                        ref={(el) => {
                            seccionesRef.current[i] = el
                        }}
                        aria-label={s.nombre}
                        className="scroll-mt-20"
                    >
                        <SeccionProductos seccion={s} onAbrir={onAbrir} />
                    </section>
                ))}
            </div>
            <div ref={finRef} aria-hidden />
        </>
    )
}

function SeccionProductos<T extends ProductoCarta>({
    seccion,
    onAbrir,
}: {
    seccion: SeccionCarta<T>
    onAbrir: (p: T) => void
}) {
    const { conFoto, sinFoto } = ordenVisual(seccion.productos)
    const n = seccion.productos.length
    return (
        <>
            {/* El título entre filetes, centrado, como en una carta impresa. */}
            <div className="flex items-center gap-4">
                <span aria-hidden className="h-px flex-1 bg-foreground/40" />
                <h2 className="tienda-display max-w-[80%] text-center text-[clamp(32px,9vw,56px)] leading-[0.95] text-foreground break-words hyphens-auto">
                    {seccion.nombre}
                </h2>
                <span aria-hidden className="h-px flex-1 bg-foreground/40" />
            </div>
            <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {n} {n === 1 ? 'plato' : 'platos'}
            </p>

            {conFoto.length > 0 && (
                <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
                    {conFoto.map((p, i) => (
                        <PlatoLamina
                            key={p.id}
                            producto={p}
                            indice={i}
                            // En el celular, el último de una cantidad impar va centrado y no a un costado.
                            suelto={conFoto.length % 2 === 1 && i === conFoto.length - 1}
                            onClick={() => onAbrir(p)}
                        />
                    ))}
                </div>
            )}
            {sinFoto.length > 0 && (
                <ul className={`mx-auto max-w-3xl ${conFoto.length > 0 ? 'mt-10' : 'mt-6'}`}>
                    {sinFoto.map((p) => (
                        <li key={p.id}>
                            <PlatoRenglon producto={p} onClick={() => onAbrir(p)} />
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}
