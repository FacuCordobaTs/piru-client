export function Estado({ abierto, texto }: { abierto: boolean; texto: string }) {
    return (
        <span className="inline-flex items-center gap-2">
            <span className="relative flex size-2 shrink-0">
                {abierto && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                )}
                <span
                    className={`relative size-2 rounded-full ${abierto ? 'bg-emerald-500' : 'bg-red-500'}`}
                />
            </span>
            {texto}
        </span>
    )
}
