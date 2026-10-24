import { FirmaMarca } from '../compartido/FirmaMarca'
import { ArrowDown } from 'lucide-react'
import type { PortadaProps } from '../tipos'
import { FavoritoModerna } from './Favorito'

export function PortadaModerna({
    nombre,
    logo,
    frase,
    bajada,
    portadaUrl,
    datos,
    aviso,
    accionPrincipal,
    acciones,
    destacado,
    contenido,
}: PortadaProps) {
    const tieneVisual = !!destacado || !!portadaUrl
    return (
        <header
            className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-16"
            aria-label="Presentación del restaurante"
        >
            <FirmaMarca className="mb-8 h-3 rounded-full sm:mb-10" />
            <div className="flex min-w-0 flex-col items-start gap-7 border-b border-border pb-10 sm:gap-9 sm:pb-14 lg:flex-row lg:items-center lg:gap-12">
                {logo && (
                    <img
                        src={logo}
                        alt=""
                        className="h-32 w-40 shrink-0 object-contain object-left sm:h-40 sm:w-48 lg:h-48 lg:w-56"
                        fetchPriority="high"
                    />
                )}
                <h1 className="tienda-display tienda-acento min-w-0 text-[clamp(54px,9.5vw,132px)] leading-[1.04] tracking-[-0.055em] [overflow-wrap:anywhere] [text-wrap:balance]">
                    {nombre}
                </h1>
            </div>
            <div
                className={`grid gap-10 py-10 sm:gap-14 sm:py-14 ${tieneVisual ? 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center' : 'max-w-4xl'}`}
            >
                <div className="min-w-0">
                    {aviso}
                    {frase && frase !== nombre && (
                        <p className="tienda-display max-w-2xl text-[clamp(28px,3.5vw,46px)] leading-[1.18] tracking-[-0.035em] [overflow-wrap:anywhere] [text-wrap:balance]">
                            {frase}
                        </p>
                    )}
                    {bajada && (
                        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
                            {bajada}
                        </p>
                    )}
                    <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
                        {datos.filter(Boolean).map((dato, i) => (
                            <span key={i} className="min-w-0 break-words">
                                {dato}
                            </span>
                        ))}
                    </div>
                    {contenido}
                    <div className="mt-9 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={accionPrincipal.onClick}
                            className="inline-flex h-14 items-center justify-center gap-5 rounded-2xl tienda-fondo-marca px-6 font-semibold transition-transform active:scale-95"
                        >
                            {accionPrincipal.texto}
                            <ArrowDown className="size-4" />
                        </button>
                        <div className="flex flex-wrap gap-3 [&>button]:h-12 [&>button]:rounded-2xl [&>button]:px-4 [&>button]:text-[13px]">
                            {acciones}
                        </div>
                    </div>
                </div>
                {destacado ? (
                    <FavoritoModerna {...destacado} />
                ) : (
                    portadaUrl && (
                        <img
                            src={portadaUrl}
                            alt={`La casa de ${nombre}`}
                            className="aspect-[5/4] w-full rounded-[32px] object-cover"
                            fetchPriority="high"
                        />
                    )
                )}
            </div>
        </header>
    )
}
