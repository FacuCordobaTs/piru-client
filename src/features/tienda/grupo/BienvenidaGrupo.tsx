import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Share2, Users } from 'lucide-react'
import type { MenuGrupoModel } from './useMenuGrupo'

export function BienvenidaGrupo({ modelo }: { modelo: MenuGrupoModel }) {
    const { bienvenidaOpen, setBienvenidaOpen, compartirLink } = modelo

    return (
        <>
            {/* --- MODAL DE BIENVENIDA --- */}
            <Dialog open={bienvenidaOpen} onOpenChange={setBienvenidaOpen}>
                <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-[32px] border-0 p-0 shadow-2xl">
                    {/* Cabecera con el color de la marca */}
                    <div className="relative overflow-hidden bg-primary px-6 pb-10 pt-8 text-primary-foreground">
                        <div
                            aria-hidden
                            className="absolute -right-12 -top-12 size-44 rounded-full border border-current opacity-15"
                        />
                        <div
                            aria-hidden
                            className="absolute -right-2 top-10 size-28 rounded-full border border-current opacity-15"
                        />
                        <div className="mb-4 grid size-14 place-items-center rounded-full bg-primary-foreground/15">
                            <Users className="size-7" />
                        </div>
                        <DialogTitle className="tienda-display text-[34px] font-normal leading-[0.95]">
                            Armá el pedido
                            <br />
                            con tus amigos
                        </DialogTitle>
                        <DialogDescription className="mt-3 text-sm leading-relaxed text-primary-foreground/75">
                            Cada uno elige lo suyo y al final confirman juntos con un solo toque.
                        </DialogDescription>
                    </div>

                    {/* Cuerpo */}
                    <div className="space-y-5 bg-background px-6 py-5">
                        <div className="space-y-3.5">
                            {[
                                {
                                    n: '1',
                                    title: 'Elegí lo tuyo',
                                    desc: 'Explorá la carta y sumá lo que quieras al pedido.',
                                },
                                {
                                    n: '2',
                                    title: 'Invitá a tus amigos',
                                    desc: 'Compartí el link para que cada uno arme su parte.',
                                },
                                {
                                    n: '3',
                                    title: 'Confirmen juntos',
                                    desc: 'Todos confirman y el pedido sale solo.',
                                },
                            ].map(({ n, title, desc }) => (
                                <div key={n} className="flex items-start gap-3">
                                    <span className="tienda-display mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-xs text-background">
                                        {n}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{title}</p>
                                        <p className="text-xs leading-snug text-muted-foreground">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={compartirLink}
                            className="flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-dashed border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground"
                        >
                            <Share2 className="size-4" />
                            Compartir link con amigos
                        </button>

                        <Button
                            className="h-14 w-full rounded-full text-base font-semibold shadow-md"
                            onClick={() => setBienvenidaOpen(false)}
                        >
                            ¡Empezar a pedir!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
