import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import MenuDelivery, { type CampanaProductoPublica } from './MenuDelivery'
import { contextoParaResolverMarketing, guardarContextoTracking, limpiarContextoTracking } from '@/lib/tracking'

type Destino = { tipo: 'tienda' } | { tipo: 'producto'; productoId: number } | { tipo: 'carrito'; carritoRep: string }
type Respuesta = { data?: { encontrada?: boolean; destino?: Destino; contexto?: { campaniaSlug?: string }; beneficio?: { codigoDescuentoId: number; codigo: string }; campana?: CampanaProductoPublica } }
const API_URL = (import.meta.env.VITE_API_URL || 'https://api.piru.app/api').replace(/\/$/, '')

function urlDestino(username: string, destino?: Destino) {
  const base = `/${encodeURIComponent(username)}`
  if (destino?.tipo === 'producto') return `${base}?producto=${destino.productoId}`
  return destino?.tipo === 'carrito' ? `${base}?rep=${encodeURIComponent(destino.carritoRep)}` : base
}

async function resolverLink(username: string, endpoint: 'campanas' | 'recetas', identificador: string, signal: AbortSignal): Promise<Respuesta | null> {
  try {
    const response = await fetch(`${API_URL}/public/marketing/${endpoint}/${encodeURIComponent(username)}/${encodeURIComponent(identificador)}?${new URLSearchParams(contextoParaResolverMarketing(username))}`, { signal })
    return response.ok ? await response.json() : null
  } catch {
    return null
  }
}

/** La campaña es una landing real: MenuDelivery se monta en /c/:slug y la URL
 * no se reemplaza. Esto conserva el contexto durante toda la compra en sheet. */
export function CampanaLinkResolver() {
  const { username, slug } = useParams()
  const [resuelta, setResuelta] = useState(false)
  const [campana, setCampana] = useState<CampanaProductoPublica | null>(null)

  useEffect(() => {
    if (!username || !slug) { setResuelta(true); return }
    setResuelta(false)
    setCampana(null)
    const abortador = new AbortController()
    let activo = true
    const timeout = window.setTimeout(() => abortador.abort(), 4_000)
    void resolverLink(username, 'campanas', slug, abortador.signal).then((respuesta) => {
      if (!activo) return
      window.clearTimeout(timeout)
      if (respuesta?.data?.encontrada && respuesta.data.contexto?.campaniaSlug) {
        guardarContextoTracking({ username, campaniaSlug: respuesta.data.contexto.campaniaSlug })
        setCampana(respuesta.data.campana ?? null)
      } else limpiarContextoTracking(username)
      setResuelta(true)
    })
    return () => { activo = false; window.clearTimeout(timeout); abortador.abort() }
  }, [slug, username])

  if (!resuelta) return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Cargando promoción…</div>
  return <MenuDelivery campana={campana} />
}

function RecetaResolver() {
  const navigate = useNavigate()
  const { username, token } = useParams()
  useEffect(() => {
    if (!username || !token) return
    const abortador = new AbortController()
    let activo = true
    const timeout = window.setTimeout(() => abortador.abort(), 4_000)
    void resolverLink(username, 'recetas', token, abortador.signal).then((respuesta) => {
      if (!activo) return
      window.clearTimeout(timeout)
      const codigoPromocional = respuesta?.data?.beneficio?.codigo
      if (respuesta?.data?.encontrada) guardarContextoTracking({ username, recetaToken: token, codigoPromocional })
      navigate(urlDestino(username, respuesta?.data?.destino), { replace: true })
    })
    return () => { activo = false; window.clearTimeout(timeout); abortador.abort() }
  }, [navigate, token, username])
  return null
}

export const RecetaLinkResolver = () => <RecetaResolver />
