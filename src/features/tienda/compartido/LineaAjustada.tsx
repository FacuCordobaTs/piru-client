import { motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { EASE } from './movimiento'

/** Una línea que ocupa exactamente el ancho de su caja, con la letra del local ya cargada. */
export function LineaAjustada({
    texto,
    maximo = 440,
    demora = 0,
    className = 'leading-[0.86]',
}: {
    texto: string
    maximo?: number
    demora?: number
    className?: string
}) {
    const caja = useRef<HTMLDivElement | null>(null)
    const linea = useRef<HTMLSpanElement | null>(null)
    const [tamano, setTamano] = useState<number | null>(null)
    const sinMovimiento = useReducedMotion()

    useLayoutEffect(() => {
        const medir = () => {
            const c = caja.current
            const l = linea.current
            if (!c || !l) return
            const base = 100
            l.style.fontSize = `${base}px`
            const ancho = l.scrollWidth
            if (ancho <= 0) return
            const nuevo = Math.min(maximo, Math.floor(((base * c.clientWidth) / ancho) * 0.99 * 10) / 10)
            // Se aplica también a mano: si el tamaño no cambió, React no vuelve a escribir el estilo.
            l.style.fontSize = `${nuevo}px`
            setTamano(nuevo)
        }
        medir()
        const ro = new ResizeObserver(medir)
        if (caja.current) ro.observe(caja.current)
        // La letra del local puede llegar después: se vuelve a medir cuando carga.
        document.fonts?.ready.then(medir).catch(() => {})
        document.fonts?.addEventListener?.('loadingdone', medir)
        return () => {
            ro.disconnect()
            document.fonts?.removeEventListener?.('loadingdone', medir)
        }
    }, [texto, maximo])

    return (
        <div ref={caja} className="w-full overflow-hidden">
            <motion.span
                ref={linea}
                initial={sinMovimiento ? false : { y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ delay: demora, duration: 1, ease: EASE }}
                className={`inline-block whitespace-nowrap pb-[0.04em] align-top ${className}`}
                style={tamano ? { fontSize: tamano } : { visibility: 'hidden' }}
            >
                {texto}
            </motion.span>
        </div>
    )
}
