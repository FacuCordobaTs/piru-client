import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ArrowLeft, Loader2, MapPin, Store } from 'lucide-react'

const CheckoutDelivery = () => {
    const navigate = useNavigate()
    const { username } = useParams()

    const [cart, setCart] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const [tipoPedido, setTipoPedido] = useState<'delivery' | 'takeaway'>('delivery')
    const [nombre, setNombre] = useState(localStorage.getItem('cliente_nombre') || '')
    const [telefono, setTelefono] = useState(localStorage.getItem('cliente_telefono') || '')
    const [direccion, setDireccion] = useState(localStorage.getItem('cliente_direccion') || '')
    const [notas, setNotas] = useState('')

    const hasSavedInfo = !!(localStorage.getItem('cliente_nombre') && localStorage.getItem('cliente_telefono'))
    const [editMode, setEditMode] = useState(!hasSavedInfo)


    useEffect(() => {
        const savedCart = sessionStorage.getItem('deliveryCart')
        if (savedCart) {
            setCart(JSON.parse(savedCart))
        } else {
            navigate(`/${username}`)
        }
    }, [username, navigate])

    const total = cart?.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.precio) * item.cantidad), 0) || 0

    const handleConfirm = async () => {
        if (!nombre.trim()) return toast.error('Ingresa tu nombre')
        if (!telefono.trim()) return toast.error('Ingresa tu celular')
        if (tipoPedido === 'delivery' && !direccion.trim()) return toast.error('Ingresa tu dirección')

        setLoading(true)
        try {
            const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
            const endpoint = tipoPedido === 'delivery' ? '/public/delivery/create' : '/public/takeaway/create'

            const payload: any = {
                restauranteId: cart.restauranteId,
                nombreCliente: nombre,
                telefono: telefono,
                notas: notas,
                items: cart.items.map((i: any) => ({
                    productoId: i.productoId,
                    cantidad: i.cantidad,
                    ingredientesExcluidos: i.ingredientesExcluidos
                }))
            }

            if (tipoPedido === 'delivery') {
                payload.direccion = direccion
            }

            const res = await fetch(`${url}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                // Save client info for future purchases
                localStorage.setItem('cliente_nombre', nombre)
                localStorage.setItem('cliente_telefono', telefono)
                if (tipoPedido === 'delivery') {
                    localStorage.setItem('cliente_direccion', direccion)
                }

                sessionStorage.removeItem('deliveryCart')
                // Save info about the created order for the success page
                sessionStorage.setItem('deliveryOrderInfo', JSON.stringify({
                    pedidoId: data.data.id,
                    tipoPedido,
                    total: total,
                    items: cart.items
                }))
                navigate(`/${username}/success`)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Ocurrió un error al enviar el pedido')
        } finally {
            setLoading(false)
        }
    }

    if (!cart) return null

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 pb-10">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary" onClick={() => navigate(`/${username}`)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <span className="font-semibold">Checkout</span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>

            <div className="max-w-xl mx-auto px-5 pt-6 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Completa tus datos</h1>
                    <p className="text-muted-foreground text-sm">Para enviar tu pedido a preparar</p>
                </div>

                <section className="space-y-4">
                    <Label className="text-base">¿Cómo vas a recibir tu pedido?</Label>
                    <RadioGroup defaultValue="delivery" value={tipoPedido} onValueChange={(v: any) => setTipoPedido(v)} className="grid grid-cols-2 gap-4">
                        <div className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer hover:bg-secondary/50 transition-colors ${tipoPedido === 'delivery' ? 'border-orange-500 bg-orange-500/5' : 'border-border'}`} onClick={() => setTipoPedido('delivery')}>
                            <MapPin className={`w-8 h-8 mb-2 ${tipoPedido === 'delivery' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                            <Label className="cursor-pointer font-semibold mb-1">Delivery</Label>
                            <span className="text-xs text-muted-foreground text-center">Te lo llevamos</span>
                        </div>
                        <div className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer hover:bg-secondary/50 transition-colors ${tipoPedido === 'takeaway' ? 'border-orange-500 bg-orange-500/5' : 'border-border'}`} onClick={() => setTipoPedido('takeaway')}>
                            <Store className={`w-8 h-8 mb-2 ${tipoPedido === 'takeaway' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                            <Label className="cursor-pointer font-semibold mb-1">Take Away</Label>
                            <span className="text-xs text-muted-foreground text-center">Lo pasas a buscar</span>
                        </div>
                    </RadioGroup>
                </section>
                <section className="space-y-4">
                    {editMode ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Tu Nombre</Label>
                                <Input id="nombre" placeholder="Ej: Juan Perez" className="h-12 rounded-xl" value={nombre} onChange={e => setNombre(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="telefono">Celular (WhatsApp)</Label>
                                <Input id="telefono" type="tel" placeholder="Ej: +54 9 11 1234-5678" className="h-12 rounded-xl" value={telefono} onChange={e => setTelefono(e.target.value)} />
                            </div>

                            {tipoPedido === 'delivery' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="direccion">Dirección completa</Label>
                                    <Input id="direccion" placeholder="Calle, número, piso, depto..." className="h-12 rounded-xl" value={direccion} onChange={e => setDireccion(e.target.value)} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-secondary/20 p-5 rounded-2xl border border-border/50 space-y-3 relative group">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditMode(true)}
                                className="absolute top-4 right-4 text-xs h-8"
                            >
                                Editar
                            </Button>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Nombre</p>
                                <p className="font-semibold text-foreground">{nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Celular</p>
                                <p className="font-semibold text-foreground">{telefono}</p>
                            </div>
                            {tipoPedido === 'delivery' && (
                                <div className="animate-in fade-in slide-in-from-top-2 pt-2 border-t border-border/50">
                                    <p className="text-sm text-muted-foreground mb-1">Dirección de entrega</p>
                                    <p className="font-semibold text-foreground">{direccion || <span className="text-destructive font-medium text-xs">Falta dirección. Presiona Editar.</span>}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2 pt-4 border-t border-border/50">
                        <Label htmlFor="notas">Notas adicionales <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                        <Textarea id="notas" placeholder="Ej: El timbre no anda, llamar al llegar..." className="min-h-[100px] rounded-xl resize-none" value={notas} onChange={(e: any) => setNotas(e.target.value)} />
                    </div>
                </section>

                <section className="bg-secondary/30 rounded-2xl p-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">Subtotal ({cart.items?.length} items)</span>
                        <span className="font-medium">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg mt-4 pt-4 border-t border-border">
                        <span>Total a enviar</span>
                        <span className="text-orange-600 dark:text-orange-400">${total.toFixed(2)}</span>
                    </div>
                </section>

                <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                    onClick={handleConfirm}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Datos y Pedir'}
                </Button>
            </div >
        </div >
    )
}

export default CheckoutDelivery
