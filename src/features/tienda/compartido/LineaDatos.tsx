import { type ReactNode } from 'react'

export function LineaDatos({ items }: { items: ReactNode[] }) {
    const visibles = items.filter(Boolean)
    if (visibles.length === 0) return null
    return (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-foreground py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
            {visibles.map((item, i) => (
                <span key={i} className="flex min-w-0 items-center gap-4">
                    {i > 0 && <span aria-hidden className="size-1 shrink-0 rotate-45 bg-foreground" />}
                    <span className="min-w-0 truncate">{item}</span>
                </span>
            ))}
        </div>
    )
}
