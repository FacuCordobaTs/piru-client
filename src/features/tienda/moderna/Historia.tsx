import type { HistoriaProps } from '../tipos'

export function HistoriaModerna({ historia, fotos, nombre }: HistoriaProps) {
    if (!historia?.texto && !fotos.length) return null
    return (
        <section aria-label="La casa" className="mx-auto mt-24 max-w-7xl px-5 sm:px-8">
            {historia?.texto && (
                <div className="mb-10 grid gap-6 md:grid-cols-2 md:gap-16">
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[color:var(--tienda-acento-legible)]">
                            Conocé {nombre}
                        </p>
                        <h2 className="tienda-display text-[clamp(36px,5vw,64px)] leading-[1.12] [overflow-wrap:anywhere]">
                            {historia.titulo || 'Detrás de cada plato'}
                        </h2>
                    </div>
                    <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                        {historia.texto
                            .split(/\n+/)
                            .filter(Boolean)
                            .map((texto, i) => (
                                <p key={i}>{texto}</p>
                            ))}
                    </div>
                </div>
            )}
            {fotos.length > 0 && (
                <div className="tienda-sin-barra flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
                    {fotos.map((foto, i) => (
                        <img
                            key={foto}
                            src={foto}
                            alt={`${nombre}, foto ${i + 1}`}
                            loading="lazy"
                            className="aspect-[4/3] w-[80%] shrink-0 snap-start rounded-3xl object-cover sm:w-[45%] lg:w-[32%]"
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
