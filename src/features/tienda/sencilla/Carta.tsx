import { ordenVisual } from '@/lib/tienda'
import { useNavegacionCarta } from '../compartido/useNavegacionCarta'
import type { CartaProps, ProductoCarta } from '../tipos'
import { RenglonSencillo, TarjetaSencilla } from './Producto'

export function CartaSencilla<T extends ProductoCarta>({ secciones, onAbrir }: CartaProps<T>) {
    const { activa, id, ir, seccionesRef } = useNavegacionCarta(secciones.length)
    return (
        <div>
            {secciones.length > 1 && (
                <nav
                    aria-label="Categorías de la carta"
                    className="tienda-sin-barra sticky top-0 z-20 -mx-5 mb-10 flex gap-2 overflow-x-auto bg-background/85 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:justify-center sm:px-0"
                >
                    {secciones.map((seccion, i) => (
                        <button
                            type="button"
                            key={seccion.nombre}
                            onClick={() => ir(i)}
                            aria-controls={id(i)}
                            aria-current={activa === i ? 'location' : undefined}
                            className={`h-9 shrink-0 rounded-full px-4 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${activa === i ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-border'}`}
                        >
                            {seccion.nombre}
                        </button>
                    ))}
                </nav>
            )}
            {secciones.length === 0 && (
                <p className="py-20 text-center text-muted-foreground">Pronto vas a ver la carta acá.</p>
            )}
            <div className="space-y-16 sm:space-y-20">
                {secciones.map((seccion, i) => {
                    const { conFoto, sinFoto } = ordenVisual(seccion.productos)
                    return (
                        <section
                            key={seccion.nombre}
                            id={id(i)}
                            ref={(el) => {
                                seccionesRef.current[i] = el
                            }}
                            aria-label={seccion.nombre}
                            className="scroll-mt-20"
                        >
                            <h2 className="tienda-display mb-6 text-[26px] leading-tight [overflow-wrap:anywhere] sm:text-[30px]">
                                {seccion.nombre}
                            </h2>
                            {conFoto.length > 0 && (
                                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                                    {conFoto.map((producto) => (
                                        <TarjetaSencilla key={producto.id} producto={producto} onAbrir={onAbrir} />
                                    ))}
                                </div>
                            )}
                            {sinFoto.length > 0 && (
                                <ul
                                    className={`divide-y divide-border border-y border-border ${conFoto.length ? 'mt-10' : ''}`}
                                >
                                    {sinFoto.map((producto) => (
                                        <li key={producto.id}>
                                            <RenglonSencillo producto={producto} onAbrir={onAbrir} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
