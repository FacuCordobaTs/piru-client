import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { contextoParaResolverMarketing, guardarContextoTracking } from '@/lib/tracking'

type Destino = { tipo: 'tienda' } | { tipo: 'producto'; productoId: number } | { tipo: 'carrito'; carritoRep: string }
type Respuesta = { data?: { encontrada?: boolean; destino?: Destino; contexto?: { campaniaSlug?: string }; beneficio?: { codigoDescuentoId: number; codigo: string } } }
const API_URL = (import.meta.env.VITE_API_URL || 'https://api.piru.app/api').replace(/\/$/, '')

function urlDestino(username: string, destino?: Destino) {
  const base = `/${encodeURIComponent(username)}`
  if (destino?.tipo === 'producto') return `${base}?producto=${destino.productoId}`
  return destino?.tipo === 'carrito' ? `${base}?rep=${encodeURIComponent(destino.carritoRep)}` : base
}

function Resolver({ tipo }: { tipo: 'campana' | 'receta' }) {
  const navigate = useNavigate(); const { username, slug, token } = useParams()
  useEffect(() => {
    if (!username || (tipo === 'campana' && !slug) || (tipo === 'receta' && !token)) return
    const abortador = new AbortController()
    const ejecutar = async () => {
      const identificador = tipo === 'campana' ? slug! : token!
      const endpoint = tipo === 'campana' ? 'campanas' : 'recetas'
      let respuesta: Respuesta | null = null
      try {
        const timeout = window.setTimeout(() => abortador.abort(), 4_000)
        const response = await fetch(`${API_URL}/public/marketing/${endpoint}/${encodeURIComponent(username)}/${encodeURIComponent(identificador)}?${new URLSearchParams(contextoParaResolverMarketing(username))}`, { signal: abortador.signal })
        window.clearTimeout(timeout)
        if (response.ok) respuesta = await response.json()
      } catch { /* fallback de tienda si el resolver o tracking no está disponible */ }
      const codigoPromocional = respuesta?.data?.beneficio?.codigo
      if (tipo === 'campana' && respuesta?.data?.encontrada && respuesta.data.contexto?.campaniaSlug) guardarContextoTracking({ username, campaniaSlug: respuesta.data.contexto.campaniaSlug, codigoPromocional })
      if (tipo === 'receta' && respuesta?.data?.encontrada) guardarContextoTracking({ username, recetaToken: token!, codigoPromocional })
      navigate(urlDestino(username, respuesta?.data?.destino), { replace: true })
    }
    void ejecutar(); return () => abortador.abort()
  }, [navigate, slug, token, tipo, username])
  return null
}
export const CampanaLinkResolver = () => <Resolver tipo="campana" />
export const RecetaLinkResolver = () => <Resolver tipo="receta" />
