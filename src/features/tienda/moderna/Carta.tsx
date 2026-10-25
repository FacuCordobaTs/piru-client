import { ordenVisual } from '@/lib/tienda'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef } from 'react'
import { useNavegacionCarta } from '../compartido/useNavegacionCarta'
import type { CartaProps, ProductoCarta, SeccionCarta } from '../tipos'
import { TarjetaModerna } from './Producto'
import { ProductoSinFotoModerna } from './ProductoSinFoto'

export function CartaModerna<T extends ProductoCarta>({
    secciones,
    onAbrir,
    titulo = 'Elegí tu próximo favorito',
}: CartaProps<T>) {
    const { activa, id, ir, seccionesRef } = useNavegacionCarta(secciones.length)
    const indicador = useId()
    const sinMovimiento = useReducedMotion()
    const barraRef = useRef<HTMLDivElement | null>(null)
    const total = secciones.reduce((n, s) => n + s.productos.length, 0)

    // La categoría activa siempre a la vista dentro de la barra, sin mover la página.
    useEffect(() => {
        const barra = barraRef.current
        const boton = barra?.querySelector<HTMLElement>(`[data-indice="${activa}"]`)
        if (!barra || !boton) return
        barra.scrollTo({
            left: boton.offsetLeft - barra.clientWidth / 2 + boton.clientWidth / 2,
            behavior: sinMovimiento ? 'auto' : 'smooth',
        })
    }, [activa, sinMovimiento])

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
                <h2 className="tienda-display max-w-4xl text-[clamp(44px,7.4vw,112px)] leading-[0.9] [overflow-wrap:anywhere] [text-wrap:balance]">
                    {titulo}
                </h2>
                {total > 0 && (
                    <p className="flex items-end gap-3 pb-1">
                        <span className="tienda-display tienda-acento text-[clamp(52px,6vw,96px)] leading-[0.8] tabular-nums">
                            {total}
                        </span>
                        <span className="max-w-24 text-[13px] font-semibold leading-tight text-muted-foreground">
                            {total === 1 ? 'opción para pedir ahora' : 'opciones para pedir ahora'}
                        </span>
                    </p>
                )}
            </div>
            {secciones.length > 1 && (
                <nav aria-label="Categorías de la carta" className="sticky top-3 z-20 mb-14 mt-9 sm:mb-16">
                    <div
                        ref={barraRef}
                        className="tienda-sin-barra flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-card p-1.5 shadow-[0_20px_44px_-26px_rgba(0,0,0,0.5)] ring-1 ring-border"
                    >
                        {secciones.map((seccion, i) => (
                            <button
                                type="button"
                                key={seccion.nombre}
                                data-indice={i}
                                onClick={() => ir(i)}
                                aria-controls={id(i)}
                                aria-current={activa === i ? 'location' : undefined}
                                className={`relative shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-colors sm:px-5 sm:py-3 ${activa === i ? 'text-[color:var(--tienda-complemento-texto)]' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {activa === i && (
                                    <motion.span
                                        layoutId={indicador}
                                        transition={
                                            sinMovimiento
                                                ? { duration: 0 }
                                                : { type: 'spring', stiffness: 420, damping: 34 }
                                        }
                                        className="tienda-fondo-complemento absolute inset-0 rounded-full"
                                    />
                                )}
                                <span className="relative">{seccion.nombre}</span>
                            </button>
                        ))}
                    </div>
                </nav>
            )}
            {secciones.length === 0 && (
                <p className="py-16 text-center text-muted-foreground">Pronto vas a ver la carta acá.</p>
            )}
            <div className={`space-y-20 sm:space-y-28 ${secciones.length > 1 ? '' : 'mt-12'}`}>
                {secciones.map((seccion, i) => (
                    <section
                        key={seccion.nombre}
                        id={id(i)}
                        ref={(el) => {
                            seccionesRef.current[i] = el
                        }}
                        aria-label={seccion.nombre}
                        className="scroll-mt-28"
                    >
                        <SeccionModerna seccion={seccion} onAbrir={onAbrir} />
                    </section>
                ))}
            </div>
        </div>
    )
}

/** Mosaico: en el celular, con una cantidad impar el primero va a lo ancho; en escritorio, con cinco o
 * más, el primero ocupa dos por dos y los demás lo rodean. */
function SeccionModerna<T extends ProductoCarta>({
    seccion,
    onAbrir,
}: {
    seccion: SeccionCarta<T>
    onAbrir: (producto: T) => void
}) {
    const { conFoto, sinFoto } = ordenVisual(seccion.productos)
    const n = conFoto.length
    // Con uno o dos platos con foto y otros sin foto, en escritorio van lado a lado y no queda medio
    // renglón vacío.
    const juntos = n > 0 && n <= 2 && sinFoto.length > 0
    const columnas = juntos ? '' : n >= 4 ? 'lg:grid-cols-4' : n === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
    const forma = juntos || n >= 3 ? 'cuadrada' : n === 2 ? 'apaisada' : 'sola'
    return (
        <>
            <div className="mb-7 flex items-end gap-3 sm:mb-9">
                <h3 className="tienda-display min-w-0 text-[clamp(34px,5vw,68px)] leading-[0.92] [overflow-wrap:anywhere]">
                    {seccion.nombre}
                </h3>
                <span className="tienda-fondo-marca mb-1 grid h-8 min-w-8 shrink-0 place-items-center rounded-full px-2 text-sm font-bold tabular-nums sm:h-9 sm:min-w-9">
                    {seccion.productos.length}
                </span>
            </div>
            <div
                className={
                    juntos
                        ? 'lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-8'
                        : ''
                }
            >
                {n > 0 && (
                    <div className={`grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 ${columnas}`}>
                        {conFoto.map((producto, i) => {
                            const ancho = i === 0 && n % 2 === 1
                            const grande = i === 0 && n >= 5
                            return (
                                <TarjetaModerna
                                    key={producto.id}
                                    producto={producto}
                                    indice={i}
                                    ancho={ancho}
                                    grande={grande}
                                    forma={forma}
                                    className={`${ancho ? 'col-span-2' : ''} ${grande ? 'lg:col-span-2 lg:row-span-2' : ancho && n > 1 ? 'lg:col-span-1' : ''}`}
                                    onAbrir={onAbrir}
                                />
                            )
                        })}
                    </div>
                )}
                {sinFoto.length > 0 && (
                    <div
                        className={`grid content-start gap-1 rounded-[28px] bg-card p-1.5 ring-1 ring-border sm:rounded-[34px] sm:p-2 ${n ? 'mt-12' : ''} ${juntos ? 'lg:mt-0' : sinFoto.length > 1 ? 'lg:grid-cols-2' : ''}`}
                    >
                        {sinFoto.map((producto) => (
                            <ProductoSinFotoModerna key={producto.id} producto={producto} onAbrir={onAbrir} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
