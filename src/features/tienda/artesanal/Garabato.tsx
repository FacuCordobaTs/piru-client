import { motion, useReducedMotion } from 'motion/react'

/** El subrayado a mano alzada: se dibuja una vez cuando aparece. */
export function Garabato({ className = '' }: { className?: string }) {
    const sinMovimiento = useReducedMotion()
    return (
        <svg aria-hidden viewBox="0 0 220 14" preserveAspectRatio="none" className={className}>
            <motion.path
                d="M3 9C24 3 40 3 58 8s34 5 52-1 36-6 54 0 32 5 53-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={sinMovimiento ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.3 }}
            />
        </svg>
    )
}
