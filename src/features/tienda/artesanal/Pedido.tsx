import { ArrowUpRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { PedidoProps } from '../tipos'

/** El pedido es la comanda: un papelito cortado que sube desde abajo, con el total escrito grande. */
export function PedidoArtesanal({
    visible,
    cantidad,
    total,
    texto = 'Ver pedido',
    onClick,
    pulso,
}: PedidoProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="comanda"
                    initial={{ y: 160, rotate: -5 }}
                    animate={{ y: pulso ? -6 : 0, rotate: -1 }}
                    exit={{ y: 160 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="pointer-events-none fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-40 flex justify-center px-4 drop-shadow-[0_16px_20px_rgba(40,25,15,0.35)]"
                >
                    <button
                        type="button"
                        onClick={onClick}
                        className="artesanal-comanda artesanal-papel group pointer-events-auto flex w-full max-w-sm items-center justify-between gap-4 px-5 pb-4 pt-6 text-left text-foreground focus-visible:outline-none"
                    >
                        <span className="min-w-0">
                            <span className="block text-[12px] font-bold text-foreground/65">
                                Comanda · {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
                            </span>
                            <span className="block text-[16px] font-bold">{texto}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                            <span className="tienda-display text-[28px] leading-none tabular-nums">
                                {total}
                            </span>
                            <span className="grid size-11 place-items-center rounded-[4px] bg-primary text-primary-foreground transition-transform duration-200 group-hover:-rotate-6 group-active:scale-90">
                                <ArrowUpRight className="size-5" />
                            </span>
                        </span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
