import { storeSlugFromHostname } from '../src/lib/store-domain'
import { storeSiteMeta, type StoreSiteMeta } from '../src/store-sites/meta'
import { atenderPaginas, type EnvPaginas } from './paginas'

/**
 * Proxy de subdominios de tienda (`*.piru.app`).
 *
 * Cloudflare Pages no admite dominios comodín. Este Worker recibe `burgers10.piru.app`, pide el
 * contenido al proyecto Pages de `web/` y el navegador conserva el subdominio; React resuelve la
 * tienda y su diseño. Además escribe en el HTML el título, el ícono y la vista previa del link de
 * las tiendas registradas, porque los crawlers no ejecutan JavaScript.
 *
 * Si el subdominio tiene un sitio de Páginas publicado (KV `sitio:<slug>`), lo sirve `paginas.ts`
 * (docs/PAGINAS_PROPIAS.md). El despliegue, el DNS y las exclusiones están en
 * `cloudflare/README.md` y en `docs/TIENDAS_SUBDOMINIO.md`.
 */
interface Env extends EnvPaginas {
    CLIENT_PAGES_ORIGIN: string
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const incoming = new URL(request.url)
        const slug = storeSlugFromHostname(incoming.hostname)
        if (!slug) {
            // Infraestructura (api, admin, my, www…): su ruta propia no debería pasar por acá; si
            // pasa, se deja seguir al origen de siempre.
            return fetch(request)
        }
        // Páginas: si el subdominio tiene un sitio publicado en KV, se sirve ese sitio.
        // Sin sitio (o sin bindings) sigue el proxy de la tienda estándar.
        const paginas = await atenderPaginas(request, slug, env)
        if (paginas) return paginas
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
        }

        let origin: URL
        try {
            origin = new URL(env.CLIENT_PAGES_ORIGIN)
            if (
                origin.protocol !== 'https:' ||
                !/^[a-z0-9-]+\.pages\.dev$/.test(origin.hostname) ||
                origin.port ||
                origin.username ||
                origin.password ||
                origin.pathname !== '/' ||
                origin.search ||
                origin.hash
            ) {
                throw new Error()
            }
        } catch {
            return new Response('Configurá CLIENT_PAGES_ORIGIN con el origen pages.dev de web/', { status: 503 })
        }

        const upstream = new URL(origin)
        upstream.pathname = incoming.pathname
        upstream.search = incoming.search

        const headers = new Headers(request.headers)
        headers.delete('host')
        headers.delete('cookie')
        headers.delete('authorization')

        const response = await fetch(upstream, { method: request.method, headers, redirect: 'manual' })

        // Las redirecciones relativas y las del mismo proyecto Pages vuelven al subdominio.
        const result = new Response(response.body, response)
        const location = result.headers.get('location')
        if (location) {
            const destination = new URL(location, upstream)
            if (destination.origin === origin.origin) {
                destination.host = incoming.host
                result.headers.set('location', destination.toString())
            }
        }
        result.headers.delete('set-cookie')

        const meta = Object.hasOwn(storeSiteMeta, slug) ? storeSiteMeta[slug] : null
        if (request.method === 'GET' && meta && result.ok && result.headers.get('content-type')?.includes('text/html')) {
            return withSiteMeta(result, meta, incoming.origin)
        }
        return result
    },
}

const escapeAttr = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Título, ícono y vista previa del link propios de la tienda, en el HTML que leen los crawlers. */
function withSiteMeta(response: Response, meta: StoreSiteMeta, origin: string): Response {
    const image = new URL(meta.image, origin).toString()
    const icon = new URL(meta.icon, origin).toString()
    const appleTouchIcon = meta.appleTouchIcon ? new URL(meta.appleTouchIcon, origin).toString() : icon

    // `index.html` ya trae estas etiquetas: se reescriben para no dejar dos valores en el documento.
    const extra = [
        `<meta property="og:url" content="${escapeAttr(origin + '/')}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
    ].join('')

    const rewritten = new HTMLRewriter()
        .on('title', { element: (el) => el.setInnerContent(meta.title) })
        .on('link[rel="icon"]', { element: (el) => el.setAttribute('href', icon) })
        .on('link[rel="apple-touch-icon"]', { element: (el) => el.setAttribute('href', appleTouchIcon) })
        .on('meta[name="description"]', { element: (el) => el.setAttribute('content', meta.description) })
        .on('meta[name="title"]', { element: (el) => el.setAttribute('content', meta.title) })
        .on('meta[name="apple-mobile-web-app-title"]', { element: (el) => el.setAttribute('content', meta.title) })
        .on('meta[property="og:title"]', { element: (el) => el.setAttribute('content', meta.title) })
        .on('meta[property="og:description"]', { element: (el) => el.setAttribute('content', meta.description) })
        .on('meta[property="og:image"]', { element: (el) => el.setAttribute('content', image) })
        .on('meta[name="twitter:title"]', { element: (el) => el.setAttribute('content', meta.title) })
        .on('meta[name="twitter:description"]', { element: (el) => el.setAttribute('content', meta.description) })
        .on('meta[name="twitter:image"]', { element: (el) => el.setAttribute('content', image) })
        .on('meta[name="theme-color"]', {
            element: (el) => meta.themeColor && el.setAttribute('content', meta.themeColor),
        })
        .on('head', { element: (el) => el.append(extra, { html: true }) })
        .transform(response)

    const headers = new Headers(rewritten.headers)
    headers.delete('content-length')
    return new Response(rewritten.body, { status: rewritten.status, statusText: rewritten.statusText, headers })
}
