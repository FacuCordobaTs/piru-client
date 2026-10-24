import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Share2, User } from 'lucide-react'
import type { MenuDeliveryModel } from './useMenuDelivery'

export function CrearSalaDialog({ modelo }: { modelo: MenuDeliveryModel }) {
    const {
        modalSalaOpen,
        setModalSalaOpen,
        handleCrearSala,
        nombreSala,
        setNombreSala,
        telefonoSala,
        setTelefonoSala,
        creandoSala,
    } = modelo
    return (
        <>
            <Dialog open={modalSalaOpen} onOpenChange={setModalSalaOpen}>
                <DialogContent className="max-w-sm rounded-[28px] p-6">
                    <DialogHeader className="text-center sm:text-center">
                        <div className="mx-auto mb-4">
                            <AvatarStack />
                        </div>
                        <DialogTitle className="tienda-display text-3xl font-normal leading-none">
                            Pedido entre amigos
                        </DialogTitle>
                        <DialogDescription className="pt-1 text-center">
                            Un solo pedido para todo el grupo, sin pasarse la lista.
                        </DialogDescription>
                    </DialogHeader>
                    <ol className="mt-4 space-y-3">
                        {[
                            'Compartís el link con tu grupo',
                            'Cada uno agrega lo suyo desde su celu',
                            'Todo sale junto, en un solo pedido',
                        ].map((paso, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                                    {i + 1}
                                </span>
                                <span className="text-sm leading-snug text-foreground/80">{paso}</span>
                            </li>
                        ))}
                    </ol>
                    <form onSubmit={handleCrearSala} className="mt-5 space-y-3">
                        <div className="space-y-1 text-left">
                            <label className="px-1 text-xs font-semibold uppercase text-muted-foreground">
                                Tu nombre
                            </label>
                            <Input
                                placeholder="¿Cuál es tu nombre?"
                                value={nombreSala}
                                onChange={(e) => setNombreSala(e.target.value)}
                                required
                                autoComplete="name"
                                autoFocus
                                className="h-12 rounded-2xl text-center"
                            />
                        </div>
                        <div className="space-y-1 text-left">
                            <label className="px-1 text-xs font-semibold uppercase text-muted-foreground">
                                Tu WhatsApp
                            </label>
                            <Input
                                type="tel"
                                placeholder="Ej: 11 2345 6789"
                                value={telefonoSala}
                                onChange={(e) => setTelefonoSala(e.target.value)}
                                required
                                autoComplete="tel"
                                className="h-12 rounded-2xl text-center"
                            />
                            <p className="px-1 text-[11px] text-muted-foreground">
                                Para asociar tus productos a tu cuenta
                            </p>
                        </div>
                        <DialogFooter className="flex-col gap-2 pt-1 sm:gap-2">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={
                                    creandoSala ||
                                    !nombreSala.trim() ||
                                    (telefonoSala || '').replace(/\D/g, '').length < 8
                                }
                                className="h-12 w-full rounded-full font-semibold"
                            >
                                {creandoSala ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Creando tu link…
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="size-4" />
                                        Crear mi link
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
// Pila de avatares con un lugar libre ("+"): el visual de "un grupo con lugar para vos".
// Es lo que hace legible el pedido entre amigos sin leer ni una palabra; la usa el diálogo.
const AvatarStack = () => (
    <div className="flex shrink-0 -space-x-3">
        <div className="z-[2] flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
            <User className="size-5" />
        </div>
        <div className="z-[1] flex size-11 items-center justify-center rounded-full bg-secondary text-foreground ring-2 ring-background">
            <User className="size-5" />
        </div>
        <div className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-foreground/30 bg-background text-muted-foreground">
            <Plus className="size-5" />
        </div>
    </div>
)
