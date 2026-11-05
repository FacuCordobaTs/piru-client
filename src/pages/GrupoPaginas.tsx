import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Link2, Loader2, ShoppingBag, Users } from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'https://api.piru.app/api').replace(/\/$/, '')

type Local = {
    id: number
    nombre: string
    imagenUrl?: string | null
    imagenLightUrl?: string | null
    colorPrimario?: string | null
    pausadoPorSuscripcion?: boolean
}

const PASOS = [
    { Icono: Link2, texto: 'Creás el pedido y compartís el link' },
    { Icono: Users, texto: 'Cada uno elige lo suyo desde su celular' },
    { Icono: ShoppingBag, texto: 'Llega todo junto, en un solo pedido' },
]

const telefonoGuardado = () => localStorage.getItem('cliente_telefono') || localStorage.getItem('piru_cliente_telefono') || ''

/**
 * `my.piru.app/<username>/grupo`: el pedido en grupo que abre una página de Páginas
 * (`usePedidoGrupal().abrir()`, sección "Pedir entre varios"). Crea la sala como el botón
 * "Pedir entre varios" de la tienda estándar (`useCrearSala`) y sigue en `/sala/<token>/nombre`.
 * Los datos quedan en este origen, igual que en el checkout de plataforma: no vuelven al sitio.
 */
export default function GrupoPaginas() {
    const { username } = useParams()
    const navigate = useNavigate()
    const [local, setLocal] = useState<Local | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [nombre, setNombre] = useState(() => localStorage.getItem('cliente_nombre') ?? '')
    const [telefono, setTelefono] = useState(telefonoGuardado)
    const [creando, setCreando] = useState(false)
    const automatico = useRef(false)

    useEffect(() => {
        if (!username) return
        const controlador = new AbortController()
        fetch(`${API_URL}/public/restaurante/${encodeURIComponent(username)}`, { signal: controlador.signal })
            .then(async (res) => {
                if (!res.ok) throw new Error('No encontramos esta tienda.')
                const cuerpo = (await res.json()) as { data?: { restaurante?: Local } }
                if (!cuerpo.data?.restaurante) throw new Error('No encontramos esta tienda.')
                setLocal(cuerpo.data.restaurante)
            })
            .catch((e: unknown) => {
                if (!controlador.signal.aborted) setError(e instanceof Error ? e.message : 'No pudimos cargar la tienda.')
            })
        return () => controlador.abort()
    }, [username])

    const crear = async (nombreSala: string, telefonoSala: string) => {
        if (!local || creando) return
        setCreando(true)
        setError(null)
        try {
            const res = await fetch(`${API_URL}/public/sala/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restauranteId: local.id, nombreCliente: nombreSala.trim(), telefono: telefonoSala.trim() || undefined }),
            })
            const datos = (await res.json().catch(() => null)) as { success?: boolean; data?: { token?: string } } | null
            if (!datos?.success || !datos.data?.token) throw new Error('No pudimos crear el pedido en grupo. Probá de nuevo.')
            localStorage.setItem('cliente_nombre', nombreSala.trim())
            if (telefonoSala.trim()) localStorage.setItem('cliente_telefono', telefonoSala.trim())
            navigate(`/sala/${datos.data.token}/nombre`, { replace: true })
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No pudimos crear el pedido en grupo.')
            setCreando(false)
        }
    }

    // Como en la tienda estándar: con nombre y WhatsApp ya guardados, el link se crea directo.
    useEffect(() => {
        if (!local || automatico.current || local.pausadoPorSuscripcion) return
        automatico.current = true
        const guardadoNombre = localStorage.getItem('cliente_nombre')
        const guardadoTelefono = telefonoGuardado()
        if (guardadoNombre?.trim() && guardadoTelefono.replace(/\D/g, '').length >= 8) void crear(guardadoNombre, guardadoTelefono)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local])

    const enviar = (e: FormEvent) => {
        e.preventDefault()
        if (!nombre.trim()) return setError('Escribí tu nombre.')
        if (telefono.replace(/\D/g, '').length < 8) return setError('Ingresá un número de WhatsApp válido (mínimo 8 dígitos).')
        void crear(nombre, telefono)
    }

    const color = local?.colorPrimario && /^#[0-9a-f]{3,8}$/i.test(local.colorPrimario) ? local.colorPrimario : '#191512'
    const logo = local?.imagenLightUrl ?? local?.imagenUrl ?? null

    if (!local)
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
                {error ? (
                    <>
                        <p className="text-lg font-semibold">{error}</p>
                        <a className="text-sm font-semibold underline underline-offset-4" href={`/${username ?? ''}`}>
                            Ir a la tienda
                        </a>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground" role="status">
                        Cargando…
                    </p>
                )}
            </main>
        )

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    {logo ? (
                        <img src={logo} alt={local.nombre} className="size-16 rounded-2xl object-contain" />
                    ) : (
                        <span className="grid size-16 place-items-center rounded-2xl text-white" style={{ background: color }}>
                            <Users className="size-7" />
                        </span>
                    )}
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{local.nombre}</p>
                    <h1 className="text-balance text-3xl font-extrabold tracking-tight">Pedí entre varios</h1>
                </div>

                <ol className="space-y-2">
                    {PASOS.map(({ Icono, texto }) => (
                        <li key={texto} className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm font-semibold">
                            <Icono className="size-4 shrink-0" style={{ color }} />
                            {texto}
                        </li>
                    ))}
                </ol>

                {local.pausadoPorSuscripcion ? (
                    <p className="rounded-xl border px-4 py-3 text-center text-sm text-muted-foreground">
                        La tienda no está tomando pedidos en este momento.
                    </p>
                ) : (
                    <form onSubmit={enviar} className="space-y-3">
                        <label className="block space-y-1.5">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Tu nombre</span>
                            <input
                                className="h-12 w-full rounded-xl border bg-background px-4 text-base"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                autoComplete="given-name"
                                maxLength={60}
                                required
                            />
                        </label>
                        <label className="block space-y-1.5">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Tu WhatsApp</span>
                            <input
                                className="h-12 w-full rounded-xl border bg-background px-4 text-base"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="11 2345 6789"
                                maxLength={30}
                                required
                            />
                        </label>
                        {error && (
                            <p role="alert" className="text-sm font-medium text-red-600">
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={creando}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white disabled:opacity-60"
                            style={{ background: color }}
                        >
                            {creando ? <Loader2 className="size-5 animate-spin" /> : <Users className="size-5" />}
                            {creando ? 'Creando el link…' : 'Crear el pedido en grupo'}
                        </button>
                    </form>
                )}
                <p className="text-center text-xs text-muted-foreground">
                    Tus datos sólo se usan para este pedido. <a className="underline" href={`/${username ?? ''}`}>Ver la tienda</a>
                </p>
            </div>
        </main>
    )
}
