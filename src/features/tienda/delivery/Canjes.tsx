import { Check, Sparkles } from 'lucide-react'
import { fotosDeProducto } from '@/lib/fotosProducto'
import type { ProductoTienda } from '../datos'
import type { MenuDeliveryModel } from './useMenuDelivery'

export function Canjes({ modelo }: { modelo: MenuDeliveryModel }) {
    const {
        restaurante,
        tieneOpcionesCanje,
        canjeRef,
        puntosDisponibles,
        setModalPuntosOpen,
        productosCanje,
        cartItems,
        abrirDetalleProducto,
    } = modelo
    return (
        <>
            {restaurante?.sistemaPuntos && tieneOpcionesCanje && (
                <section ref={canjeRef} aria-label="Canje de puntos" className="scroll-mt-24 pt-16">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h2 className="tienda-display flex items-center gap-2 text-[28px] leading-tight text-foreground">
                            <Sparkles className="tienda-acento size-5 shrink-0" />
                            Canjeá tus puntos
                        </h2>
                        {puntosDisponibles !== null ? (
                            <span className="text-xs text-muted-foreground">
                                Disponibles:{' '}
                                <strong className="font-bold tabular-nums text-foreground">
                                    {puntosDisponibles.toLocaleString('es-AR')} pts
                                </strong>
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setModalPuntosOpen(true)}
                                className="rounded-sm text-xs font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                            >
                                Identificate para canjear
                            </button>
                        )}
                    </div>

                    <div className="tienda-sin-barra -mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 xl:grid-cols-3">
                        {productosCanje.map((producto: ProductoTienda) => {
                            const enCarrito = cartItems.find(
                                (it) => it.productoId === producto.id && it.esCanjePuntos
                            )
                            return (
                                <ProductoCanjeCard
                                    key={producto.id}
                                    producto={producto}
                                    cantidadEnCarrito={enCarrito?.cantidad}
                                    onClick={() =>
                                        abrirDetalleProducto({ ...producto, intentandoCanjear: true })
                                    }
                                />
                            )
                        })}
                    </div>
                </section>
            )}
        </>
    )
}
const ProductoCanjeCard = ({
    producto,
    cantidadEnCarrito,
    onClick,
}: {
    producto: ProductoTienda
    cantidadEnCarrito?: number
    onClick: () => void
}) => {
    const foto = fotosDeProducto(producto)[0]
    return (
        // Una fila corta, sin borde ni sombra, para que los canjes entren en un riel de una sola altura
        // y no empujen la carta: la ficha completa (descripción, extras) está en el detalle del producto.
        <button
            type="button"
            onClick={onClick}
            aria-label={`${producto.nombre}, ${producto.puntosNecesarios} puntos${cantidadEnCarrito ? `, en tu pedido (${cantidadEnCarrito})` : ', canjear'}`}
            className={`group flex min-h-[72px] w-64 shrink-0 snap-start items-center gap-3 rounded-2xl p-2 pr-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:w-full ${
                cantidadEnCarrito
                    ? 'bg-primary/10 ring-1 ring-primary/40'
                    : 'bg-secondary hover:bg-secondary/70'
            }`}
        >
            {foto && (
                <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <img src={foto} alt="" className="size-full object-cover" />
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[13px] font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">
                    {producto.nombre}
                </span>
                <span className="mt-1 block text-xs font-bold tabular-nums text-foreground/70">
                    {producto.puntosNecesarios} pts
                </span>
            </span>
            {cantidadEnCarrito ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                    <Check className="size-3 stroke-[3]" />
                    {cantidadEnCarrito}
                </span>
            ) : (
                <span className="shrink-0 rounded-full bg-background px-3 py-1.5 text-[11px] font-bold text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    Canjear
                </span>
            )}
        </button>
    )
}
