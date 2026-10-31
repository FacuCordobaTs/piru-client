import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import MenuDelivery from './MenuDelivery'
import type { CampanaPublica } from '@/features/tienda/delivery/modelo'
import { contextoParaResolverMarketing, guardarContextoTracking, limpiarContextoTracking } from '@/lib/tracking'
import { rutaTienda, usernameSitio } from '@/store-sites/actual'

type Destino = { tipo: 'tienda' } | { tipo: 'producto'; productoId: number } | { tipo: 'carrito'; carritoRep: string }
type Respuesta = { data?: { encontrada?: boolean; destino?: Destino; contexto?: { campaniaSlug?: string; campanaId?: number }; beneficio?: { codigoDescuentoId?: number; codigo?: string; puntos?: { cantidad: number; montoMinimo: number } }; campana?: CampanaPublica } }
const API_URL = (import.meta.env.VITE_API_URL || 'https://api.piru.app/api').replace(/\/$/, '')

function urlDestino(username: string, destino?: Destino) {
  const base = rutaTienda(username)
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
  const { username: usernameRuta, slug } = useParams()
  const username = usernameRuta ?? usernameSitio
  const [resuelta, setResuelta] = useState(false)
  const [campana, setCampana] = useState<CampanaPublica | null>(null)

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
        guardarContextoTracking({
          username,
          campaniaSlug: respuesta.data.contexto.campaniaSlug,
          campanaId: respuesta.data.contexto.campanaId,
          codigoPromocional: respuesta.data.beneficio?.codigo,
        })
        const campanaBase = respuesta.data.campana
        const destino = respuesta.data.destino
        const campanaPublica: CampanaPublica = {
          campanaId: campanaBase?.campanaId ?? respuesta.data.contexto.campanaId ?? 0,
          nombre: campanaBase?.nombre ?? '',
          slug: campanaBase?.slug ?? respuesta.data.contexto.campaniaSlug,
          tipo: campanaBase?.tipo,
          destinoTipo: destino?.tipo ?? campanaBase?.destinoTipo,
          productoId: destino?.tipo === 'producto' ? destino.productoId : (campanaBase?.productoId ?? null),
          carritoRep: destino?.tipo === 'carrito' ? destino.carritoRep : (campanaBase?.carritoRep ?? null),
          descuentoPorcentaje: campanaBase?.descuentoPorcentaje ?? 0,
          beneficioTipo: campanaBase?.beneficioTipo,
          puntosBeneficio: campanaBase?.puntosBeneficio ?? 0,
          puntosMontoMinimo: campanaBase?.puntosMontoMinimo ?? 0,
          limiteUsos: campanaBase?.limiteUsos ?? null,
          usosActuales: campanaBase?.usosActuales ?? 0,
          usosRestantes: campanaBase?.usosRestantes ?? null,
          fechaInicio: campanaBase?.fechaInicio ?? null,
          fechaFin: campanaBase?.fechaFin ?? null,
        }
        setCampana(campanaPublica)
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
  const { username: usernameRuta, token } = useParams()
  const username = usernameRuta ?? usernameSitio
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
