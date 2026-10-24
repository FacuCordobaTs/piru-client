import { motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { EASE } from '../compartido/movimiento'

function LineaAjustada({
    texto,
    maximo = 440,
    demora = 0,
}: {
    texto: string
    maximo?: number
    demora?: number
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
                className="inline-block whitespace-nowrap pb-[0.04em] align-top leading-[0.86]"
                style={tamano ? { fontSize: tamano } : { visibility: 'hidden' }}
            >
                {texto}
            </motion.span>
        </div>
    )
}

/** Divide un nombre largo en dos renglones parejos. */
const renglones = (texto: string) => {
    const palabras = texto.trim().split(/\s+/)
    if (palabras.length < 2 || texto.length <= 12) return [texto.trim()]
    let mejor = 1
    let diferencia = Infinity
    for (let i = 1; i < palabras.length; i++) {
        const d = Math.abs(palabras.slice(0, i).join(' ').length - palabras.slice(i).join(' ').length)
        if (d < diferencia) {
            diferencia = d
            mejor = i
        }
    }
    return [palabras.slice(0, mejor).join(' '), palabras.slice(mejor).join(' ')]
}

/** La mancheta: el nombre del local de lado a lado, como el título de una revista. */
export function Mancheta({ nombre, className = '' }: { nombre: string; className?: string }) {
    return (
        <h1 className={`tienda-display tienda-acento ${className}`} aria-label={nombre}>
            {renglones(nombre).map((r, i) => (
                <LineaAjustada key={i} texto={r} demora={0.1 + i * 0.12} />
            ))}
        </h1>
    )
}

/** La línea de datos bajo la mancheta, entre dos filetes, como la fecha y el número de una revista. */
