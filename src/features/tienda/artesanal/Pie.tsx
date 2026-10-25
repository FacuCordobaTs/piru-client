import { ArrowUpRight } from 'lucide-react'
import { Contacto, Creditos } from '../compartido/Contacto'
import { TextoCircular } from '../compartido/TextoCircular'
import type { PieProps } from '../tipos'

/** La despedida en el pizarrón grande de la pared, con el sello de la casa y el mantel. */
export function PieArtesanal(props: PieProps) {
    const { nombre, logo, onPedir } = props
    return (
        <footer className="mt-28 pb-28 sm:mt-36">
            <div aria-hidden className="artesanal-cuadros h-10 sm:h-14" />
            <div className="artesanal-contacto bg-foreground text-background">
                <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
                    <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_auto]">
                        <div>
                            <p className="tienda-display text-[clamp(52px,8.5vw,120px)] leading-[0.9]">
                                Nos vemos pronto.
                            </p>
                            <p className="tienda-display mt-5 text-xl italic opacity-80 sm:text-2xl">
                                Siempre es lindo compartir algo rico.
                            </p>
                            {onPedir && (
                                <button
                                    type="button"
                                    onClick={onPedir}
                                    className="group mt-9 inline-flex min-h-14 w-fit items-center gap-4 rounded-[4px] bg-background px-6 py-3 text-base font-bold text-foreground shadow-[4px_4px_0_0_var(--tienda-marca)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--tienda-marca)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                                >
                                    Hacer mi pedido
                                    <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </button>
                            )}
                        </div>
                        <div
                            aria-hidden
                            className="artesanal-sello tienda-fondo-marca relative mx-auto grid size-44 -rotate-6 place-items-center sm:size-52"
                        >
                            <TextoCircular
                                texto={`${nombre.toUpperCase()} ✦ HECHO CON CARIÑO ✦ `}
                                className="absolute inset-0 size-full"
                            />
                            {logo ? (
                                <span className="grid size-20 place-items-center rounded-[4px] bg-card p-2 sm:size-24">
                                    <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
                                </span>
                            ) : (
                                <span className="tienda-display text-6xl">
                                    {nombre.trim().charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-14 grid gap-10 border-t-2 border-dashed border-background/25 pt-12 sm:grid-cols-2 lg:grid-cols-3">
                        <Contacto {...props} />
                    </div>
                </div>
            </div>
            <div aria-hidden className="artesanal-cuadros h-6" />
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
                <Creditos />
            </div>
        </footer>
    )
}
