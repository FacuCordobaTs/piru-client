import { FirmaMarca } from '../compartido/FirmaMarca'
import { fotosDeProducto } from '@/lib/fotosProducto'
import { ArrowDown } from 'lucide-react'
import type { PortadaProps } from '../tipos'
import { FavoritoArtesanal } from './Favorito'
import './artesanal.css'

export function PortadaArtesanal({
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
    const foto = portadaUrl || (destacado ? fotosDeProducto(destacado.producto)[0] : undefined)
    return (
        <header aria-label="Bienvenida a la casa" className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 sm:pt-10">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pb-7">
                {logo && (
                    <img
                        src={logo}
                        alt=""
                        className="h-20 w-28 object-contain object-left sm:h-24 sm:w-36"
                        fetchPriority="high"
                    />
                )}
                <div className="flex max-w-full flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted-foreground">
                    {datos.filter(Boolean).map((dato, i) => (
                        <span key={i} className="min-w-0 break-words">
                            {dato}
                        </span>
                    ))}
                </div>
            </div>
            <div className="artesanal-cuadros h-5" aria-hidden />
            <FirmaMarca className="h-1.5" />
            <div
                className={`grid gap-10 py-10 sm:gap-16 sm:py-16 ${foto || destacado ? 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center' : 'max-w-3xl'}`}
            >
                <div className="min-w-0">
                    {aviso}
                    <p className="tienda-display mb-5 text-2xl italic text-[color:var(--tienda-acento-legible)] sm:text-3xl">
                        Qué bueno tenerte por acá.
                    </p>
                    <h1 className="tienda-display tienda-acento text-[clamp(48px,7.5vw,88px)] leading-[0.98] [overflow-wrap:anywhere] [text-wrap:balance]">
                        {nombre}
                    </h1>
                    {frase && frase !== nombre && (
                        <p className="tienda-display mt-6 text-[clamp(26px,3vw,36px)] leading-tight [overflow-wrap:anywhere]">
                            {frase}
                        </p>
                    )}
                    {bajada && (
                        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                            {bajada}
                        </p>
                    )}
                    {contenido}
                    <div className="mt-8 space-y-3">
                        <button
                            type="button"
                            onClick={accionPrincipal.onClick}
                            className="inline-flex min-h-13 items-center justify-center gap-5 rounded-[4px] tienda-fondo-marca px-6 py-3 text-base font-bold transition-colors hover:brightness-95"
                        >
                            {accionPrincipal.texto}
                            <ArrowDown className="size-4" />
                        </button>
                        <div className="artesanal-acciones flex flex-wrap gap-3">{acciones}</div>
                    </div>
                </div>
                {(foto || destacado) && (
                    <div className="min-w-0">
                        {foto && (
                            <figure className="mb-6 rotate-1 border border-border bg-card p-2.5 shadow-[6px_6px_0_0_var(--secondary)] sm:p-3">
                                <img
                                    src={foto}
                                    alt={portadaUrl ? `Un poquito de ${nombre}` : destacado?.producto.nombre}
                                    fetchPriority="high"
                                    className="aspect-[5/4] w-full object-cover"
                                />
                                <figcaption className="tienda-display px-2 pb-1 pt-3 text-center text-base italic text-muted-foreground">
                                    Un ratito para disfrutar.
                                </figcaption>
                            </figure>
                        )}
                        {destacado && <FavoritoArtesanal {...destacado} />}
                    </div>
                )}
            </div>
        </header>
    )
}
