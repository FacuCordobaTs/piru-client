import { productosDeSecciones } from '../catalogo'
import { useNavegacionCarta } from '../compartido/useNavegacionCarta'
import type { CartaProps, ProductoCarta } from '../tipos'
import { ProductoArtesanal } from './Producto'

export function CartaArtesanal<T extends ProductoCarta>({
    secciones,
    onAbrir,
    titulo = 'Algo rico te espera',
}: CartaProps<T>) {
    const { activa, id, ir, seccionesRef } = useNavegacionCarta(secciones.length)
    return (
        <div>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
                <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--tienda-acento-legible)]">
                        Para compartir o darte un gusto
                    </p>
                    <h2 className="tienda-display max-w-2xl text-[clamp(40px,5.5vw,64px)] leading-[1.04] [overflow-wrap:anywhere]">
                        {titulo}
                    </h2>
                </div>
                <p className="max-w-64 text-base leading-relaxed text-muted-foreground">
                    Buscá tu favorito y hacete un ratito para disfrutar.
                </p>
            </div>
            {secciones.length > 1 && (
                <nav
                    aria-label="Categorías de la carta"
                    className="tienda-sin-barra sticky top-0 z-20 -mx-1 mb-9 flex gap-2 overflow-x-auto border-b border-border bg-background/95 px-1 pt-3 backdrop-blur-md"
                >
                    {secciones.map((seccion, i) => (
                        <button
                            type="button"
                            key={seccion.nombre}
                            onClick={() => ir(i)}
                            aria-controls={id(i)}
                            aria-current={activa === i ? 'location' : undefined}
                            className={`inline-flex min-h-13 shrink-0 items-center gap-3 border-b-[3px] px-4 py-3 text-sm font-bold transition-colors ${activa === i ? 'border-primary tienda-fondo-complemento' : 'border-transparent text-muted-foreground hover:bg-secondary/60'}`}
                        >
                            {seccion.nombre}
                            <span className="text-xs font-normal text-muted-foreground">
                                {seccion.productos.length}
                            </span>
                        </button>
                    ))}
                </nav>
            )}
            {secciones.length === 0 && (
                <p className="artesanal-papel border border-border p-10 text-center text-muted-foreground">
                    Pronto vas a ver la carta acá.
                </p>
            )}
            <div className="space-y-12">
                {secciones.map((seccion, i) => (
                    <section
                        key={seccion.nombre}
                        id={id(i)}
                        ref={(el) => {
                            seccionesRef.current[i] = el
                        }}
                        aria-label={seccion.nombre}
                        className="scroll-mt-24"
                    >
                        <div className="mb-5 flex flex-wrap items-baseline gap-3">
                            <h3 className="tienda-display text-[clamp(30px,3.5vw,42px)] leading-tight [overflow-wrap:anywhere]">
                                {seccion.nombre}
                            </h3>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {seccion.productos.length}{' '}
                                {seccion.productos.length === 1 ? 'opción' : 'opciones'}
                            </span>
                        </div>
                        <div className="grid gap-5 lg:grid-cols-2">
                            {productosDeSecciones([seccion]).map((producto) => (
                                <ProductoArtesanal key={producto.id} producto={producto} onAbrir={onAbrir} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
