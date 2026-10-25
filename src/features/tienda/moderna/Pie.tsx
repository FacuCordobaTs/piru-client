import { ArrowUpRight } from 'lucide-react'
import { Contacto, Creditos } from '../compartido/Contacto'
import { LineaAjustada } from '../compartido/LineaAjustada'
import type { PieProps } from '../tipos'

/** El cierre: el último llamado a pedir en el segundo color y el nombre del local de lado a lado. */
export function PieModerna(props: PieProps) {
    const { nombre, logo, onPedir } = props
    return (
        <footer className="mx-auto max-w-7xl px-5 pb-32 pt-24 sm:px-8 sm:pt-32">
            <div className="tienda-fondo-complemento rounded-[28px] p-6 sm:rounded-[44px] sm:p-12">
                <div className="flex flex-wrap items-end justify-between gap-8">
                    <p className="tienda-display max-w-3xl text-[clamp(38px,5.6vw,84px)] leading-[0.92] [text-wrap:balance]">
                        ¿Se te antojó algo?
                    </p>
                    {onPedir && (
                        <button
                            type="button"
                            onClick={onPedir}
                            className="group inline-flex h-16 items-center gap-4 rounded-full bg-foreground pl-7 pr-2 text-base font-bold text-background transition-transform active:scale-[0.97]"
                        >
                            Hacer mi pedido
                            <span className="tienda-fondo-marca grid size-12 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45">
                                <ArrowUpRight className="size-5" />
                            </span>
                        </button>
                    )}
                </div>
                <div className="mt-12 grid gap-9 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
                    <Contacto {...props} />
                </div>
            </div>
            <div className="mt-10 flex items-end gap-4 sm:mt-14 sm:gap-6">
                {logo && (
                    <img src={logo} alt="" className="mb-[0.5%] size-14 shrink-0 object-contain sm:size-24" />
                )}
                <div className="tienda-display tienda-acento min-w-0 flex-1">
                    <LineaAjustada texto={nombre} maximo={260} className="leading-[0.8]" />
                </div>
            </div>
            <Creditos />
        </footer>
    )
}
