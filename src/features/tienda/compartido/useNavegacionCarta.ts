import { useEffect, useId, useRef, useState } from 'react'

/** Índice y enlaces únicos aun si se monta más de una carta. Comparte comportamiento, no diseño. */
export function useNavegacionCarta(cantidad: number) {
    const prefijo = useId()
    const seccionesRef = useRef<(HTMLElement | null)[]>([])
    const [activa, setActiva] = useState(0)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entradas) => {
                for (const entrada of entradas) {
                    if (!entrada.isIntersecting) continue
                    const indice = seccionesRef.current.indexOf(entrada.target as HTMLElement)
                    if (indice >= 0) setActiva(indice)
                }
            },
            { rootMargin: '-15% 0px -65% 0px' }
        )
        seccionesRef.current.slice(0, cantidad).forEach((el) => el && observer.observe(el))
        return () => observer.disconnect()
    }, [cantidad])
    const id = (indice: number) => `${prefijo}-categoria-${indice}`
    const ir = (indice: number) => {
        seccionesRef.current[indice]?.scrollIntoView({
            block: 'start',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        })
    }
    return { activa, seccionesRef, id, ir }
}
