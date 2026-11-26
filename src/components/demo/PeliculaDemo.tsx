import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, Check, ChevronLeft, MapPin, Phone, Video, Wallet } from 'lucide-react'
import { CLIENTA_DEMO, PEDIDO_DEMO, armarPedidoDemo, pesos } from '@/lib/demo'
import { Telefono } from './escenas/Telefono'
import { Linea } from './PedidoDemo'
import { ESTILO_VISTA } from './VistaSitio'
import { varsTema, type TemaDemo } from './temaSitio'
import type { DatosDemo, ProductoDemo } from './escenas/datos'

/**
 * La demo de la tienda: una animación a pantalla completa que recorre la página real del local
 * (un iframe de `?demo&vista` en un celular grande) y hace un pedido de punta a punta: el cliente
 * elige, confirma, el pedido llega al WhatsApp del local y queda en su panel. Un título grande
 * dice la idea de cada momento. Al terminar aparece el botón para ir a la página.
 *
 * La primera vez que el local entra (por navegador) no se puede saltar; desde la segunda vuelve
 * a aparecer en cada carga, con «Saltar». Todo pasa en el navegador: no crea nada.
 */

/** Los momentos de la animación, en ms desde que la página del celular terminó de cargar. */
const MOMENTOS = {
  tienda: 0,
  producto: 6200,
  agregado: 8800,
  checkout: 10600,
  enviado: 13600,
  whatsapp: 15200,
  panel: 21000,
  aceptado: 24200,
  fin: 26400,
} as const
type Momento = keyof typeof MOMENTOS
const ORDEN = Object.keys(MOMENTOS) as Momento[]
const despues = (actual: Momento, otro: Momento) => ORDEN.indexOf(actual) >= ORDEN.indexOf(otro)

const ANCHO = 412
const ALTO = 866

interface Props {
  datos: DatosDemo
  tema: TemaDemo
  /** La página del local en `?demo&vista`. */
  vistaUrl: string
  /** Ya la vio entera alguna vez en este navegador: se puede saltar. */
  saltable: boolean
  /** Llegó al final: desde la próxima carga se puede saltar. */
  onVista: () => void
  onTerminar: () => void
}

