import { Contacto, Creditos } from '../compartido/Contacto'
import type { PieProps } from '../tipos'

export function PieSencilla(props: PieProps) {
    return (
        <footer className="mx-auto max-w-6xl px-5 pb-32 pt-24 sm:px-8">
            <div className="grid gap-9 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-3">
                <Contacto {...props} />
            </div>
            <div className="mt-10">
                <Creditos />
            </div>
        </footer>
    )
}

/** Sin historia ni galería: la plantilla gratis es sólo la carta. */
export function HistoriaSencilla() {
    return null
}
