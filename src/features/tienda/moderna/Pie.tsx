import { ArrowUpRight } from 'lucide-react'
import { Contacto, Creditos } from '../compartido/Contacto'
import type { PieProps } from '../tipos'

export function PieModerna(props: PieProps) {
    const { nombre, logo, onPedir } = props
    return (
        <footer className="mx-auto mt-24 max-w-7xl px-5 pb-28 sm:px-8">
            <div className="rounded-[32px] bg-secondary p-6 sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-6 border-b border-border pb-8">
                    <div className="flex items-center gap-4">
                        {logo && <img src={logo} alt="" className="size-14 shrink-0 object-contain" />}
                        <p className="tienda-display break-words text-3xl">{nombre}</p>
                    </div>
                    {onPedir && (
                        <button
                            type="button"
                            onClick={onPedir}
                            className="inline-flex h-12 items-center gap-3 rounded-xl bg-foreground px-5 text-sm font-semibold text-background"
                        >
                            Hacer mi pedido
                            <ArrowUpRight className="size-4" />
                        </button>
                    )}
                </div>
                <div className="grid gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
                    <Contacto {...props} />
                </div>
            </div>
            <Creditos />
        </footer>
    )
}
