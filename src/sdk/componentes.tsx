/**
 * Lo que el runtime pone siempre alrededor de la página (docs/PAGINAS_PROPIAS.md, §6.4): datos,
 * carrito, campaña y tracking (`PiruSiteRoot`), la red de seguridad ante errores
 * (`PiruErrorBoundary`), el pie con la tienda estándar (`PiruFooter`), la hoja de opciones
 * (`PiruProductSheet`) y los avisos. El sitio no tiene que acordarse de ponerlos.
 */
import { Component, lazy, Suspense, useEffect, useId, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { guardarContextoTracking, obtenerVisitorId, obtenerSesionTracking, registrarEventoTrackingUnaVez } from '@/lib/tracking'
import { formatoPesos } from '@/lib/tienda'
import {
    aplicarDemo,
    aplicarEscenario,
    campanaDeEjemplo,
    claveLinea,
    normalizarTienda,
    validarItem,
    type ProductoBase,
    type RespuestaTienda,
} from './datos'
import { CSS_RUNTIME } from './estilos'
import { ContextoTienda, agregarItem, linksDe, useCarta, useTiendaInterna } from './hooks'
import type { Tienda } from './store'
import type { Campana, Escenario } from './tipos'

/** La demo (`?demo`) se descarga sólo cuando el HTML la pidió; si falla, el sitio sigue igual. */
const PiruDemo = lazy(() => import('@piru/demo').catch(() => ({ default: () => null })))

export type DatosPreview = { respuesta: RespuestaTienda | null; escenario: Escenario | null }

function contrasteTexto(hex: string | null): string {
    const m = hex?.match(/^#?([0-9a-f]{6})$/i)
    if (!m) return '#fff'
    const n = parseInt(m[1], 16)
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#141414' : '#fff'
}

/** Aplica el descuento de una campaña de producto, como la tienda estándar. */
function conCampana(respuesta: RespuestaTienda, campana: Campana | null): RespuestaTienda {
    if (!campana?.productoId || campana.descuentoPorcentaje <= 0) return respuesta
    return {
        ...respuesta,
        productos: respuesta.productos.map((p) =>
            p.id === campana.productoId
                ? { ...p, descuento: Math.max(Number(p.descuento) || 0, campana.descuentoPorcentaje) }
                : p
        ),
    }
}

async function resolverEnlace(tienda: Tienda, signal: AbortSignal) {
    const { config } = tienda.get()
    const ruta = window.location.pathname.match(/^\/(c|r)\/([^/]+)\/?$/)
    if (!ruta) return null
    const [, tipo, identificador] = ruta
    const params = new URLSearchParams({
        visitorId: obtenerVisitorId(),
        sesionUuid: obtenerSesionTracking(config.username).sesionUuid,
        eventoUuid: crypto.randomUUID(),
    })
    const endpoint = tipo === 'c' ? 'campanas' : 'recetas'
    try {
        const res = await fetch(
            `${config.api}/public/marketing/${endpoint}/${encodeURIComponent(config.username)}/${encodeURIComponent(decodeURIComponent(identificador))}?${params}`,
            { signal }
        )
        if (!res.ok) return null
        const cuerpo = (await res.json()) as {
            data?: {
                encontrada?: boolean
                destino?: { tipo: string; productoId?: number }
                contexto?: { campaniaSlug?: string; campanaId?: number }
                beneficio?: { codigo?: string }
                campana?: { nombre?: string; slug?: string; descuentoPorcentaje?: number; productoId?: number | null }
            }
        }
        const data = cuerpo.data
        if (!data?.encontrada) return null
        if (tipo === 'c' && data.contexto?.campaniaSlug) {
            guardarContextoTracking({
                username: config.username,
                campaniaSlug: data.contexto.campaniaSlug,
                campanaId: data.contexto.campanaId,
                codigoPromocional: data.beneficio?.codigo,
            })
            const campana: Campana = {
                slug: data.campana?.slug ?? data.contexto.campaniaSlug,
                nombre: data.campana?.nombre ?? '',
                descuentoPorcentaje: data.campana?.descuentoPorcentaje ?? 0,
                productoId: data.destino?.tipo === 'producto' ? (data.destino.productoId ?? null) : (data.campana?.productoId ?? null),
            }
            return { campana, abrir: campana.productoId }
        }
        guardarContextoTracking({ username: config.username, recetaToken: identificador, codigoPromocional: data.beneficio?.codigo })
        window.history.replaceState(null, '', '/')
        return { campana: null, abrir: data.destino?.tipo === 'producto' ? (data.destino.productoId ?? null) : null }
    } catch {
        return null
    }
}

/** Carga los datos (API o vista previa) y mantiene el estado del local al día. */
function useCargarDatos(tienda: Tienda, preview: DatosPreview | undefined) {
    const respuestaRef = useRef<RespuestaTienda | null>(null)

    // Vista previa: los datos llegan por props desde el editor, nunca por la red.
    useEffect(() => {
        if (!preview) return
        const { respuesta, escenario } = preview
        tienda.set({ sitio: { ...tienda.get().sitio, escenario } })
        if (escenario === 'cargando') return tienda.set({ estado: 'cargando', datos: null })
        if (escenario === 'error' || !respuesta) return tienda.set({ estado: 'error', datos: null })
        const conEscenario = aplicarEscenario(respuesta, escenario)
        const base = normalizarTienda(conEscenario)
        const campana = escenario === 'con-campana' ? campanaDeEjemplo(base.productos) : null
        const datos = campana ? normalizarTienda(conCampana(conEscenario, campana)) : base
        respuestaRef.current = conEscenario
        const lineas =
            escenario === 'carrito-con-items'
                ? datos.productos
                      .filter((p) => p.disponible)
                      .slice(0, 2)
                      .map((p) => lineaDeEjemplo(p))
                      .filter((l) => l !== null)
                : escenario === 'carrito-vacio'
                  ? []
                  : tienda.get().lineas
        tienda.set({ estado: 'listo', datos, campana, lineas })
    }, [tienda, preview])

    // Producción: la API pública de la tienda, por ID (un cambio de username no rompe el sitio).
    useEffect(() => {
        if (preview) return
        const controlador = new AbortController()
        const { config } = tienda.get()
        const demo = config.demo === true
        const cargar = async () => {
            const [respuesta, enlace] = await Promise.all([
                fetch(`${config.api}/public/restaurante/id/${config.restauranteId}`, { signal: controlador.signal })
                    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
                    .then((j: { data: RespuestaTienda }) => j.data),
                // En la demo no se registra tracking ni se resuelve una campaña: el link es el local.
                demo ? Promise.resolve(null) : resolverEnlace(tienda, controlador.signal),
            ])
            const campana = enlace?.campana ?? null
            const conDemo = demo ? aplicarDemo(respuesta) : respuesta
            respuestaRef.current = conCampana(conDemo, campana)
            tienda.set({ estado: 'listo', datos: normalizarTienda(respuestaRef.current, new Date(), demo), campana })
            if (enlace?.abrir) tienda.set({ hoja: enlace.abrir })
            if (!campana && !demo)
                registrarEventoTrackingUnaVez(config.restauranteId, config.username, 'session_start', 'storefront')
        }
        cargar().catch(() => {
            if (!controlador.signal.aborted) tienda.set({ estado: 'error' })
        })
        return () => controlador.abort()
    }, [tienda, preview])

    // El estado abierto/cerrado se recalcula cada minuto, como en la tienda estándar.
    useEffect(() => {
        const intervalo = window.setInterval(() => {
            if (respuestaRef.current && tienda.get().estado === 'listo')
                tienda.set({
                    datos: normalizarTienda(respuestaRef.current, new Date(), tienda.get().config.demo === true),
                })
        }, 60_000)
        return () => window.clearInterval(intervalo)
    }, [tienda])

    // Vuelta del checkout con `?ok=1`: el pedido ya se hizo, el carrito se limpia.
    useEffect(() => {
        if (preview) return
        const url = new URL(window.location.href)
        if (url.searchParams.get('ok') !== '1') return
        url.searchParams.delete('ok')
        window.history.replaceState(null, '', url.pathname + url.search + url.hash)
        tienda.set({ lineas: [] })
        tienda.avisar('¡Listo! Recibimos tu pedido.', 'ok')
    }, [tienda, preview])

    // Al volver con el botón "atrás" desde el checkout, el botón de pedir vuelve a estar activo.
    useEffect(() => {
        const alMostrar = (e: PageTransitionEvent) => e.persisted && tienda.set({ submitting: false })
        window.addEventListener('pageshow', alMostrar)
        return () => window.removeEventListener('pageshow', alMostrar)
    }, [tienda])
}

function lineaDeEjemplo(p: ProductoBase) {
    const item = {
        productoId: p.id,
        varianteId: p.variantes[0]?.id,
        varianteSecundariaId: p.variantesSecundarias[0]?.id,
    }
    const v = validarItem(p, item)
    return v.ok ? { ...v.linea, key: claveLinea(v.linea), cantidad: 1 } : null
}

export class PiruErrorBoundary extends Component<{ children: ReactNode; tiendaEstandar: string; onError?: (e: Error) => void }, { error: boolean }> {
    state = { error: false }
    static getDerivedStateFromError() {
        return { error: true }
    }
    componentDidCatch(error: Error) {
        this.props.onError?.(error)
    }
    render() {
        if (!this.state.error) return this.props.children
        return (
            <main className="piru-error" role="alert">
                <h1>Esta página tuvo un problema</h1>
                <p>Podés hacer tu pedido igual desde la tienda.</p>
                <a href={this.props.tiendaEstandar}>Ir a la tienda</a>
            </main>
        )
    }
}

export function PiruFooter() {
    const tienda = useTiendaInterna()
    const links = linksDe(tienda.get())
    return (
        <footer className="piru-pie" data-piru-pie="">
            <span>
                Pedidos por <a href="https://info.piru.app" rel="noopener">Piru</a>
            </span>
            <span aria-hidden="true">·</span>
            <a href={links.tiendaEstandar}>Ver la tienda estándar</a>
        </footer>
    )
}

function PiruAviso() {
    const tienda = useTiendaInterna()
    const [aviso, setAviso] = useState(tienda.get().aviso)
    useEffect(() => tienda.subscribe(() => setAviso(tienda.get().aviso)), [tienda])
    if (!aviso) return null
    return (
        <div className="piru-aviso" role="status" aria-live="polite" data-tono={aviso.tono}>
            {aviso.texto}
        </div>
    )
}

/** Hoja de opciones de Piru: variantes, extras, ingredientes, nota y cantidad. */
export function PiruProductSheet() {
    const tienda = useTiendaInterna()
    const [hoja, setHoja] = useState(tienda.get().hoja)
    useEffect(() => tienda.subscribe(() => setHoja(tienda.get().hoja)), [tienda])
    const carta = useCarta()
    const producto = hoja === null ? null : (carta.productos.find((p) => p.id === hoja) ?? null)
    if (!producto) return null
    return <Hoja key={producto.id} producto={producto} cerrar={() => tienda.set({ hoja: null })} />
}

function Hoja({ producto, cerrar }: { producto: ProductoBase; cerrar: () => void }) {
    const tienda = useTiendaInterna()
    const titulo = useId()
    const dialogo = useRef<HTMLDivElement>(null)
    const [variante, setVariante] = useState<number | undefined>(producto.variantes.length === 1 ? producto.variantes[0].id : undefined)
    const [secundaria, setSecundaria] = useState<number | undefined>(
        producto.variantesSecundarias.length === 1 ? producto.variantesSecundarias[0].id : undefined
    )
    const [agregados, setAgregados] = useState<number[]>([])
    const [sin, setSin] = useState<number[]>([])
    const [nota, setNota] = useState('')
    const [cantidad, setCantidad] = useState(1)
    const [intento, setIntento] = useState(false)

    useEffect(() => {
        const anterior = document.activeElement as HTMLElement | null
        const scroll = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        dialogo.current?.focus()
        const tecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape') cerrar()
            if (e.key === 'Tab' && dialogo.current) {
                const foco = [...dialogo.current.querySelectorAll<HTMLElement>('button,input,textarea,[tabindex="0"]')].filter((el) => !el.hasAttribute('disabled'))
                if (!foco.length) return
                const [primero, ultimo] = [foco[0], foco[foco.length - 1]]
                if (e.shiftKey && document.activeElement === primero) {
                    e.preventDefault()
                    ultimo.focus()
                } else if (!e.shiftKey && document.activeElement === ultimo) {
                    e.preventDefault()
                    primero.focus()
                }
            }
        }
        window.addEventListener('keydown', tecla)
        return () => {
            window.removeEventListener('keydown', tecla)
            document.body.style.overflow = scroll
            anterior?.focus?.()
        }
    }, [cerrar])

    const item = { productoId: producto.id, cantidad, varianteId: variante, varianteSecundariaId: secundaria, agregados, ingredientesExcluidos: sin, nota }
    const validacion = validarItem(producto, item)
    const unitario = useMemo(() => {
        const base =
            (producto.variantes.find((v) => v.id === variante)?.precio ?? producto.precio) +
            (producto.variantesSecundarias.find((v) => v.id === secundaria)?.precio ?? 0)
        const extras = agregados.reduce((s, a) => s + (producto.agregados.find((o) => o.id === a)?.precio ?? 0), 0)
        return { lista: base + extras, final: (producto.descuento > 0 ? base * (1 - producto.descuento / 100) : base) + extras }
    }, [producto, variante, secundaria, agregados])
    const local = tienda.get().datos?.local
    const bloqueado = !producto.disponible || local?.pausado

    const confirmar = () => {
        setIntento(true)
        if (!validacion.ok) return
        const resultado = agregarItem(tienda, item)
        if (resultado.ok) {
            tienda.avisar(`${producto.nombre} agregado al pedido`, 'ok')
            cerrar()
        }
    }

    const alternar = (lista: number[], valor: number) => (lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor])

    return (
        <div className="piru-velo" onClick={(e) => e.target === e.currentTarget && cerrar()}>
            <div className="piru-hoja" role="dialog" aria-modal="true" aria-labelledby={titulo} ref={dialogo} tabIndex={-1}>
                <button type="button" className="piru-cerrar" onClick={cerrar} aria-label="Cerrar">
                    ×
                </button>
                <div className="piru-hoja-scroll">
                    {producto.fotos[0] && <img className="piru-hoja-foto" src={producto.fotos[0]} alt="" />}
                    <div className="piru-hoja-cuerpo">
                        <h2 id={titulo}>{producto.nombre}</h2>
                        {producto.descripcion && <p className="piru-hoja-desc">{producto.descripcion}</p>}
                        {producto.variantes.length === 0 && (
                            <div className="piru-hoja-precio">
                                {formatoPesos(producto.precioFinal)}
                                {producto.descuento > 0 && <s>{formatoPesos(producto.precio)}</s>}
                            </div>
                        )}
                        {producto.variantes.length > 0 && (
                            <Grupo titulo={producto.opciones.tituloVariantes} obligatorio>
                                {producto.variantes.map((v) => (
                                    <label className="piru-opcion" key={v.id}>
                                        <input type="radio" name={`${titulo}-v`} checked={variante === v.id} onChange={() => setVariante(v.id)} />
                                        <span>{v.nombre}</span>
                                        <em>{formatoPesos(producto.descuento > 0 ? v.precio * (1 - producto.descuento / 100) : v.precio)}</em>
                                    </label>
                                ))}
                            </Grupo>
                        )}
                        {producto.variantesSecundarias.length > 0 && (
                            <Grupo titulo={producto.opciones.tituloVariantesSecundarias} obligatorio>
                                {producto.variantesSecundarias.map((v) => (
                                    <label className="piru-opcion" key={v.id}>
                                        <input type="radio" name={`${titulo}-s`} checked={secundaria === v.id} onChange={() => setSecundaria(v.id)} />
                                        <span>{v.nombre}</span>
                                        {v.precio > 0 && <em>+ {formatoPesos(v.precio)}</em>}
                                    </label>
                                ))}
                            </Grupo>
                        )}
                        {producto.ingredientes.length > 0 && (
                            <Grupo titulo="Ingredientes">
                                {producto.ingredientes.map((i) => (
                                    <label className="piru-opcion" key={i.id}>
                                        <input type="checkbox" checked={!sin.includes(i.id)} onChange={() => setSin(alternar(sin, i.id))} />
                                        <span>{i.nombre}</span>
                                    </label>
                                ))}
                            </Grupo>
                        )}
                        {[
                            [producto.agregadosPrimarios, producto.opciones.tituloAgregadosPrimarios] as const,
                            [producto.agregadosSecundarios, producto.opciones.tituloAgregadosSecundarios] as const,
                        ].map(([lista, nombre], i) =>
                            lista.length ? (
                                <Grupo titulo={nombre} key={i}>
                                    {lista.map((a) => (
                                        <label className="piru-opcion" key={a.id}>
                                            <input type="checkbox" checked={agregados.includes(a.id)} onChange={() => setAgregados(alternar(agregados, a.id))} />
                                            <span>{a.nombre}</span>
                                            {a.precio > 0 && <em>+ {formatoPesos(a.precio)}</em>}
                                        </label>
                                    ))}
                                </Grupo>
                            ) : null
                        )}
                        {producto.permiteNota && (
                            <Grupo titulo={producto.tituloNota}>
                                <textarea className="piru-nota" maxLength={300} value={nota} onChange={(e) => setNota(e.target.value)} aria-label={producto.tituloNota} />
                            </Grupo>
                        )}
                        {intento && !validacion.ok && validacion.reason === 'requires-options' && (
                            <p className="piru-falta" role="alert">
                                Elegí una opción para seguir.
                            </p>
                        )}
                    </div>
                </div>
                <div className="piru-hoja-pie">
                    <div className="piru-cantidad">
                        <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))} disabled={cantidad <= 1} aria-label="Uno menos">
                            −
                        </button>
                        <output aria-live="polite">{cantidad}</output>
                        <button type="button" onClick={() => setCantidad((c) => Math.min(99, c + 1))} aria-label="Uno más">
                            +
                        </button>
                    </div>
                    <button type="button" className="piru-boton" onClick={confirmar} disabled={!!bloqueado}>
                        <span>{!producto.disponible ? 'No disponible' : local?.pausado ? 'Cerrado' : 'Agregar'}</span>
                        <span>{formatoPesos(unitario.final * cantidad)}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function Grupo({ titulo, obligatorio, children }: { titulo: string; obligatorio?: boolean; children: ReactNode }) {
    return (
        <fieldset className="piru-grupo">
            <legend>
                {titulo}
                {obligatorio && <small>Obligatorio</small>}
            </legend>
            {children}
        </fieldset>
    )
}

