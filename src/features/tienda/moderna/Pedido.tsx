import { ArrowRight, ShoppingBag } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { PedidoProps } from '../tipos'

/** El pedido es una barra redonda de la tinta que sube desde abajo, con el contador en el color de la marca. */
export function PedidoModerna({
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
                    key="pedido"
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="pointer-events-none fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-40 flex justify-center px-3"
                >
                    <motion.button
                        type="button"
                        onClick={onClick}
                        animate={{ scale: pulso ? 1.05 : 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        className="group pointer-events-auto flex h-[68px] w-full max-w-md items-center gap-3 rounded-full bg-foreground px-2.5 text-background shadow-[0_24px_50px_-18px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
                    >
                        <span className="tienda-fondo-marca relative grid size-12 shrink-0 place-items-center rounded-full">
                            <ShoppingBag className="size-5" />
                            <motion.span
                                key={cantidad}
                                initial={{ scale: 0.3 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 520, damping: 15 }}
                                className="tienda-fondo-complemento absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold tabular-nums ring-[3px] ring-foreground"
                            >
                                {cantidad}
                            </motion.span>
                        </span>
                        <span className="truncate text-[15px] font-bold">{texto}</span>
                        <span className="tienda-display ml-auto shrink-0 text-lg tabular-nums">{total}</span>
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-background text-foreground transition-transform duration-300 group-hover:translate-x-0.5">
                            <ArrowRight className="size-5" />
                        </span>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
