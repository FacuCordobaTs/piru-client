import type { HistoriaProps } from '../tipos'

export function HistoriaArtesanal({ historia, fotos, nombre }: HistoriaProps) {
    if (!historia?.texto && !fotos.length) return null
    return (
        <section aria-label="La casa" className="mx-auto mt-24 max-w-6xl px-5 sm:px-8">
            <div className="artesanal-cuadros h-5 border-y border-primary/15" aria-hidden />
            <div
                className={`grid items-center gap-10 bg-secondary/50 px-5 py-10 sm:px-10 sm:py-14 ${fotos.length && historia?.texto ? 'lg:grid-cols-2 lg:gap-16' : ''}`}
            >
                {fotos.length > 0 && (
                    <div className={`grid items-start gap-4 ${fotos.length > 1 ? 'grid-cols-2' : ''}`}>
                        {fotos.map((foto, i) => (
                            <figure
                                key={foto}
                                className={`border border-border bg-card p-2 shadow-sm ${i % 2 ? 'mt-7 rotate-1' : '-rotate-1'}`}
                            >
                                <img
                                    src={foto}
                                    alt={`${nombre}, foto ${i + 1}`}
                                    loading="lazy"
                                    className="aspect-[4/5] w-full object-cover"
                                />
                                <figcaption className="tienda-display px-1 pb-1 pt-2 text-sm italic text-muted-foreground">
                                    Un poquito de nuestra casa.
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                )}
                {historia?.texto && (
                    <div className="min-w-0">
                        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--tienda-acento-legible)]">
                            Detrás del mostrador
                        </p>
                        <h2 className="tienda-display text-[clamp(36px,4.5vw,56px)] leading-[1.08] [overflow-wrap:anywhere]">
                            {historia.titulo || 'Esta es nuestra casa'}
                        </h2>
                        <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
                            {historia.texto
                                .split(/\n+/)
                                .filter(Boolean)
                                .map((texto, i) => (
                                    <p key={i}>{texto}</p>
                                ))}
                        </div>
                        <p className="tienda-display mt-7 text-2xl italic text-[color:var(--tienda-acento-legible)]">
                            Con cariño, {nombre}.
                        </p>
                    </div>
                )}
            </div>
        </section>
    )
}
