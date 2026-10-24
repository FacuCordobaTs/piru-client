import { ArrowUpRight } from 'lucide-react'
import { Contacto, Creditos } from '../compartido/Contacto'
import type { PieProps } from '../tipos'

export function PieArtesanal(props: PieProps) {
    const { nombre, logo, onPedir } = props
    return (
        <footer className="mx-auto mt-20 max-w-6xl px-5 pb-28 sm:px-8">
            <div className="artesanal-contacto bg-foreground px-6 py-10 text-background sm:px-10 sm:py-12">
                <div className="mb-10 grid items-center gap-7 border-b border-background/20 pb-10 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                        <p className="tienda-display text-[clamp(44px,6vw,72px)] leading-none">
                            Nos vemos pronto.
                        </p>
                        <p className="mt-4 text-base opacity-80">Siempre es lindo compartir algo rico.</p>
                    </div>
                    {onPedir && (
                        <button
                            type="button"
                            onClick={onPedir}
                            className="inline-flex min-h-12 w-fit items-center gap-4 rounded-[4px] bg-background px-5 py-3 text-sm font-bold text-foreground"
                        >
                            Hacer mi pedido <ArrowUpRight className="size-4" />
                        </button>
                    )}
                </div>
                <div className="mb-8 flex items-center gap-4">
                    {logo && (
                        <img
                            src={logo}
                            alt=""
                            className="size-16 shrink-0 bg-background/95 p-2 object-contain"
                        />
                    )}
                    <p className="tienda-display min-w-0 text-3xl [overflow-wrap:anywhere]">{nombre}</p>
                </div>
                <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
                    <Contacto {...props} />
                </div>
            </div>
            <div className="artesanal-cuadros h-4" aria-hidden />
            <Creditos />
        </footer>
    )
}
