/**
 * La página del local adentro del celular de la animación (`PeliculaDemo`): la misma URL con
 * `?demo&vista`. En `vista`, la demo (`DemoTienda` o la del runtime) no monta nada adentro.
 */
export function urlVistaSitio() {
  return `${window.location.origin}${window.location.pathname}?demo&vista`
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
