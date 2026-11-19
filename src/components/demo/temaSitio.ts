import { useEffect, useState, type CSSProperties } from 'react'

/**
 * El aspecto del sitio que tiene detrás la demo (su fondo, su texto, el color de sus botones y sus
 * tipografías), leído del DOM ya pintado. Lo usan la intro y el recorrido para verse como la
 * página del local y no con la paleta de Piru. Sirve igual para un sitio de Páginas (cualquier
 * diseño) y para la tienda estándar: no depende de cómo esté hecho, sólo de cómo se ve.
 */
export interface TemaDemo {
  fondo: string
  texto: string
  acento: string
  sobreAcento: string
  titulos: string
  pesoTitulos: string
  cuerpo: string
}

const PIRU: TemaDemo = {
  fondo: '#FFFCF7',
  texto: '#191512',
  acento: '#FF7A00',
  sobreAcento: '#FFFFFF',
  titulos: 'inherit',
  pesoTitulos: '700',
  cuerpo: 'inherit',
}

type Rgba = [number, number, number, number]

let lienzo: CanvasRenderingContext2D | null | undefined
/** Cualquier color CSS (rgb, oklch, nombre…) a RGBA, con un canvas de 1 px. */
function aRgba(color: string): Rgba | null {
  if (!color || color === 'transparent') return null
  if (lienzo === undefined) lienzo = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!lienzo) return null
  lienzo.clearRect(0, 0, 1, 1)
  lienzo.fillStyle = '#000'
  lienzo.fillStyle = color
  lienzo.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = lienzo.getImageData(0, 0, 1, 1).data
  return [r, g, b, a / 255]
}

const hex = ([r, g, b]: Rgba) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`

function luminancia([r, g, b]: Rgba) {
  const canal = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}

function contraste(a: Rgba, b: Rgba) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

/** El primer fondo opaco desde el elemento hacia arriba. */
function fondoDe(el: Element | null): Rgba | null {
  for (let e = el; e; e = e.parentElement) {
    const c = aRgba(getComputedStyle(e).backgroundColor)
    if (c && c[3] > 0.9) return c
  }
  return null
}

const delSitio = (el: Element) => !el.closest('[data-piru-demo], [data-demo-intro], [role="dialog"]')
const visible = (el: Element) => (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0
const primero = (selector: string) => [...document.querySelectorAll(selector)].find((e) => delSitio(e) && visible(e)) ?? null

export function leerTemaSitio(acentoLocal?: string | null): TemaDemo {
  if (typeof document === 'undefined') return PIRU
  const titulo = primero('h1') ?? primero('h2')
  const parrafo = primero('main p') ?? primero('p')

  const fondoRgba = fondoDe(parrafo ?? titulo) ?? fondoDe(document.body) ?? aRgba('#fff')!
  let textoRgba = parrafo ? aRgba(getComputedStyle(parrafo).color) : null
  if (!textoRgba || contraste(textoRgba, fondoRgba) < 3) textoRgba = aRgba(getComputedStyle(document.body).color)
  // Si lo leído no se lee bien (una foto de fondo, por ejemplo), queda la paleta de Piru.
  if (!textoRgba || contraste(textoRgba, fondoRgba) < 3) return { ...PIRU, ...fuentes(titulo, parrafo) }

  // El acento: el primer botón (o link con fondo) que se distinga del fondo; si no, el color del local.
  let acento: Rgba | null = null
  let sobreAcento: Rgba | null = null
  for (const b of document.querySelectorAll('button, a')) {
    if (!delSitio(b) || !visible(b)) continue
    const c = aRgba(getComputedStyle(b).backgroundColor)
    if (!c || c[3] < 0.9 || contraste(c, fondoRgba) < 1.4) continue
    acento = c
    const t = aRgba(getComputedStyle(b).color)
    sobreAcento = t && contraste(t, c) >= 3 ? t : null
    break
  }
  acento ??= (acentoLocal && aRgba(acentoLocal)) || aRgba(PIRU.acento)!
  sobreAcento ??= contraste(acento, aRgba('#fff')!) >= contraste(acento, aRgba('#111')!) ? aRgba('#fff')! : aRgba('#111')!

  return {
    fondo: hex(fondoRgba),
    texto: hex(textoRgba),
    acento: hex(acento),
    sobreAcento: hex(sobreAcento),
    ...fuentes(titulo, parrafo),
  }
}

function fuentes(titulo: Element | null, parrafo: Element | null) {
  const cuerpo = getComputedStyle(parrafo ?? document.body).fontFamily || 'inherit'
  return {
    cuerpo,
    titulos: titulo ? getComputedStyle(titulo).fontFamily || cuerpo : cuerpo,
    pesoTitulos: titulo ? getComputedStyle(titulo).fontWeight || '700' : '700',
  }
}

/** Las variables que leen `demo.css`, la intro y el recorrido. */
export function varsTema(tema: TemaDemo | null | undefined): CSSProperties | undefined {
  if (!tema) return undefined
  return {
    '--d-fondo': tema.fondo,
    '--d-texto': tema.texto,
    '--d-acento': tema.acento,
    '--d-sobre-acento': tema.sobreAcento,
    '--d-titulos': tema.titulos,
    '--d-peso-titulos': tema.pesoTitulos,
    '--d-cuerpo': tema.cuerpo,
  } as CSSProperties
}

/** El tema del sitio, releído cuando terminan de cargar sus fuentes y cuando ya pintó todo. */
export function useTemaSitio(acentoLocal?: string | null): TemaDemo {
  const [tema, setTema] = useState(() => leerTemaSitio(acentoLocal))
  useEffect(() => {
    let vivo = true
    const leer = () => vivo && setTema(leerTemaSitio(acentoLocal))
    document.fonts?.ready.then(leer)
    const timer = window.setTimeout(leer, 700)
    return () => {
      vivo = false
      window.clearTimeout(timer)
    }
  }, [acentoLocal])
  return tema
}
