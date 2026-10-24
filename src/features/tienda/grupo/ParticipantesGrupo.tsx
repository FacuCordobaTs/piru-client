import type { MenuGrupoModel } from './useMenuGrupo'

export function ParticipantesGrupo({ modelo }: { modelo: MenuGrupoModel }) {
    const { clienteNombre, otrosClientes, esSala } = modelo

    return (
        <>
            {/* Quiénes están en el pedido */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground pl-1 pr-3 text-[13px] font-semibold text-background">
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        VOS
                    </span>
                    {clienteNombre}
                </span>
                {otrosClientes.map((cliente) => (
                    <span
                        key={cliente.id}
                        className="inline-flex h-9 items-center gap-2 rounded-full border-[1.5px] border-foreground pl-1 pr-3 text-[13px] font-medium text-foreground"
                    >
                        <span className="grid size-6 place-items-center rounded-full bg-secondary text-[10px] font-bold">
                            {cliente.nombre.slice(0, 2).toUpperCase()}
                        </span>
                        {cliente.nombre}
                    </span>
                ))}
                {otrosClientes.length === 0 && esSala && (
                    <span className="text-[13px] italic text-muted-foreground">Esperando que se sumen…</span>
                )}
            </div>
        </>
    )
}