export function PeliculaDemo({ datos, tema, vistaUrl, saltable, onVista, onTerminar }: Props) {
  const [momento, setMomento] = useState<Momento | null>(null)
  const [cargada, setCargada] = useState(false)
  const [escala, setEscala] = useState(0.6)
  const escenario = useRef<HTMLDivElement>(null)
  const marco = useRef<HTMLIFrameElement>(null)
  const vista = useRef(onVista)
  useEffect(() => {
    vista.current = onVista
  }, [onVista])

  const producto = datos.destacados[0]
  const titulos: Record<Momento, string> = useMemo(() => {
    const elige = 'Tus clientes eligen desde el celular'
    const pide = 'Y piden en un minuto, sin llamarte'
    const panel = 'Y queda ordenado en tu panel'
    return {
      tienda: `Así se ve la tienda de ${datos.local}`,
      producto: elige,
      agregado: elige,
      checkout: pide,
      enviado: pide,
      whatsapp: 'El pedido te llega completo a tu WhatsApp',
      panel,
      aceptado: panel,
      fin: 'Tu diseño. Tus clientes. Sin comisiones.',
    }
  }, [datos.local])

  // La página de atrás no se mueve mientras está la animación.
  useEffect(() => {
    const html = document.documentElement
    const antes = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = antes
    }
  }, [])

  // El celular, lo más grande que entre en su lugar.
  useEffect(() => {
    const el = escenario.current
    if (!el) return
    const medir = () => {
      const css = getComputedStyle(el)
      const alto = el.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom)
      const ancho = el.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight)
      setEscala(Math.max(0.3, Math.min(alto / ALTO, ancho / ANCHO, 1.05)))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Arranca cuando la página del celular cargó (más un respiro para su pantalla de carga), con tope.
  const [arranco, setArranco] = useState(false)
  useEffect(() => {
    const tope = window.setTimeout(() => setCargada(true), 6000)
    return () => window.clearTimeout(tope)
  }, [])
  useEffect(() => {
    if (!cargada || arranco) return
    const t = window.setTimeout(() => setArranco(true), 900)
    return () => window.clearTimeout(t)
  }, [cargada, arranco])

  useEffect(() => {
    if (!arranco) return
    const timers = ORDEN.map((m) => window.setTimeout(() => setMomento(m), MOMENTOS[m]))
    return () => timers.forEach(window.clearTimeout)
  }, [arranco])

  // El recorrido por la página: baja despacio mientras dice cómo se ve y vuelve arriba al final.
  useEffect(() => {
    if (momento !== 'tienda' && momento !== 'fin') return
    const win = marco.current?.contentWindow
    const doc = marco.current?.contentDocument
    if (!win || !doc) return
    const desde = win.scrollY
    const hasta = momento === 'tienda' ? Math.max(0, Math.min(doc.documentElement.scrollHeight - 844, 2600)) : 0
    const inicio = performance.now() + (momento === 'tienda' ? 700 : 0)
    const dura = momento === 'tienda' ? 5000 : 1100
    let raf = 0
    const paso = (ahora: number) => {
      const p = Math.min(1, Math.max(0, (ahora - inicio) / dura))
      const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2
      try {
        win.scrollTo({ top: desde + (hasta - desde) * e, behavior: 'instant' })
      } catch {
        /* la página se fue */
      }
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [momento])

  const pedido = useMemo(
    () =>
      armarPedidoDemo(
        { tipoPedido: 'delivery', nombre: CLIENTA_DEMO.nombre, direccion: 'San Martín 1450', metodoPago: 'cash' },
        [{ nombre: producto.nombre, precio: producto.precio, cantidad: 1 }],
        { nombre: datos.local },
      ),
    [producto, datos.local],
  )

  useEffect(() => {
    if (momento === 'fin') vista.current()
  }, [momento])

  const actual = momento ?? 'tienda'
  const fin = momento === 'fin'

  return (
    <div
      data-demo-pelicula=""
      role="dialog"
      aria-modal="true"
      aria-label={`Cómo funciona la tienda de ${datos.local}`}
      className="pd-pelicula fixed inset-0 flex flex-col overflow-hidden md:flex-row md:items-center"
      style={{ ...varsTema(tema), zIndex: 2147483000, fontFamily: tema.cuerpo }}
    >
      <div className="relative flex shrink-0 flex-col justify-center px-6 pb-1 pt-[max(18px,env(safe-area-inset-top))] text-center md:h-full md:w-[46%] md:px-[5vw] md:text-left">
        <p className="pd-tenue hidden text-[13px] font-semibold uppercase tracking-[0.14em] md:block">{datos.enlace}</p>
        <h1
          key={titulos[actual]}
          aria-live="polite"
          className="pd-titulo min-h-[2.1em] text-balance text-[clamp(1.6rem,7vw,2.6rem)] leading-[1.02] tracking-[-0.025em] md:mt-4 md:min-h-0 md:text-[clamp(2.6rem,4.6vw,5rem)]"
        >
          {titulos[actual].split(' ').map((p, i) => (
            <span key={i}>
              <span className="pd-palabra" style={{ '--i': i } as CSSProperties}>
                {p}
              </span>{' '}
            </span>
          ))}
        </h1>
        <div className="hidden md:block">
          <BotonFinal visible={fin} local={datos.local} onClick={onTerminar} />
        </div>
      </div>

      <div className="relative min-h-0 flex-1 md:h-full">
        <div ref={escenario} className="absolute inset-0 grid place-items-center px-4 py-2 md:px-[4vw] md:py-[5vh]">
          <div className="pd-celular" style={{ width: ANCHO * escala, height: ALTO * escala }}>
            <div className="origin-top-left" style={{ transform: `scale(${escala})` }}>
              <Telefono>
                <iframe
                  ref={marco}
                  src={vistaUrl}
                  title=""
                  aria-hidden
                  tabIndex={-1}
                  scrolling="no"
                  onLoad={() => {
                    try {
                      const doc = marco.current?.contentDocument
                      if (doc && !doc.getElementById('pd-vista')) {
                        const s = doc.createElement('style')
                        s.id = 'pd-vista'
                        s.textContent = `${ESTILO_VISTA}html{scroll-behavior:auto!important}`
                        doc.head.appendChild(s)
                      }
                    } catch {
                      /* otro origen: igual se ve */
                    }
                    setCargada(true)
                  }}
                  className="block border-0"
                  style={{ width: 390, height: 844, pointerEvents: 'none', background: 'var(--d-fondo)' }}
                />
                <Hoja visible={despues(actual, 'producto') && !despues(actual, 'checkout')}>
                  <HojaProducto producto={producto} agregado={despues(actual, 'agregado')} />
                </Hoja>
                <Hoja visible={despues(actual, 'checkout') && !despues(actual, 'whatsapp')}>
                  <HojaCheckout producto={producto} enviado={despues(actual, 'enviado')} />
                </Hoja>
                <Pantalla visible={despues(actual, 'whatsapp') && !despues(actual, 'fin')}>
                  <PantallaWhatsapp mensaje={pedido.mensaje} />
                </Pantalla>
                <Pantalla visible={despues(actual, 'panel') && !despues(actual, 'fin')} desde="derecha">
                  <PantallaPanel local={datos.local} producto={producto} aceptado={despues(actual, 'aceptado')} />
                </Pantalla>
              </Telefono>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-[max(28px,env(safe-area-inset-bottom))] text-center md:hidden [&>*]:pointer-events-auto">
        <BotonFinal visible={fin} local={datos.local} onClick={onTerminar} />
      </div>

      {saltable && !fin && (
        <button
          type="button"
          onClick={onTerminar}
          className="pd-saltar absolute right-4 top-[max(14px,env(safe-area-inset-top))] rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
        >
          Saltar
        </button>
      )}
    </div>
  )
}

function BotonFinal({ visible, local, onClick }: { visible: boolean; local: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`pd-boton mt-0 inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-[16.5px] font-semibold md:mt-8 ${visible ? 'pd-boton-visible' : ''}`}
    >
      Ver la página de {local}
      <ArrowRight className="size-[18px]" strokeWidth={2.4} />
    </button>
  )
}

/** Una hoja que sube desde abajo de la pantalla del celular, sobre la página (como el detalle de un producto). */
function Hoja({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div className={`pd-capa absolute inset-0 z-40 ${visible ? 'pd-capa-visible' : ''}`}>
      <div className="pd-velo absolute inset-0" />
      <div className="pd-hoja absolute inset-x-0 bottom-0 rounded-t-[30px] px-6 pb-10 pt-3">
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-current opacity-20" />
        {children}
      </div>
    </div>
  )
}

/** Una pantalla entera que tapa la tienda (otra app del celular). */
function Pantalla({ visible, desde = 'abajo', children }: { visible: boolean; desde?: 'abajo' | 'derecha'; children: React.ReactNode }) {
  return (
    <div className={`pd-pantalla pd-desde-${desde} absolute inset-0 z-50 ${visible ? 'pd-pantalla-visible' : ''}`}>{children}</div>
  )
}

/** El dedo que toca: aparece sobre el botón y deja una onda. */
function Toque({ activo }: { activo: boolean }) {
  if (!activo) return null
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      <span className="pd-onda absolute -ml-7 -mt-7 size-14 rounded-full" />
      <span className="pd-dedo absolute -ml-[22px] -mt-[22px] size-11 rounded-full" />
    </span>
  )
}

