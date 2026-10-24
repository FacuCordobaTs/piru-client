import { ArrowRight, ShoppingBag } from 'lucide-react'
import type { PedidoProps } from '../tipos'

export function PedidoModerna({
    visible,
    cantidad,
    total,
    texto = 'Ver pedido',
    onClick,
    pulso,
}: PedidoProps) {
    if (!visible) return null
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
            <button
                type="button"
                onClick={onClick}
                className={`pointer-events-auto flex min-h-16 w-full max-w-md items-center gap-3 rounded-2xl bg-primary px-5 py-3 text-primary-foreground shadow-xl transition-transform ${pulso ? 'scale-105' : ''}`}
            >
                <ShoppingBag className="size-5" />
                <span className="grid size-7 place-items-center rounded-lg bg-primary-foreground/15 text-sm font-bold">
                    {cantidad}
                </span>
                <span className="font-semibold">{texto}</span>
                <span className="ml-auto font-bold tabular-nums">{total}</span>
                <ArrowRight className="size-4" />
            </button>
        </div>
    )
}
