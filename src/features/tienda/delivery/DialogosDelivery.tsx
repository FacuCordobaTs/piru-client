import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Sparkles } from 'lucide-react'
import type { MenuDeliveryModel } from './useMenuDelivery'

export function DialogosDelivery({ modelo }: { modelo: MenuDeliveryModel }) {
    const { modalPuntosOpen, setModalPuntosOpen, handleLoginPuntos, telefonoCliente, loadingPuntos } = modelo
    return (
        <>
            <Sheet open={modalPuntosOpen} onOpenChange={setModalPuntosOpen}>
                <SheetContent side="bottom" className="rounded-t-[32px] border-none">
                    <form onSubmit={handleLoginPuntos} className="mx-auto w-full max-w-md space-y-6 p-4 py-8">
                        <div className="space-y-2 text-center">
                            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
                                <Sparkles className="size-6" />
                            </div>
                            <SheetTitle className="tienda-display text-3xl font-normal">
                                Tus puntos
                            </SheetTitle>
                            <SheetDescription>
                                Ingresá tu celular de WhatsApp para ver los puntos de tus pedidos anteriores.
                            </SheetDescription>
                        </div>
                        <input
                            type="tel"
                            name="telefono"
                            required
                            defaultValue={telefonoCliente}
                            className="w-full rounded-2xl border border-input bg-transparent py-4 text-center text-lg outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                            placeholder="Tu número de celular"
                        />
                        <Button type="submit" className="h-14 w-full rounded-full text-base font-semibold">
                            {loadingPuntos ? 'Consultando...' : 'Ver mis puntos'}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    )
}
