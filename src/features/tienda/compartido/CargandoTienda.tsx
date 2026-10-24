export function CargandoTienda({ nombre, logo }: { nombre?: string | null; logo?: string | null }) {
    return (
        <div className="menu-delivery flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
            <span className="grid size-24 animate-pulse place-items-center">
                {logo ? (
                    <img src={logo} alt={nombre ?? ''} className="size-full object-contain p-2" />
                ) : (
                    <span className="tienda-display text-4xl">
                        {nombre?.trim().charAt(0).toUpperCase() ?? ''}
                    </span>
                )}
            </span>
            <span className="h-1 w-24 overflow-hidden rounded-full bg-secondary" aria-label="Cargando">
                <span className="block h-full w-full origin-left animate-[tienda-progreso_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
            </span>
        </div>
    )
}

// ── Piezas de la identidad ──
