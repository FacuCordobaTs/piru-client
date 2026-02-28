import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Copy, Loader2, Store, Truck, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'

const SuccessDelivery = () => {
    const { username } = useParams()
    const navigate = useNavigate()
    const [orderInfo, setOrderInfo] = useState<any>(null)
    const [status, setStatus] = useState<'pending_payment' | 'verifying' | 'confirmed'>('pending_payment')

    const [cucuruAlias, setCucuruAlias] = useState<string | null>(null)
    const [isLoadingAlias, setIsLoadingAlias] = useState(true)

    // Cargar info del pedido
    useEffect(() => {
        const savedInfo = sessionStorage.getItem('deliveryOrderInfo')
        if (savedInfo) {
            setOrderInfo(JSON.parse(savedInfo))
        } else {
            navigate(`/${username}`)
        }
    }, [username, navigate])

    // Cargar alias
    useEffect(() => {
        const fetchRestaurante = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const response = await fetch(`${url}/public/restaurante/${username}`)
                const data = await response.json()
                if (data.success && data.data.restaurante.cucuruAlias) {
                    setCucuruAlias(data.data.restaurante.cucuruAlias)
                }
            } catch (err) {
                console.error('Error fetching restaurante data', err)
            } finally {
                setIsLoadingAlias(false)
            }
        }
        if (username) {
            fetchRestaurante()
        }
    }, [username])

    // WebSocket Connection
    useEffect(() => {
        if (!orderInfo) return

        let ws: WebSocket
        let isConnecting = false

        const connectWebSocket = () => {
            if (isConnecting) return
            isConnecting = true

            // Ajustamos la lógica de wsURL para Vite/dev server si env VITE_WS_URL no existe
            const wsBase = import.meta.env.VITE_WS_URL
                ? import.meta.env.VITE_WS_URL
                : import.meta.env.VITE_API_URL
                    ? import.meta.env.VITE_API_URL.replace('http', 'ws').replace('/api', '')
                    : 'ws://localhost:3000'

            ws = new WebSocket(`${wsBase}/ws/public/${orderInfo.tipoPedido}/${orderInfo.pedidoId}`)

            ws.onopen = () => {
                isConnecting = false
                console.log('Conectado al seguimiento de pago')
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type === 'PAGO_ACREDITADO') {
                        setStatus('confirmed')
                        toast.success('¡Transferencia recibida!', {
                            icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
                        })
                    }
                } catch (e) {
                    console.error('Error parsing WS message', e)
                }
            }

            ws.onclose = () => {
                isConnecting = false
                // Intentar reconectar si el pago no se ha confirmado
                setTimeout(() => {
                    if (status !== 'confirmed') connectWebSocket()
                }, 3000)
            }
        }

        connectWebSocket()

        return () => {
            if (ws) ws.close()
        }
    }, [orderInfo, status])

    if (!orderInfo) return null

    const handleCopyAlias = async () => {
        try {
            if (cucuruAlias) {
                await navigator.clipboard.writeText(cucuruAlias)
                toast.success('Alias copiado', { description: cucuruAlias })
                setStatus('verifying')
            }
        } catch (err) {
            toast.error('No se pudo copiar el alias')
        }
    }

    const { items, tipoPedido, total, pedidoId } = orderInfo

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 pb-10 flex flex-col items-center">
            <div className="w-full fixed top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
                    <span className="font-semibold text-lg bg-linear-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">Piru</span>
                    <ThemeToggle />
                </div>
            </div>

            <div className="max-w-xl w-full mx-auto px-5 pt-20 space-y-8 flex-1 flex flex-col justify-center">

                {status === 'pending_payment' && (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 border-background shadow-lg">
                            <Utensils className="w-10 h-10 text-orange-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black tracking-tight">¡Casi listo!</h1>
                            <p className="text-muted-foreground">Tu pedido #{pedidoId} fue creado.</p>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-6 shadow-sm mx-auto max-w-sm w-full space-y-4">
                            <p className="font-medium text-orange-800 dark:text-orange-300">Total a transferir</p>
                            <p className="text-4xl font-black">${total?.toFixed(2)}</p>

                            <div className="pt-2">
                                <Button
                                    className="w-full h-14 text-lg font-bold rounded-xl shadow-md gap-3 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                                    onClick={handleCopyAlias}
                                    disabled={isLoadingAlias || !cucuruAlias}
                                >
                                    {isLoadingAlias ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Copy className="w-5 h-5" />
                                            {cucuruAlias ? `Copiar Alias: ${cucuruAlias}` : 'Cargando Alias...'}
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-3 font-medium">
                                    Haz clic para copiar y transferir desde tu app bancaria
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'verifying' && (
                    <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <Loader2 className="w-16 h-16 text-orange-500 animate-spin absolute" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Aguardando transferencia...</h2>
                            <p className="text-muted-foreground animate-pulse">Por favor, realiza el pago y no cierres esta pantalla</p>
                        </div>
                    </div>
                )}

                {status === 'confirmed' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-md mx-auto">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 ring-8 ring-green-50 dark:ring-green-900/10">
                                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-green-600 dark:text-green-500">¡Pedido Confirmado!</h1>
                            <p className="text-lg font-medium text-muted-foreground">
                                Ya estamos recibiendo tu pedido en cocina
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm shadow-black/5 space-y-6 relative overflow-hidden">
                            {/* Receipt jagged edge effect */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAyMCAyIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBmaWxsPSJjdXJyZW50Q29sb3IiPjxwb2x5Z29uIHBvaW50cz0iMCAwLCAyMCAwLCAxMCAyIg==')] opacity-10" />

                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50">
                                <div className="p-3 bg-background rounded-full shadow-sm text-primary shrink-0">
                                    {tipoPedido === 'delivery' ? <Truck className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-base leading-none">
                                        {tipoPedido === 'delivery' ? 'Delivery en camino' : 'Retiro en local'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-snug">
                                        {tipoPedido === 'delivery'
                                            ? 'Ya se lo traerán a tu dirección indicada.'
                                            : 'Estará listo en aproximadamente 15 a 20 minutos para que lo retires.'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Resumen del pedido</h4>
                                <div className="flex flex-col gap-3">
                                    {items?.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-start gap-2 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-orange-600 dark:text-orange-400 min-w-4">{item.cantidad}x</span>
                                                <div>
                                                    <p className="font-medium text-sm leading-tight">{item.nombreProducto || item.nombre}</p>
                                                    {item.ingredientesExcluidosNombres?.length > 0 && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Sin: {item.ingredientesExcluidosNombres.join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl font-semibold"
                            onClick={() => {
                                sessionStorage.removeItem('deliveryOrderInfo')
                                navigate(`/${username}`)
                            }}
                        >
                            Volver al inicio
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SuccessDelivery
