import { ShoppingBag } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { PedidoProps } from '../tipos'

export function SelloElegante({
    cantidad,
    total,
    visible,
    onClick,
    pulso = false,
    texto = 'Ver pedido',
}: PedidoProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    key="sello"
                    type="button"
                    onClick={onClick}
                    initial={{ y: 120, rotate: -20 }}
                    animate={{ y: 0, rotate: 0, scale: pulso ? 1.06 : 1 }}
                    exit={{ y: 120 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="group fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 sm:right-6"
                >
                    <span className="flex h-12 items-center gap-2 rounded-full bg-card pl-4 pr-4 text-[14px] font-semibold text-foreground shadow-[0_14px_34px_-14px_rgba(0,0,0,0.55)] ring-1 ring-border">
                        {texto}
                        <span className="tabular-nums text-muted-foreground">{total}</span>
                    </span>
                    <span className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_36px_-14px_rgba(0,0,0,0.6)] transition-transform duration-300 group-active:scale-95">
                        <ShoppingBag className="size-6" />
                        <motion.span
                            key={cantidad}
                            initial={{ scale: 0.4 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                            className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-foreground px-1.5 text-[12px] font-bold tabular-nums text-background ring-2 ring-background"
                        >
                            {cantidad}
                        </motion.span>
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    )
}
