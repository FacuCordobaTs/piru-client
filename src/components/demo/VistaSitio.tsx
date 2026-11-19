/**
 * La tienda o el sitio del local tal cual se ve en un celular: un iframe de 390 px de ancho (el
 * ancho de la pantalla del marco `Telefono`) con la misma página en `?demo&vista`. Así el celular de la demo
 * muestra el diseño real, con sus fuentes y sus fotos, y no una réplica genérica. En `vista`, la
 * demo (`DemoTienda` o la del runtime) no monta nada adentro (ni intro, ni recorrido, ni isla). Es decorativo: sin
 * foco ni toques.
 */
export function urlVistaSitio() {
  return `${window.location.origin}${window.location.pathname}?demo&vista`
}

export function VistaSitio({ url, alto = 844 }: { url: string; alto?: number }) {
  return (
    <iframe
      src={url}
      title=""
      aria-hidden
      tabIndex={-1}
      scrolling="no"
      loading="eager"
      className="block border-0"
      style={{ width: 390, height: alto, pointerEvents: 'none', background: 'transparent' }}
    />
  )
}

/** ¿Esta página es la que está adentro de `VistaSitio`? */
export function esVistaSitio() {
  try {
    return window.self !== window.top && new URLSearchParams(window.location.search).has('vista')
  } catch {
    return true
  }
}

/** Lo único que la demo pone adentro del iframe: sin barra de scroll. */
export const ESTILO_VISTA = 'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}'
