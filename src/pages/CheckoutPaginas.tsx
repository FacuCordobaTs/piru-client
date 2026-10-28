import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import type { TiendaPublicaRespuesta } from '@/features/tienda/datos'
import { guardarVueltaSitio, hidratarCarrito, type CarritoPublico } from '@/features/tienda/carritoPaginas'
import { guardarContextoTracking } from '@/lib/tracking'

const API_URL = (import.meta.env.VITE_API_URL || 'https://api.piru.app/api').replace(/\/$/, '')

/**
 * `my.piru.app/<username>/checkout?carrito=<id>`: la entrada al checkout desde un sitio de Páginas
 * (docs/PAGINAS_PROPIAS.md, §9). Trae el carrito del servidor, lo arma con el catálogo actual y abre
 * el checkout de la tienda estándar (`?pedir=1`), que pide los datos, cobra y crea el pedido como
 * siempre. Los datos del comprador nunca vuelven al sitio: quedan en este origen.
 */
export default function CheckoutPaginas() {
    const { username } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const id = searchParams.get('carrito')

    useEffect(() => {
        if (!username) return
        if (!id) {
            navigate(`/${username}`, { replace: true })
            return
        }
        const controlador = new AbortController()
        const preparar = async () => {
            const res = await fetch(`${API_URL}/public/carritos/${encodeURIComponent(id)}`, { signal: controlador.signal })
            if (!res.ok) throw new Error('El pedido venció. Volvé a armarlo en la tienda.')
            const carrito = (await res.json()) as CarritoPublico
            if (carrito.username?.toLowerCase() !== username.toLowerCase())
                throw new Error('Este pedido es de otra tienda.')
            const tiendaRes = await fetch(`${API_URL}/public/restaurante/${encodeURIComponent(username)}`, { signal: controlador.signal })
            if (!tiendaRes.ok) throw new Error('No pudimos cargar la tienda.')
            const tienda = (await tiendaRes.json()) as TiendaPublicaRespuesta
            if (tienda.data.restaurante.id !== carrito.restauranteId) throw new Error('Este pedido es de otra tienda.')
            const { items } = hidratarCarrito(carrito.items, tienda.data.productos)
            if (!items.length) throw new Error('Los productos de tu pedido ya no están disponibles.')
            localStorage.setItem(
                `deliveryCart_${username}`,
                JSON.stringify({ items, restauranteId: carrito.restauranteId, deliveryFee: tienda.data.restaurante.deliveryFee })
            )
            const c = carrito.contexto
            if (c?.campaniaSlug || c?.recetaToken || c?.codigoPromocional)
                guardarContextoTracking({
                    username,
                    campaniaSlug: c.campaniaSlug,
                    campanaId: c.campanaId ? Number(c.campanaId) : undefined,
                    recetaToken: c.recetaToken,
                    codigoPromocional: c.codigoPromocional,
                })
            guardarVueltaSitio(username, carrito.returnUrl)
            navigate(`/${username}?pedir=1`, { replace: true })
        }
        preparar().catch((e: unknown) => {
            if (!controlador.signal.aborted) setError(e instanceof Error ? e.message : 'No pudimos abrir tu pedido.')
        })
        return () => controlador.abort()
    }, [id, username, navigate])

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
                    Preparando tu pedido…
                </p>
            )}
        </main>
    )
}
