import { Trash2 } from 'lucide-react'

export function LineaPedido({
    nombre,
    imagen,
    cantidad,
    total,
    original,
    detalles,
    autor,
    propio = true,
    onQuitar,
}: {
    nombre: string
    imagen?: string | null
    cantidad: number
    total: string
    original?: string
    detalles: { excluidos?: string[]; agregados?: string[]; nota?: string | null }
    autor?: string
    propio?: boolean
    onQuitar?: () => void
}) {
    return (
        <article
            className={`flex gap-3 rounded-[22px] p-2 pr-3 ${propio ? 'bg-card ring-1 ring-border' : 'bg-secondary/60 opacity-85'}`}
        >
            {imagen && (
                <div className="relative size-[76px] shrink-0 overflow-hidden rounded-2xl bg-secondary">
                    <img src={imagen} alt="" className="size-full object-cover" />
                    {cantidad > 1 && (
                        <span className="absolute right-1 top-1 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-background">
                            ×{cantidad}
                        </span>
                    )}
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="line-clamp-2 text-[15px] font-semibold leading-5">
                            {nombre}
                            {!imagen && cantidad > 1 && (
                                <span className="ml-2 text-xs text-muted-foreground">×{cantidad}</span>
                            )}
                        </p>
                        {autor && (
                            <span
                                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${propio ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
                            >
                                {autor}
                            </span>
                        )}
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                        {original && (
                            <del className="block text-[11px] text-muted-foreground">{original}</del>
                        )}
                        <p className="text-[15px] font-bold leading-5">{total}</p>
                    </div>
                </div>
                <div className="mt-1 flex items-end justify-between gap-3">
                    <div className="min-w-0 space-y-0.5 text-xs leading-4 text-muted-foreground">
                        {!!detalles.excluidos?.length && <p>Sin {detalles.excluidos.join(', ')}</p>}
                        {!!detalles.agregados?.length && <p>+ {detalles.agregados.join(', ')}</p>}
                        {detalles.nota && <p className="italic">“{detalles.nota}”</p>}
                    </div>
                    {onQuitar && (
                        <button
                            type="button"
                            onClick={onQuitar}
                            aria-label={`Quitar ${nombre} del pedido`}
                            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    )}
                </div>
            </div>
        </article>
    )
}
