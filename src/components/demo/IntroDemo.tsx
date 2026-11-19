import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { varsTema, type TemaDemo } from './temaSitio'

interface Carta {
  clave: string
  pie: string
  contenido: ReactNode
}

interface Props {
  local: string
  tema: TemaDemo
  logo: string | null
  producto: { nombre: string; imagenUrl: string } | null
  /** La página del local a 390 px de ancho (`VistaSitio` o la réplica de la tienda). */
  pagina: ReactNode
  onTerminar: () => void
}

/** Dónde cae cada carta (px desde el centro y giro), en compu y en celular, según cuántas haya. */
const LUGARES = [
  { x: -150, y: -10, r: -8, xm: -56, ym: -24 },
  { x: 150, y: 12, r: 7, xm: 56, ym: 6 },
  { x: 0, y: 34, r: -2, xm: 0, ym: 36 },
]

const palabras = (texto: string) => texto.split(/\s+/).filter(Boolean)
const limpia = (p: string) => p.replace(/[^\p{L}']/gu, '')

/**
 * La intro de la demo, antes del recorrido: la de la landing (landing/src/components/secciones/
 * Intro.astro) con el local adentro y con el aspecto de su sitio (`TemaDemo`). Dos frases, caen
 * una foto de su carta, su logo y su página, la última frase y la capa sube y deja ver el sitio.
 * Todo es CSS con retrasos (`demo.css`, `di-*`); acá sólo se espera a las fuentes del sitio para
 * arrancar, se saltea (toque, Enter, Espacio o Esc) y se avisa al terminar. Con movimiento
 * reducido no aparece.
 */
export function IntroDemo({ local, tema, logo, producto, pagina, onTerminar }: Props) {
  const [lista, setLista] = useState(false)
  const [saltar, setSaltar] = useState(false)
  const terminar = useRef(onTerminar)
  terminar.current = onTerminar

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      terminar.current()
      return
    }
    const html = document.documentElement
    const antes = html.style.overflow
    html.style.overflow = 'hidden'
    let tope: number | undefined
    let vivo = true
    // Arranca con las fuentes del sitio ya cargadas (con un tope, por si tardan).
    Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]).then(() => {
      if (!vivo) return
      setLista(true)
      tope = window.setTimeout(() => terminar.current(), 11500)
    })
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        setLista(true)
        setSaltar(true)
      }
    }
    window.addEventListener('keydown', tecla)
    return () => {
      vivo = false
      html.style.overflow = antes
      window.clearTimeout(tope)
      window.removeEventListener('keydown', tecla)
    }
  }, [])

  const cartas = ([
    producto && {
      clave: 'producto',
      pie: producto.nombre,
      contenido: <img src={producto.imagenUrl} alt="" className="h-full w-full object-cover" draggable={false} />,
    },
    {
      clave: 'logo',
      pie: local,
      contenido: (
        <div className="grid h-full w-full place-items-center p-6" style={{ background: 'var(--d-fondo)' }}>
          {logo ? (
            <img src={logo} alt="" className="max-h-[60%] max-w-[80%] object-contain" draggable={false} />
          ) : (
            <span className="di-titulo text-center text-[44px] leading-none" style={{ color: 'var(--d-texto)' }}>
              {local}
            </span>
          )}
        </div>
      ),
    },
    {
      clave: 'pagina',
      pie: 'Tu página',
      contenido: (
        <div className="di-lienzo h-full w-full">
          <div className="di-lienzo-escala">{pagina}</div>
        </div>
      ),
    },
  ] as (Carta | null)[]).filter((c): c is Carta => !!c)
  const lugares = cartas.length === 3 ? LUGARES : LUGARES.slice(1)

  const frase1 = palabras('Cuidaste cada detalle de')
  const delLocal = palabras(local)
  const lineas = [
    { texto: 'Pero para vender online, todas las tiendas eran iguales', acento: 'iguales', inicio: 2.4, fin: 4.2 },
    { texto: 'Así se ve la tuya, con tu diseño', subrayado: 'diseño', inicio: 6.3, fin: 8 },
  ]

  return (
    <div
      data-demo-intro=""
      className={`di-intro fixed inset-0 cursor-pointer select-none overflow-hidden ${lista ? 'di-lista' : ''} ${saltar ? 'di-saltar' : ''}`}
      style={{ ...varsTema(tema), zIndex: 2147483000 }}
      onPointerDown={() => {
        setLista(true)
        setSaltar(true)
      }}
    >
      <div
        aria-hidden
        className="di-superficie absolute inset-x-0 -top-32 bottom-0 rounded-b-[56px]"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && e.animationName === 'di-sube') terminar.current()
        }}
      >
        <div className="di-contenido absolute inset-x-0 bottom-0 top-32 grid place-items-center px-6 text-center [perspective:900px]">
          <p className="di-frase di-hola di-titulo col-start-1 row-start-1 max-w-[15ch] text-[2.4rem] leading-[1] sm:text-6xl lg:text-7xl">
            {[...frase1.map((p) => ({ p, acento: false })), ...delLocal.map((p) => ({ p, acento: true }))].map(({ p, acento }, i) => (
              <span key={i}>
                <span className={`di-palabra ${acento ? 'di-acento' : ''}`} style={{ '--d': `${0.15 + i * 0.07}s` } as CSSProperties}>
                  {p}
                </span>{' '}
              </span>
            ))}
          </p>

          {lineas.map((l) => (
            <p
              key={l.texto}
              className="di-frase di-titulo col-start-1 row-start-1 max-w-[16ch] text-[2.1rem] leading-[1.02] sm:text-5xl lg:text-6xl"
              style={{ '--fin': `${l.fin}s` } as CSSProperties}
            >
              {palabras(l.texto).map((p, i) => (
                <span key={i}>
                  <span
                    className={`di-palabra relative ${limpia(p) === l.acento ? 'di-acento' : ''}`}
                    style={{ '--d': `${l.inicio + i * 0.045}s` } as CSSProperties}
                  >
                    {p}
                    {limpia(p) === l.subrayado && <span className="di-subrayado absolute inset-x-0 -bottom-[.04em] h-[.1em] rounded-full" />}
                  </span>{' '}
                </span>
              ))}
            </p>
          ))}

          <div className="di-pila relative col-start-1 row-start-1 h-[70vh] w-full max-w-xl">
            {cartas.map((c, i) => {
              const l = lugares[i]
              return (
                <figure
                  key={c.clave}
                  className="di-carta absolute left-1/2 top-1/2 m-0 bg-white p-2 pb-8 shadow-[0_24px_60px_rgb(0_0_0/.22)]"
                  style={
                    {
                      '--x': `${l.x}px`,
                      '--y': `${l.y}px`,
                      '--xm': `${l.xm}px`,
                      '--ym': `${l.ym}px`,
                      '--r': `${l.r}deg`,
                      '--d': `${4.6 + i * 0.3}s`,
                    } as CSSProperties
                  }
                >
                  <div className="aspect-[390/600] w-full overflow-hidden bg-neutral-100">{c.contenido}</div>
                  <figcaption className="absolute inset-x-2 bottom-0 flex h-8 items-center justify-center truncate text-[12px] font-semibold text-neutral-700">
                    {c.pie}
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="di-saltar-boton absolute bottom-5 right-5 rounded-full px-3 py-1.5 text-[13px] font-medium"
        onClick={() => setSaltar(true)}
      >
        Saltar
      </button>
    </div>
  )
}

/** La primera foto de la carta, para la carta de la intro. */
export function productoIntro(destacados: { nombre: string; imagenUrl: string | null }[]) {
  const p = destacados.find((d) => d.imagenUrl)
  return p?.imagenUrl ? { nombre: p.nombre, imagenUrl: p.imagenUrl } : null
}