/** Bloque de canjes de puntos (opcional). Los canjes se eligen en el checkout con el saldo real. */
export function PiruCanjes({ titulo = 'Canjeá tus puntos' }: { titulo?: string }) {
    const { canjes } = useCarta()
    if (!canjes.length) return null
    return (
        <section className="piru-canjes" aria-label={titulo}>
            <h2>{titulo}</h2>
            <p>Sumás puntos con cada pedido. Los canjeás al finalizar la compra.</p>
            <ul>
                {canjes.map((p) => (
                    <li key={p.id}>
                        {p.fotos[0] && <img src={p.fotos[0]} alt="" />}
                        <div>
                            <strong>{p.nombre}</strong>
                            <span>{p.puntosNecesarios ? `${p.puntosNecesarios.toLocaleString('es-AR')} puntos` : 'Canje'}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}

/** Raíz del runtime: monta la página del sitio con todo lo obligatorio alrededor. */
export function PiruSiteRoot({
    tienda,
    Page,
    preview,
    onError,
}: {
    tienda: Tienda
    Page: ComponentType
    preview?: DatosPreview
    onError?: (e: Error) => void
}) {
    useCargarDatos(tienda, preview)
    const acento = useAcento(tienda)
    const demo = tienda.get().config.demo === true
    return (
        <ContextoTienda.Provider value={tienda}>
            <style>{`${CSS_RUNTIME}:root{--piru-acento:${acento.fondo};--piru-acento-texto:${acento.texto}}`}</style>
            <PiruErrorBoundary tiendaEstandar={tienda.get().config.tiendaEstandar} onError={onError}>
                <Page />
            </PiruErrorBoundary>
            <PiruFooter />
            <PiruProductSheet />
            <PiruAviso />
            {demo && (
                <Suspense fallback={null}>
                    <PiruDemo tienda={tienda} />
                </Suspense>
            )}
        </ContextoTienda.Provider>
    )
}

function useAcento(tienda: Tienda) {
    const [datos, setDatos] = useState(tienda.get().datos)
    useEffect(() => tienda.subscribe(() => setDatos(tienda.get().datos)), [tienda])
    const fondo = datos?.contenido.colores.acento ?? datos?.local.colores.primario ?? '#141414'
    const seguro = /^#[0-9a-f]{3,8}$/i.test(fondo) ? fondo : '#141414'
    return { fondo: seguro, texto: contrasteTexto(seguro) }
}
