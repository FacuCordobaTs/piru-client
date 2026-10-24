import { fotosDeProducto } from '@/lib/fotosProducto'
import { Plus } from 'lucide-react'
import { ordenVisual } from '@/lib/tienda'
import { ProductoSinFotoModerna } from './ProductoSinFoto'
import { Precio } from '../compartido/Precio'
import { useNavegacionCarta } from '../compartido/useNavegacionCarta'
import type { CartaProps, ProductoCarta } from '../tipos'

export function CartaModerna<T extends ProductoCarta>({
    secciones,
    onAbrir,
    titulo = 'Elegí tu próximo favorito',
}: CartaProps<T>) {
    const { activa, id, ir, seccionesRef } = useNavegacionCarta(secciones.length)
    return (
        <div>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <h2 className="tienda-display max-w-4xl text-[clamp(40px,6vw,76px)] leading-[1.1] tracking-[-0.045em] [overflow-wrap:anywhere]">
                    {titulo}
                </h2>
                <p className="text-sm text-muted-foreground">Hecho acá. Para disfrutar donde quieras.</p>
            </div>
            {secciones.length > 1 && (
                <nav
                    aria-label="Categorías de la carta"
                    className="tienda-sin-barra sticky top-0 z-20 -mx-1 mb-10 flex gap-2 overflow-x-auto bg-background/95 px-1 py-4 backdrop-blur-xl"
                >
                    {secciones.map((seccion, i) => (
                        <button
                            type="button"
                            key={seccion.nombre}
                            onClick={() => ir(i)}
                            aria-controls={id(i)}
                            aria-current={activa === i ? 'location' : undefined}
                            className={`shrink-0 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${activa === i ? 'tienda-fondo-complemento' : 'bg-secondary hover:bg-secondary/70'}`}
                        >
                            {seccion.nombre}
                        </button>
                    ))}
                </nav>
            )}
            {secciones.length === 0 && (
                <p className="py-16 text-center text-muted-foreground">Pronto vas a ver la carta acá.</p>
            )}
            <div className="space-y-14">
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
                            className="scroll-mt-24"
                        >
                            <h3 className="tienda-display mb-7 text-[clamp(30px,4vw,48px)] leading-[1.15] tracking-[-0.04em] [overflow-wrap:anywhere]">
                                {seccion.nombre}
                                <span className="ml-3 align-middle text-sm font-normal text-muted-foreground">
                                    {seccion.productos.length}
                                </span>
                            </h3>
                            {conFoto.length > 0 && (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {conFoto.map((producto) => {
                                        const foto = fotosDeProducto(producto)[0]
                                        return (
                                            <button
                                                type="button"
                                                key={producto.id}
                                                onClick={() => onAbrir(producto)}
                                                className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl bg-card text-left ring-1 ring-border transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-ring"
                                            >
                                                {foto && (
                                                    <span className="block aspect-[16/10] w-full overflow-hidden bg-secondary">
                                                        <img
                                                            src={foto}
                                                            alt={producto.nombre}
                                                            loading="lazy"
                                                            className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                                                        />
                                                    </span>
                                                )}
                                                <span className="flex flex-1 flex-col p-5">
                                                    <span className="tienda-display block break-words text-2xl leading-snug">
                                                        {producto.nombre}
                                                    </span>
                                                    {producto.descripcion && (
                                                        <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                            {producto.descripcion}
                                                        </span>
                                                    )}
                                                    <span className="mt-auto flex items-end justify-between gap-3 pt-6">
                                                        <Precio producto={producto} />
                                                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                                            <Plus className="size-5" />
                                                        </span>
                                                    </span>
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                            {sinFoto.length > 0 && (
                                <div
                                    className={`grid gap-x-10 ${conFoto.length ? 'mt-6' : ''} ${sinFoto.length > 1 ? 'lg:grid-cols-2' : ''}`}
                                >
                                    {sinFoto.map((producto) => (
                                        <ProductoSinFotoModerna
                                            key={producto.id}
                                            producto={producto}
                                            onAbrir={onAbrir}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
