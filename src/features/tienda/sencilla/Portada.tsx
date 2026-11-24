import type { PortadaProps } from '../tipos'
import './sencilla.css'

/** Sólo lo necesario: logo, nombre y los datos del local, centrados. La carta empieza enseguida. */
export function PortadaSencilla({ nombre, logo, datos, aviso, acciones, contenido }: PortadaProps) {
    const visibles = datos.filter(Boolean)
    return (
        <header className="mx-auto flex max-w-2xl flex-col items-center px-5 pt-14 text-center sm:pt-20">
            {logo && (
                <img
                    src={logo}
                    alt=""
                    className="h-20 w-auto max-w-[200px] object-contain sm:h-24"
                    fetchPriority="high"
                />
            )}
            <h1
                className={`tienda-display text-[clamp(30px,6vw,44px)] leading-[1.05] [overflow-wrap:anywhere] [text-wrap:balance] ${logo ? 'mt-6' : ''}`}
            >
                {nombre}
            </h1>
            {visibles.length > 0 && (
                <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[14px] text-muted-foreground">
                    {visibles.map((dato, i) => (
                        <li key={i} className="flex min-w-0 items-center gap-2">
                            {i > 0 && <span aria-hidden>·</span>}
                            <span className="min-w-0 break-words">{dato}</span>
                        </li>
                    ))}
                </ul>
            )}
            {aviso && <div className="mt-6 flex justify-center text-left">{aviso}</div>}
            {contenido}
            {acciones && (
                <div className="sencilla-acciones mt-6 flex flex-wrap justify-center gap-2">{acciones}</div>
            )}
        </header>
    )
}
