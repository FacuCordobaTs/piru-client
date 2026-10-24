import { ArrowUpRight } from 'lucide-react'
import type { PedidoProps } from '../tipos'

export function PedidoArtesanal({
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
                className={`artesanal-papel pointer-events-auto flex w-full max-w-sm items-center justify-between gap-4 rounded-[4px] border border-border px-5 py-3 text-foreground shadow-[0_8px_28px_-8px_rgba(57,42,32,0.35)] transition-transform ${pulso ? '-translate-y-1' : ''}`}
            >
                <span className="text-left">
                    <span className="block text-sm font-bold">{texto}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                        {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
                    </span>
                </span>
                <span className="flex items-center gap-4">
                    <span className="tienda-display text-2xl tabular-nums">{total}</span>
                    <span className="grid size-10 place-items-center rounded-[3px] bg-primary text-primary-foreground">
                        <ArrowUpRight className="size-5" />
                    </span>
                </span>
            </button>
        </div>
    )
}
