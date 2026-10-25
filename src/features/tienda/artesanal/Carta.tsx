import { ordenVisual } from '@/lib/tienda'
import { useNavegacionCarta } from '../compartido/useNavegacionCarta'
import type { CartaProps, ProductoCarta, SeccionCarta } from '../tipos'
import { Garabato } from './Garabato'
import { FotoArtesanal, RenglonPizarra } from './Producto'

export function CartaArtesanal<T extends ProductoCarta>({
    secciones,
    onAbrir,
    titulo = 'Algo rico te espera',
}: CartaProps<T>) {
    const { activa, id, ir, seccionesRef } = useNavegacionCarta(secciones.length)
    return (
        <div>
            <div className="text-center">
                <p className="tienda-display tienda-acento text-xl italic sm:text-2xl">
                    Para compartir o darte un gusto
                </p>
                <h2 className="tienda-display mx-auto mt-2 max-w-4xl text-[clamp(48px,8vw,108px)] leading-[0.92] [overflow-wrap:anywhere] [text-wrap:balance]">
                    {titulo}
                </h2>
                <Garabato className="tienda-acento mx-auto mt-4 h-4 w-48 sm:w-64" />
            </div>
            {secciones.length > 1 && (
                <nav
                    aria-label="Categorías de la carta"
                    className="tienda-sin-barra sticky top-0 z-20 -mx-5 mb-14 mt-12 flex gap-1.5 overflow-x-auto border-b-4 border-[var(--tienda-complemento)] bg-background px-5 pt-3 sm:mx-0 sm:px-0"
                >
                    {secciones.map((seccion, i) => (
                        <button
                            type="button"
                            key={seccion.nombre}
                            onClick={() => ir(i)}
                            aria-controls={id(i)}
                            aria-current={activa === i ? 'location' : undefined}
                            className={`inline-flex shrink-0 items-baseline gap-2 rounded-t-[4px] px-4 pb-3 pt-3 text-[15px] font-bold transition-[transform,background-color,color] duration-200 sm:px-5 ${activa === i ? 'tienda-fondo-complemento' : 'translate-y-1.5 bg-secondary text-foreground/75 hover:translate-y-0.5 hover:text-foreground'}`}
                        >
                            {seccion.nombre}
                            <span className="tienda-display text-sm font-normal italic opacity-75">
                                {seccion.productos.length}
                            </span>
                        </button>
                    ))}
                </nav>
            )}
            {secciones.length === 0 && (
                <p className="artesanal-papel mt-10 p-10 text-center text-muted-foreground">
                    Pronto vas a ver la carta acá.
                </p>
            )}
            <div className={`space-y-20 sm:space-y-24 ${secciones.length > 1 ? '' : 'mt-14'}`}>
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
                        <SeccionArtesanal seccion={seccion} onAbrir={onAbrir} />
                    </section>
                ))}
            </div>
        </div>
    )
}

/** Las fotos se pegan en la pared; lo que no tiene foto se escribe en la pizarra. Con pocas fotos y algo
 * en la pizarra, en escritorio van lado a lado. */
function SeccionArtesanal<T extends ProductoCarta>({
    seccion,
    onAbrir,
}: {
    seccion: SeccionCarta<T>
    onAbrir: (producto: T) => void
}) {
    const { conFoto, sinFoto } = ordenVisual(seccion.productos)
    const n = seccion.productos.length
    const juntos = conFoto.length > 0 && conFoto.length <= 2 && sinFoto.length > 0
    return (
        <>
            <div className="mb-10 flex items-end gap-4">
                <h3 className="tienda-display min-w-0 text-[clamp(38px,5.2vw,68px)] leading-[0.95] [overflow-wrap:anywhere]">
                    {seccion.nombre}
                </h3>
                <span
                    aria-hidden
                    className="mb-2.5 hidden min-w-8 flex-1 border-b-2 border-dotted border-foreground/30 sm:block"
                />
                <span className="tienda-display mb-1 shrink-0 text-lg italic text-foreground/70 sm:text-xl">
                    {n} {n === 1 ? 'opción' : 'opciones'}
                </span>
            </div>
            <div
                className={
                    juntos
                        ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12'
                        : ''
                }
            >
                {conFoto.length > 0 && (
                    <div
                        className={`grid grid-cols-2 gap-x-4 gap-y-12 pt-3 sm:gap-x-8 ${juntos || conFoto.length === 1 ? '' : 'lg:grid-cols-3 lg:gap-x-10'}`}
                    >
                        {conFoto.map((producto, i) => (
                            <FotoArtesanal
                                key={producto.id}
                                producto={producto}
                                indice={i}
                                sola={conFoto.length === 1 && !juntos}
                                onAbrir={onAbrir}
                            />
                        ))}
                    </div>
                )}
                {sinFoto.length > 0 && (
                    <div
                        className={`artesanal-pizarra rounded-[4px] px-5 py-7 sm:px-10 sm:py-10 ${conFoto.length ? 'mt-14' : ''} ${juntos ? 'lg:mt-0' : ''}`}
                    >
                        <p className="tienda-display text-center text-2xl italic sm:text-3xl">
                            De la pizarra
                        </p>
                        <Garabato className="mx-auto mt-1 h-3 w-28 opacity-60" />
                        <ul
                            className={`mt-5 grid gap-x-14 ${sinFoto.length > 1 && !juntos ? 'lg:grid-cols-2' : ''}`}
                        >
                            {sinFoto.map((producto) => (
                                <li key={producto.id}>
                                    <RenglonPizarra producto={producto} onAbrir={onAbrir} />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}