function Foto({ producto, className }: { producto: ProductoDemo; className: string }) {
  return producto.imagenUrl ? (
    <img src={producto.imagenUrl} alt="" className={`${className} object-cover`} draggable={false} />
  ) : (
    <div className={`${className} pd-foto-vacia grid place-items-center text-[40px] font-bold`}>{producto.nombre[0]}</div>
  )
}

function HojaProducto({ producto, agregado }: { producto: ProductoDemo; agregado: boolean }) {
  const [toca, setToca] = useState(false)
  useEffect(() => {
    if (agregado) return
    const t = window.setTimeout(() => setToca(true), 1700)
    return () => window.clearTimeout(t)
  }, [agregado])
  return (
    <div>
      <Foto producto={producto} className="h-[250px] w-full rounded-[20px]" />
      <p className="pd-titulo mt-5 text-[26px] leading-[1.1]">{producto.nombre}</p>
      {producto.descripcion && <p className="mt-2 line-clamp-2 text-[15px] leading-[1.45] opacity-70">{producto.descripcion}</p>}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-14 items-center gap-4 rounded-full px-5 text-[18px] font-semibold ring-1 ring-current/20">
          <span className="opacity-40">−</span>1<span>+</span>
        </div>
        <div className="relative flex-1">
          <div className={`pd-accion flex h-14 items-center justify-center gap-2 rounded-full text-[17px] font-semibold ${agregado ? 'pd-hecho' : ''}`}>
            {agregado ? (
              <>
                <Check className="size-5" strokeWidth={3} /> Agregado
              </>
            ) : (
              <>Agregar · {pesos(producto.precio)}</>
            )}
          </div>
          <Toque activo={toca && !agregado} />
        </div>
      </div>
    </div>
  )
}

