import { ShoppingBag } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { PedidoProps } from '../tipos'

/** Una barra negra que sube desde abajo con la cantidad, el texto y el total. */
export function PedidoSencilla({ visible, cantidad, total, texto = 'Ver pedido', onClick, pulso }: PedidoProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="pedido"
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="pointer-events-none fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
                >
                    <motion.button
                        type="button"
                        onClick={onClick}
                        animate={{ scale: pulso ? 1.04 : 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="pointer-events-auto flex h-14 w-full max-w-md items-center gap-3 rounded-full bg-foreground pl-5 pr-6 text-background shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                    >
                        <ShoppingBag className="size-5 shrink-0" />
                        <span className="truncate text-[15px] font-semibold">{texto}</span>
                        <span className="rounded-full bg-background/15 px-2 py-0.5 text-[13px] font-semibold tabular-nums">
                            {cantidad}
                        </span>
                        <span className="ml-auto shrink-0 text-[15px] font-semibold tabular-nums">{total}</span>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
