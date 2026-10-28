/**
 * Arranque de un sitio publicado (`/_piru/runtime/v1/boot.js`). El Worker arma el HTML con:
 *
 *   <script id="piru-config" type="application/json">{ restauranteId, username, slug, api, tiendaEstandar }</script>
 *   <script type="module" src="/_piru/runtime/v1/boot.js" data-page="/_piru/s/<hash>.js"></script>
 *
 * El JSON no se ejecuta (la CSP lo permite sin nonce). El bundle del sitio se importa por URL y se
 * monta dentro de `PiruSiteRoot`.
 */
import { createRoot } from 'react-dom/client'
import { PiruSiteRoot, crearTienda, type ConfigSitio } from '@piru/tienda'
import type { ComponentType } from 'react'

async function arrancar() {
    const script = document.querySelector<HTMLScriptElement>('script[data-page]')
    const config = JSON.parse(document.getElementById('piru-config')?.textContent ?? 'null') as ConfigSitio | null
    const raiz = document.getElementById('root')
    if (!script?.dataset.page || !config || !raiz) return
    const tienda = crearTienda(config)
    const modulo = (await import(/* @vite-ignore */ script.dataset.page)) as { default?: ComponentType }
    const Page = modulo.default ?? (() => null)
    createRoot(raiz).render(<PiruSiteRoot tienda={tienda} Page={Page} />)
}

arrancar().catch(() => {
    const raiz = document.getElementById('root')
    const config = JSON.parse(document.getElementById('piru-config')?.textContent ?? 'null') as ConfigSitio | null
    if (raiz && config)
        raiz.innerHTML = `<main style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font:16px system-ui;text-align:center;padding:24px"><p>No pudimos cargar esta página.</p><a href="${encodeURI(config.tiendaEstandar)}">Pedí desde la tienda</a></main>`
})