function HojaCheckout({ producto, enviado }: { producto: ProductoDemo; enviado: boolean }) {
  const [toca, setToca] = useState(false)
  useEffect(() => {
    if (enviado) return
    const t = window.setTimeout(() => setToca(true), 2200)
    return () => window.clearTimeout(t)
  }, [enviado])
  const filas = [
    { Icono: MapPin, titulo: 'Envío a domicilio', detalle: 'San Martín 1450' },
    { Icono: Wallet, titulo: 'Efectivo', detalle: 'Paga al recibir' },
  ]
  return (
    <div>
      <p className="pd-titulo text-[26px] leading-[1.1]">Tu pedido</p>
      <div className="mt-4 flex items-center gap-3">
        <Foto producto={producto} className="size-14 shrink-0 rounded-[14px]" />
        <p className="min-w-0 flex-1 truncate text-[16px] font-semibold">1× {producto.nombre}</p>
        <p className="text-[16px] font-semibold">{pesos(producto.precio)}</p>
      </div>
      <div className="mt-4 divide-y divide-current/10 rounded-[18px] px-4 ring-1 ring-current/15">
        <div className="flex items-center gap-3 py-3">
          <span className="pd-avatar grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold">{CLIENTA_DEMO.iniciales}</span>
          <div>
            <p className="text-[15px] font-semibold">{CLIENTA_DEMO.nombre}</p>
            <p className="text-[13px] opacity-60">{CLIENTA_DEMO.telefono}</p>
          </div>
        </div>
        {filas.map(({ Icono, titulo, detalle }) => (
          <div key={titulo} className="flex items-center gap-3 py-3">
            <Icono className="size-5 shrink-0 opacity-60" />
            <div>
              <p className="text-[15px] font-semibold">{titulo}</p>
              <p className="text-[13px] opacity-60">{detalle}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-5">
        <div className={`pd-accion flex h-14 items-center justify-between rounded-full px-6 text-[17px] font-semibold ${enviado ? 'pd-hecho' : ''}`}>
          {enviado ? (
            <span className="mx-auto flex items-center gap-2">
              <Check className="size-5" strokeWidth={3} /> Pedido enviado
            </span>
          ) : (
            <>
              <span>Hacer pedido</span>
              <span>{pesos(producto.precio)}</span>
            </>
          )}
        </div>
        <Toque activo={toca && !enviado} />
      </div>
    </div>
  )
}

function PantallaWhatsapp({ mensaje }: { mensaje: string }) {
  return (
    <div className="pd-wa flex h-full flex-col">
      <div className="flex items-center gap-2.5 bg-[#0B6E5C] px-3 pb-3 pt-[60px] text-white">
        <ChevronLeft className="size-6 shrink-0" />
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/20 text-[14px] font-bold">{CLIENTA_DEMO.iniciales}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold leading-tight">{CLIENTA_DEMO.nombre}</p>
          <p className="text-[13px] text-white/75">en línea</p>
        </div>
        <Video className="size-5 opacity-90" />
        <Phone className="ml-4 mr-1 size-[18px] opacity-90" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden p-3 pb-6">
        <p className="mx-auto mb-3 rounded-md bg-white/80 px-2.5 py-1 text-[12px] font-medium text-[#54656f]">HOY</p>
        <div className="pd-burbuja mr-10 whitespace-pre-wrap break-words rounded-[14px] rounded-tl-[4px] bg-white px-3 py-2.5 text-[15px] leading-[1.42] text-[#111b21] shadow-[0_1px_0.5px_rgb(11_20_26/.13)]">
          {mensaje.split('\n').map((linea, i) => (
            <span key={i} className="pd-linea block min-h-[1.42em]" style={{ '--i': i } as CSSProperties}>
              <Linea texto={linea} />
            </span>
          ))}
          <span className="block text-right text-[11px] text-[#667781]">21:04</span>
        </div>
      </div>
    </div>
  )
}

function PantallaPanel({ local, producto, aceptado }: { local: string; producto: ProductoDemo; aceptado: boolean }) {
  const [toca, setToca] = useState(false)
  useEffect(() => {
    if (aceptado) return
    const t = window.setTimeout(() => setToca(true), 2300)
    return () => window.clearTimeout(t)
  }, [aceptado])
  const anteriores = [
    { numero: PEDIDO_DEMO - 1, cliente: 'Lucas Ferreyra', total: producto.precio * 2, estado: 'En camino' },
    { numero: PEDIDO_DEMO - 2, cliente: 'Sofía Paredes', total: producto.precio * 3, estado: 'Entregado' },
  ]
  return (
    <div className="flex h-full flex-col bg-[#FAF7F2] font-sans text-[#191512]">
      <div className="bg-white px-5 pb-4 pt-[64px] shadow-[0_1px_0_rgb(25_21_18/.08)]">
        <p className="text-[13px] font-semibold text-[#80776e]">{local} · Panel</p>
        <p className="mt-0.5 text-[28px] font-bold tracking-[-0.02em]">Pedidos de hoy</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-[#FFF2E3] px-3.5 py-2.5">
            <p className="text-[12px] font-semibold text-[#9e3e00]">Vendido hoy</p>
            <p className="text-[19px] font-bold">{pesos(producto.precio * 6)}</p>
          </div>
          <div className="rounded-2xl bg-[#F1ECE4] px-3.5 py-2.5">
            <p className="text-[12px] font-semibold text-[#80776e]">Comisiones</p>
            <p className="text-[19px] font-bold">$0</p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden p-4">
        <div className="pd-nuevo rounded-[20px] bg-white p-4 shadow-[0_0_0_2px_#FF7A00,0_14px_30px_-16px_rgb(255_122_0/.6)]">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-bold">#{PEDIDO_DEMO} · {CLIENTA_DEMO.nombre}</p>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${aceptado ? 'bg-[#E6F6EC] text-[#11743b]' : 'bg-[#FF7A00] text-white'}`}>
              {aceptado ? 'En preparación' : 'Nuevo'}
            </span>
          </div>
          <p className="mt-1.5 text-[14px] text-[#4a433c]">1× {producto.nombre}</p>
          <p className="text-[14px] text-[#4a433c]">San Martín 1450 · Efectivo · {pesos(producto.precio)}</p>
          <p className="mt-2 inline-block rounded-full bg-[#F1ECE4] px-2.5 py-1 text-[12px] font-semibold text-[#4a433c]">
            Cliente frecuente · {CLIENTA_DEMO.pedidos + 1}º pedido
          </p>
          {!aceptado && (
            <div className="relative mt-3">
              <div className="flex h-12 items-center justify-center rounded-full bg-[#191512] text-[15px] font-semibold text-white">Aceptar pedido</div>
              <Toque activo={toca} />
            </div>
          )}
        </div>
        {anteriores.map((p) => (
          <div key={p.numero} className="rounded-[20px] bg-white p-4 opacity-80 shadow-[0_1px_2px_rgb(25_21_18/.08)]">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">#{p.numero} · {p.cliente}</p>
              <span className="text-[12px] font-semibold text-[#80776e]">{p.estado}</span>
            </div>
            <p className="mt-1 text-[14px] text-[#4a433c]">{pesos(p.total)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
