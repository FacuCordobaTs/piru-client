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
    const [mpConnected, setMpConnected] = useState<boolean>(false)
    const [transferenciaAlias, setTransferenciaAlias] = useState<string | null>(null)
    const [restauranteData, setRestauranteData] = useState<any>(null)
    const [isLoadingAlias, setIsLoadingAlias] = useState(true)
    const [isCreatingMP, setIsCreatingMP] = useState(false)

    // Cargar info del pedido
    useEffect(() => {
        const savedInfo = sessionStorage.getItem('deliveryOrderInfo')
        if (savedInfo) {
            setOrderInfo(JSON.parse(savedInfo))
        } else {
            navigate(`/${username}`)
        }
    }, [username, navigate])

    // Cargar config
    useEffect(() => {
        const fetchRestaurante = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const response = await fetch(`${url}/public/restaurante/${username}`)
                const data = await response.json()
                if (data.success && data.data.restaurante) {
                    setCucuruAlias(data.data.restaurante.cucuruAlias)
                    setMpConnected(data.data.restaurante.mpConnected)
                    setTransferenciaAlias(data.data.restaurante.transferenciaAlias)
                    setRestauranteData(data.data.restaurante)

                    const savedInfo = JSON.parse(sessionStorage.getItem('deliveryOrderInfo') || '{}');
                    if (!data.data.restaurante.cucuruAlias && !data.data.restaurante.mpConnected && savedInfo.metodoPago) {
                        setStatus('confirmed')
                    }
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

    const handleCopyAlias = async (aliasToCopy: string) => {
        try {
            await navigator.clipboard.writeText(aliasToCopy)
            toast.success('Alias copiado', { description: aliasToCopy })
        } catch (err) {
            toast.error('No se pudo copiar el alias')
        }
    }

    const handleCrearMP = async () => {
        setIsCreatingMP(true)
        try {
            const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
            const response = await fetch(`${url}/mp/crear-preferencia-externo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pedidoId: orderInfo.pedidoId,
                    tipoPedido: orderInfo.tipoPedido
                })
            })
            const data = await response.json()
            if (data.success && data.url_pago) {
                window.location.href = data.url_pago
            } else {
                toast.error('Error', { description: 'No se pudo generar el pago con MercadoPago' })
            }
        } catch (err) {
            toast.error('Error conectando con MP')
            console.error(err)
        } finally {
            setIsCreatingMP(false)
        }
    }

    const setMetodoPago = async (metodo: string) => {
        try {
            const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
            const endpoint = orderInfo.tipoPedido === 'delivery'
                ? `/public/delivery/${orderInfo.pedidoId}/metodo-pago`
                : `/public/takeaway/${orderInfo.pedidoId}/metodo-pago`

            await fetch(`${url}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metodoPago: metodo })
            })
            setStatus('confirmed')
            toast.success('Método de pago registrado')
        } catch (error) {
            console.error('Error setting method', error)
        }
    }

    const { items, tipoPedido, total, pedidoId } = orderInfo

    const cachedThemeStr = sessionStorage.getItem(`theme_${username}`)
    const cachedTheme = cachedThemeStr ? JSON.parse(cachedThemeStr) : null

    const primario = restauranteData?.colorPrimario || cachedTheme?.primario
    const secundario = restauranteData?.colorSecundario || cachedTheme?.secundario

    const themeStyles = (primario && secundario) ? (
        <style dangerouslySetInnerHTML={{
            __html: `
            :root {
                --background: ${secundario};
                --foreground: ${primario};
                --card: ${secundario};
                --card-foreground: ${primario};
                --popover: ${secundario};
                --popover-foreground: ${primario};
                --primary: ${primario};
                --primary-foreground: ${secundario};
                --secondary: ${primario}18;
                --secondary-foreground: ${primario};
                --muted: ${primario}15;
                --muted-foreground: ${primario}99;
                --border: ${primario}30;
                --input: ${primario}30;
            }

            .dark {
                --background: ${primario};
                --foreground: ${secundario};
                --card: ${primario};
                --card-foreground: ${secundario};
                --popover: ${primario};
                --popover-foreground: ${secundario};
                --primary: ${secundario};
                --primary-foreground: ${primario};
                --secondary: ${secundario}18;
                --secondary-foreground: ${secundario};
                --muted: ${secundario}15;
                --muted-foreground: ${secundario}b3;
                --border: ${secundario}30;
                --input: ${secundario}30;
            }
        `}} />
    ) : null;

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 pb-10 flex flex-col items-center">
            {themeStyles}
            <div className="w-full fixed top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
                    <span className="font-semibold text-lg bg-linear-to-r from-primary to-primary bg-clip-text text-transparent opacity-80">Piru</span>
                    <ThemeToggle />
                </div>
            </div>

            <div className="max-w-xl w-full mx-auto px-5 pt-20 space-y-8 flex-1 flex flex-col justify-center">

                {status === 'pending_payment' && (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 border-background shadow-lg">
                            <Utensils className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black tracking-tight">¡Casi listo!</h1>
                            <p className="text-muted-foreground">Tu pedido #{pedidoId} fue creado.</p>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm mx-auto max-w-sm w-full space-y-4">
                            <p className="font-medium text-primary/80">Total a transferir</p>
                            <p className="text-4xl font-black">${total?.toFixed(2)}</p>

                            <div className="pt-2">
                                {isLoadingAlias ? (
                                    <Button className="w-full h-14" disabled>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    </Button>
                                ) : cucuruAlias ? (
                                    <>
                                        <Button
                                            className="w-full h-14 text-lg font-bold rounded-xl shadow-md gap-3 bg-purple-600 hover:bg-purple-700 text-white"
                                            onClick={() => {
                                                handleCopyAlias(cucuruAlias)
                                                setStatus('verifying')
                                            }}
                                        >
                                            <Copy className="w-5 h-5" />
                                            Copiar Alias: {cucuruAlias}
                                        </Button>
                                        <p className="text-xs text-center text-muted-foreground mt-3 font-medium">
                                            Haz clic para copiar y transferir desde tu app bancaria
                                        </p>
                                    </>
                                ) : mpConnected ? (
                                    <>
                                        <Button
                                            className="w-full h-14 text-lg font-bold rounded-xl shadow-md gap-3 bg-[#009EE3] hover:bg-[#008DD0] text-white"
                                            onClick={handleCrearMP}
                                            disabled={isCreatingMP}
                                        >
                                            {isCreatingMP ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pagar con MercadoPago'}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <Button
                                            className="w-full h-14 text-lg font-bold rounded-xl shadow-md gap-3 bg-slate-900 border-2 border-slate-900 text-white hover:bg-slate-800"
                                            onClick={() => setMetodoPago('efectivo')}
                                        >
                                            Pagar en Efectivo
                                        </Button>

                                        {transferenciaAlias && (
                                            <Button
                                                variant="outline"
                                                className="w-full h-14 text-lg font-bold rounded-xl border-2 border-slate-200"
                                                onClick={() => {
                                                    handleCopyAlias(transferenciaAlias)
                                                    setMetodoPago('transferencia')
                                                }}
                                            >
                                                <Copy className="w-5 h-5 mr-2" />
                                                Transferir a {transferenciaAlias}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {status === 'verifying' && (
                    <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <Loader2 className="w-16 h-16 text-primary animate-spin absolute" />
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
                            {orderInfo.metodoPago === 'transferencia' && transferenciaAlias && (
                                <div className="p-4 border-2 border-primary/20 rounded-2xl bg-primary/5 mb-4">
                                    <p className="text-sm font-bold text-primary/80 mb-2">Por favor, transferí el total a este alias:</p>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 text-base font-bold rounded-xl border-primary/20 hover:bg-primary/10"
                                        onClick={() => handleCopyAlias(transferenciaAlias)}
                                    >
                                        <Copy className="w-5 h-5 mr-2 text-primary" />
                                        {transferenciaAlias}
                                    </Button>
                                    <p className="text-xs mt-3 text-center text-muted-foreground">Tu pedido comenzará a prepararse una vez recibido el pago.</p>
                                </div>
                            )}

                            {orderInfo.metodoPago === 'efectivo' && (
                                <div className="p-4 border-2 border-emerald-200 dark:border-emerald-900/50 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 mb-4 text-center">
                                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">Pago en Efectivo</p>
                                    <p className="text-xs mt-1 text-muted-foreground">Aboná el importe exacto al recibir tu pedido.</p>
                                </div>
                            )}

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
                                                <span className="font-semibold text-primary/90 min-w-4">{item.cantidad}x</span>
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
