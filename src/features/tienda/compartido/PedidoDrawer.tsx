import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Maximize2, Minimize2, X } from 'lucide-react'
import type { ReactNode } from 'react'

/** El mismo contenedor, foco y cierre para el carrito individual y el compartido. */
export function PedidoDrawer({
    abierto,
    onCerrar,
    titulo,
    checkout,
    expandido,
    onExpandir,
    altura,
    ocupado = false,
    children,
}: {
    abierto: boolean
    onCerrar: () => void
    titulo: string
    checkout: boolean
    expandido: boolean
    onExpandir?: () => void
    altura: string
    ocupado?: boolean
    children: ReactNode
}) {
    return (
        <Dialog
            open={abierto}
            onOpenChange={(abierto) => {
                if (!abierto && !ocupado) onCerrar()
            }}
        >
            <DialogContent
                showCloseButton={false}
                className={`menu-delivery top-auto bottom-0 flex max-w-2xl translate-y-0 flex-col gap-0 rounded-b-none rounded-t-[32px] border-0 p-0 shadow-[0_-18px_50px_rgba(0,0,0,0.3)] sm:max-w-2xl lg:max-w-lg ${!checkout || expandido ? 'overflow-hidden' : 'overflow-y-auto'}`}
                style={
                    !checkout ? { height: altura } : expandido ? { height: '85dvh' } : { maxHeight: '88dvh' }
                }
                onInteractOutside={(event) => {
                    if (ocupado) event.preventDefault()
                }}
                onEscapeKeyDown={(event) => {
                    if (ocupado) event.preventDefault()
                }}
            >
                <div className="sticky top-0 z-10 shrink-0 bg-background pt-2">
                    <div aria-hidden className="mx-auto my-3 h-1.5 w-12 rounded-full bg-foreground/20" />
                    <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-2">
                        <button
                            type="button"
                            onClick={onCerrar}
                            disabled={ocupado}
                            aria-label="Cerrar pedido"
                            className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-secondary disabled:opacity-40"
                        >
                            <X className="size-4" />
                        </button>
                        <DialogTitle className="tienda-display text-center text-[26px] leading-tight">
                            {titulo}
                        </DialogTitle>
                        {checkout && onExpandir ? (
                            <button
                                type="button"
                                onClick={onExpandir}
                                aria-label={expandido ? 'Minimizar' : 'Maximizar'}
                                className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-secondary"
                            >
                                {expandido ? (
                                    <Minimize2 className="size-4" />
                                ) : (
                                    <Maximize2 className="size-4" />
                                )}
                            </button>
                        ) : (
                            <span className="size-8 shrink-0" />
                        )}
                    </div>
                    <DialogDescription className="sr-only">
                        Revisá los productos de tu pedido y continuá para confirmarlo.
                    </DialogDescription>
                </div>
                {children}
            </DialogContent>
        </Dialog>
    )
}
