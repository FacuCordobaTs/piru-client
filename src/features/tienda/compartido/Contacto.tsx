import { DIAS, SEMANA, turnosDelDia } from '@/lib/tienda'
import { Instagram, MapPin, MessageCircle } from 'lucide-react'
import type { PieProps } from '../tipos'

export function Contacto({
    direccion,
    horarios,
    instagram,
    whatsapp,
}: Pick<PieProps, 'direccion' | 'horarios' | 'instagram' | 'whatsapp'>) {
    return (
        <>
            {direccion && (
                <div>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Encontranos
                    </h3>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-2 text-sm leading-relaxed hover:underline"
                    >
                        <MapPin className="mt-0.5 size-4 shrink-0" />
                        {direccion}
                    </a>
                </div>
            )}
            {horarios.length > 0 && (
                <div>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Horarios
                    </h3>
                    <dl className="space-y-1 text-sm">
                        {SEMANA.map((dia) => (
                            <div key={dia} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                                <dt>{DIAS[dia]}</dt>
                                <dd className="tabular-nums text-muted-foreground">
                                    {turnosDelDia(horarios, dia) || 'Cerrado'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
            {(instagram || whatsapp) && (
                <div>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Sigamos en contacto
                    </h3>
                    <div className="flex flex-col items-start gap-3 text-sm">
                        {whatsapp && (
                            <a
                                href={`https://wa.me/${whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 hover:underline"
                            >
                                <MessageCircle className="size-4" />
                                WhatsApp
                            </a>
                        )}
                        {instagram && (
                            <a
                                href={`https://www.instagram.com/${encodeURIComponent(instagram)}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-2 break-all hover:underline"
                            >
                                <Instagram className="size-4 shrink-0" />@{instagram}
                            </a>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export function Creditos() {
    return (
        <div className="flex flex-wrap justify-between gap-3 py-6 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()}</span>
            <a
                href="https://info.piru.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
            >
                Tienda online con Piru
            </a>
        </div>
    )
}
