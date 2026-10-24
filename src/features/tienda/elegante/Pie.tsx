import { ACCESO_SECUNDARIO, DIAS, SEMANA, turnosDelDia } from '@/lib/tienda'
import { ArrowUp, ArrowUpRight, Instagram, MessageCircle } from 'lucide-react'
import type { PieProps } from '../tipos'

export function PieElegante({ nombre, logo, direccion, horarios, instagram, whatsapp, onPedir }: PieProps) {
    const hoy = new Date().getDay()
    const calle = direccion?.trim()
    return (
        <footer className="mx-auto max-w-6xl px-4 pb-32 pt-24 sm:px-6">
            <div className="relative mx-auto max-w-2xl border-[1.5px] border-foreground p-1.5">
                <div className="border border-foreground/40 px-6 pb-10 pt-12 text-center sm:px-12">
                    <span className="mx-auto grid size-20 place-items-center">
                        {logo ? (
                            <img src={logo} alt={nombre} className="size-full object-contain" />
                        ) : (
                            <span className="tienda-display text-4xl">
                                {nombre.trim().charAt(0).toUpperCase()}
                            </span>
                        )}
                    </span>
                    <p className="tienda-display mt-5 text-[clamp(32px,8vw,52px)] leading-[0.95] text-foreground">
                        {nombre}
                    </p>

                    {calle && (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(calle)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group mt-8 block"
                        >
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Dónde
                            </span>
                            <span className="mt-1.5 inline-flex items-center gap-1.5 text-lg font-semibold text-foreground underline decoration-foreground/25 underline-offset-[6px] group-hover:decoration-foreground">
                                {calle} <ArrowUpRight className="size-4" />
                            </span>
                        </a>
                    )}

                    {horarios.length > 0 && (
                        <div className="mt-8">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Cuándo
                            </span>
                            <dl className="mx-auto mt-3 max-w-sm">
                                {SEMANA.map((dia) => (
                                    <div
                                        key={dia}
                                        className={`flex items-baseline gap-3 py-1 text-sm ${dia === hoy ? 'font-bold text-foreground' : 'text-foreground/70'}`}
                                    >
                                        <dt className="shrink-0">{DIAS[dia]}</dt>
                                        <span
                                            aria-hidden
                                            className="mb-1 flex-1 border-b border-dotted border-foreground/30"
                                        />
                                        <dd className="shrink-0 tabular-nums">
                                            {turnosDelDia(horarios, dia) || 'Cerrado'}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {(instagram || whatsapp) && (
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {whatsapp && (
                                <a
                                    href={`https://wa.me/${whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={ACCESO_SECUNDARIO.replace('h-14', 'h-11')}
                                >
                                    <MessageCircle className="size-4" /> WhatsApp
                                </a>
                            )}
                            {instagram && (
                                <a
                                    href={`https://www.instagram.com/${instagram}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={ACCESO_SECUNDARIO.replace('h-14', 'h-11')}
                                >
                                    <Instagram className="size-4" /> @{instagram}
                                </a>
                            )}
                        </div>
                    )}

                    {onPedir && (
                        <button
                            type="button"
                            onClick={onPedir}
                            className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                        >
                            Hacer mi pedido <ArrowUp className="size-4" />
                        </button>
                    )}
                </div>
            </div>
            <div className="mx-auto mt-3 flex max-w-2xl justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span>© {new Date().getFullYear()}</span>
                <a
                    href="https://info.piru.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                >
                    Tienda online con Piru
                </a>
            </div>
        </footer>
    )
}
