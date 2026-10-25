import { LineaAjustada } from '../compartido/LineaAjustada'

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
