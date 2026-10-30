/**
 * El CSS de la demo (`src/sdk/demo.css`) lo compila `scripts/build-runtime.ts` con Tailwind y lo
 * entrega como `piru:demo-css` (un string) al bundle de la demo. Vite no lo usa: la app `web/`
 * monta la demo desde `components/demo/` con su propio `index.css`.
 */
declare module 'piru:demo-css' {
    const css: string
    export default css
}

/**
 * El bundle de la demo del sitio de Páginas (`dist-runtime/v1/demo.js`). Lo resuelve el import map
 * del HTML publicado; en `web/` sólo existe para que TypeScript entienda el `import()` diferido.
 */
declare module '@piru/demo' {
    import type { ComponentType } from 'react'
    const PiruDemo: ComponentType<{ tienda: import('./store').Tienda }>
    export default PiruDemo
}
