import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { formatoPesos } from '@/lib/tienda'
import { Check, Loader2, Users, X } from 'lucide-react'
import type { MenuGrupoModel } from './useMenuGrupo'

export function ConfirmacionGrupo({ modelo }: { modelo: MenuGrupoModel }) {
    const {
        confirmacionGrupalOpen,
        todosConfirmaron,
        confirmacionGrupal,
        clienteNombre,
        esSala,
        checkoutDeliveryData,
        totalConfirmados,
        totalClientes,
        clienteId,
        yaConfirme,
        confirmarMiParte,
        cancelarConfirmacion,
        enviandoSolo,
    } = modelo

    return (
        <>
            {/* --- MODAL DE CONFIRMACIÓN GRUPAL --- */}
            <Dialog open={confirmacionGrupalOpen} onOpenChange={() => {}}>
                <DialogContent
                    className="flex max-h-[85dvh] max-w-sm flex-col rounded-[28px] p-4 sm:p-5"
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    {todosConfirmaron ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                            <Loader2 className="size-12 animate-spin text-primary" />
                            <DialogTitle className="tienda-display text-center text-3xl font-normal">
                                ¡Todos confirmaron!
                            </DialogTitle>
                            <DialogDescription className="text-center text-sm">
                                Estamos preparando tu pedido, te redirigimos en un momento...
                            </DialogDescription>
                        </div>
                    ) : (
                        <>
                            <DialogHeader className="shrink-0 text-center">
                                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground sm:mb-3 sm:size-14">
                                    <Users className="size-6 sm:size-7" />
                                </div>
                                <DialogTitle className="tienda-display text-center text-3xl font-normal leading-none">
                                    Confirmar el pedido
                                </DialogTitle>
                                <DialogDescription className="pt-1 text-center text-sm">
                                    {confirmacionGrupal?.iniciadaPorNombre === clienteNombre
                                        ? 'Esperando que todos confirmen...'
                                        : `${confirmacionGrupal?.iniciadaPorNombre} quiere confirmar`}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Resumen del pedido (sala: datos de envío) - compacto */}
                            {esSala && checkoutDeliveryData && (
                                <div className="mt-2 shrink-0 space-y-1 overflow-hidden rounded-2xl bg-secondary p-3 text-left sm:mt-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Resumen
                                    </p>
                                    <p className="truncate text-xs">
                                        <span className="text-muted-foreground">Nombre:</span>{' '}
                                        {checkoutDeliveryData.nombre}
                                    </p>
                                    <p className="truncate text-xs">
                                        <span className="text-muted-foreground">Celular:</span>{' '}
                                        {checkoutDeliveryData.telefono}
                                    </p>
                                    {checkoutDeliveryData.tipoPedido === 'delivery' && (
                                        <p className="truncate text-xs">
                                            <span className="text-muted-foreground">Dirección:</span>{' '}
                                            {checkoutDeliveryData.direccion}
                                        </p>
                                    )}
                                    {checkoutDeliveryData.tipoPedido === 'delivery' &&
                                        checkoutDeliveryData.deliveryFee > 0 && (
                                            <p className="text-xs">
                                                <span className="text-muted-foreground">Envío:</span>{' '}
                                                {formatoPesos(checkoutDeliveryData.deliveryFee)}
                                            </p>
                                        )}
                                    <p className="border-t border-dashed border-border pt-1.5 text-sm font-bold">
                                        Total: {formatoPesos(checkoutDeliveryData.total)}
                                    </p>
                                </div>
                            )}

                            {/* Lista de usuarios - scroll interno si hace falta */}
                            <div className="mt-2 min-h-0 flex-1 overflow-y-auto sm:mt-3">
                                <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {totalConfirmados}/{totalClientes} confirmados
                                </p>

                                <div className="flex flex-wrap justify-center gap-2 py-2 sm:gap-3">
                                    {confirmacionGrupal?.confirmaciones.map((conf) => {
                                        const esYo = conf.clienteId === clienteId
                                        return (
                                            <div
                                                key={conf.clienteId}
                                                className="flex flex-col items-center gap-1"
                                            >
                                                <div
                                                    className={`relative flex size-11 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 sm:size-12 ${
                                                        conf.confirmado
                                                            ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                                                            : 'bg-secondary text-muted-foreground'
                                                    }`}
                                                >
                                                    {conf.nombre.slice(0, 2).toUpperCase()}
                                                    {conf.confirmado ? (
                                                        <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500">
                                                            <Check className="size-2.5 text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-muted-foreground">
                                                            <Loader2 className="size-2.5 animate-spin text-background" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span
                                                    className={`max-w-[48px] truncate text-center text-[10px] font-medium sm:max-w-[56px] ${esYo ? 'text-foreground' : 'text-muted-foreground'}`}
                                                >
                                                    {esYo ? 'Vos' : conf.nombre}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <DialogFooter className="mt-3 shrink-0 flex-col gap-2 border-t border-dashed border-border pt-3">
                                {!yaConfirme ? (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={confirmarMiParte}
                                            className="h-12 w-full rounded-full font-semibold"
                                        >
                                            <Check className="mr-2 size-4" />
                                            Confirmar mi parte
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={cancelarConfirmacion}
                                            className="h-10 w-full rounded-full text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="mr-2 size-4" />
                                            Cancelar
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-full rounded-full bg-secondary px-3 py-2.5 text-center">
                                            <p className="text-xs font-medium">
                                                ✓ Ya confirmaste. Esperando a los demás...
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={cancelarConfirmacion}
                                            className="h-10 w-full rounded-full text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="mr-2 size-4" />
                                            Cancelar para todos
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* --- OVERLAY DE ENVÍO EN SOLITARIO --- */}
            {/* Un solo cliente no pasa por la votación grupal, pero igual hay un delay entre confirmar
          y que el WS/poll redirija a la pantalla de éxito. Este overlay le da feedback de que su
          pedido se está procesando (equivalente al estado "¡Todos confirmaron!" del flujo grupal). */}
            <Dialog open={enviandoSolo} onOpenChange={() => {}}>
                <DialogContent
                    className="max-w-sm rounded-[28px] p-4 sm:p-5"
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <Loader2 className="size-12 animate-spin text-primary" />
                        <DialogTitle className="tienda-display text-center text-3xl font-normal">
                            ¡Pedido confirmado!
                        </DialogTitle>
                        <DialogDescription className="text-center text-sm">
                            Estamos preparando tu pedido, te redirigimos en un momento...
                        </DialogDescription>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
