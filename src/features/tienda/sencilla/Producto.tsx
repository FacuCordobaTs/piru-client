import { fotosDeProducto } from '@/lib/fotosProducto'
import { formatoPesos, precioProducto } from '@/lib/tienda'
import { Plus } from 'lucide-react'
import type { ProductoCarta } from '../tipos'

function PrecioSencilla({ producto }: { producto: ProductoCarta }) {
    const { original, final, descuento } = precioProducto(producto)
    return (
        <span className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
            <span className="text-[16px] font-semibold">{formatoPesos(final)}</span>
            {descuento > 0 && (
                <del className="text-[13px] text-muted-foreground">{formatoPesos(original)}</del>
            )}
        </span>
    )
}

/** Tarjeta vertical: la foto a todo el ancho y, debajo, nombre, descripción y precio. */
export function TarjetaSencilla<T extends ProductoCarta>({
    producto,
    onAbrir,
}: {
    producto: T
    onAbrir: (producto: T) => void
}) {
    const foto = fotosDeProducto(producto)[0]
    const { descuento } = precioProducto(producto)
    return (
        <button
            type="button"
            onClick={() => onAbrir(producto)}
            className="group flex min-w-0 flex-col text-left focus-visible:outline-none"
        >
            <span className="relative block overflow-hidden rounded-[22px] bg-secondary group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ring">
                {/* La tarjeta toma el alto de la foto: nunca se recorta. */}
                <img
                    src={foto}
                    alt={producto.nombre}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover:scale-[1.03]"
                />
                {descuento > 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-[12px] font-semibold text-background">
                        −{descuento}%
                    </span>
                )}
            </span>
            <span className="mt-4 flex items-start gap-4 px-1">
                <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold leading-snug [overflow-wrap:anywhere]">
                        {producto.nombre}
                    </span>
                    {producto.descripcion && (
                        <span className="mt-1 line-clamp-2 block text-[14px] leading-snug text-muted-foreground">
                            {producto.descripcion}
                        </span>
                    )}
                    <span className="mt-2 block">
                        <PrecioSencilla producto={producto} />
                    </span>
                </span>
                <BotonAgregar />
            </span>
        </button>
    )
}

/** Sin foto no se inventa una: un renglón limpio con nombre, descripción y precio. */
export function RenglonSencillo<T extends ProductoCarta>({
    producto,
    onAbrir,
}: {
    producto: T
    onAbrir: (producto: T) => void
}) {
    return (
        <button
            type="button"
            onClick={() => onAbrir(producto)}
            className="group flex w-full items-center gap-4 py-4 text-left focus-visible:outline-none"
        >
            <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold leading-snug [overflow-wrap:anywhere] group-focus-visible:underline">
                    {producto.nombre}
                </span>
                {producto.descripcion && (
                    <span className="mt-0.5 line-clamp-2 block text-[14px] leading-snug text-muted-foreground">
                        {producto.descripcion}
                    </span>
                )}
                <span className="mt-1.5 block">
                    <PrecioSencilla producto={producto} />
                </span>
            </span>
            <BotonAgregar />
        </button>
    )
}

function BotonAgregar() {
    return (
        <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform duration-150 group-active:scale-90"
        >
            <Plus className="size-[18px]" strokeWidth={2.25} />
        </span>
    )
}
