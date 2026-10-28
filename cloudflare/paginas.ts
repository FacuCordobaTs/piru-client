/**
 * Rama de Páginas del Worker de `*.piru.app` (docs/PAGINAS_PROPIAS.md, §8).
 *
 * Si `sitio:<slug>` existe en KV, el subdominio es un sitio de Páginas: el Worker arma un HTML chico
 * con el import map del runtime, sirve los bundles y assets desde R2, redirige las rutas de
 * plataforma a `my.piru.app` y pone la CSP estricta. Si no existe, devuelve `null` y el Worker sigue
 * con el proxy de siempre (diseño registrado o plantilla).
 *
 * Tipos mínimos de R2/KV para no depender de `@cloudflare/workers-types`.
 */

export interface ObjetoR2 {
    body: ReadableStream
    httpMetadata?: { contentType?: string }
}
export interface BucketR2 {
    get(key: string): Promise<ObjetoR2 | null>
}
export interface KvSitios {
    get(key: string, opciones: { type: 'json'; cacheTtl?: number }): Promise<unknown>
}

export interface EnvPaginas {
    SITIOS?: BucketR2
    SITIOS_KV?: KvSitios
    /** `https://api.piru.app` (sin `/api`): lo único que el sitio puede llamar. */
    API_ORIGIN?: string
    /** Host de las fotos (`R2_PUBLIC_URL`): `https://images.piru.app`. */
    IMAGES_ORIGIN?: string
}

export type ManifiestoSitio = {
    versionId: number
    restauranteId: number
    username: string
    runtime: string
    bundle: string
    css: string | null
    meta: {
        titulo: string
        descripcion: string
        ogImage: string | null
        icono: string | null
        themeColor: string | null
        loadingBackground: string | null
    }
    status: 'activo'
}

const INMUTABLE = 'public, max-age=31536000, immutable'
const TIPOS: Record<string, string> = {
    js: 'text/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    woff2: 'font/woff2',
    mp4: 'video/mp4',
    webm: 'video/webm',
    'd.ts': 'text/plain; charset=utf-8',
}
const MODULOS_RUNTIME = new Set(['react', 'react-jsx-runtime', 'react-dom', 'react-dom-client', 'motion', 'react-router', 'sdk', 'boot'])

export const IMPORTS_RUNTIME = (v: string) => ({
    react: `/_piru/runtime/${v}/react.js`,
    'react/jsx-runtime': `/_piru/runtime/${v}/react-jsx-runtime.js`,
    'react-dom': `/_piru/runtime/${v}/react-dom.js`,
    'react-dom/client': `/_piru/runtime/${v}/react-dom-client.js`,
    'motion/react': `/_piru/runtime/${v}/motion.js`,
    'react-router': `/_piru/runtime/${v}/react-router.js`,
    '@piru/tienda': `/_piru/runtime/${v}/sdk.js`,
})

export function esManifiesto(v: unknown): v is ManifiestoSitio {
    if (!v || typeof v !== 'object') return false
    const m = v as Record<string, unknown>
    return (
        m.status === 'activo' &&
        Number.isSafeInteger(m.restauranteId) &&
        typeof m.username === 'string' &&
        typeof m.runtime === 'string' &&
        /^v\d+$/.test(m.runtime) &&
        typeof m.bundle === 'string' &&
        /^[a-f0-9]{8,64}$/.test(m.bundle) &&
        (m.css === null || (typeof m.css === 'string' && /^[a-f0-9]{8,64}$/.test(m.css))) &&
        !!m.meta &&
        typeof m.meta === 'object'
    )
}

const escaparHtml = (valor: string) =>
    valor.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** JSON seguro dentro de `<script>`: sin `</script>` ni comentarios HTML. */
const jsonEnHtml = (valor: unknown) => JSON.stringify(valor).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')

const colorSeguro = (valor: string | null | undefined, porDefecto: string) =>
    valor && /^#[0-9a-f]{3,8}$/i.test(valor) ? valor : porDefecto

export function cspSitio(nonce: string, env: EnvPaginas): string {
    const api = env.API_ORIGIN || 'https://api.piru.app'
    const imagenes = env.IMAGES_ORIGIN || 'https://images.piru.app'
    return [
        "default-src 'none'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        `img-src 'self' data: blob: ${imagenes}`,
        "media-src 'self' blob:",
        // 'self': el beacon de Cloudflare (`/cdn-cgi/rum`) va al mismo origen, que controla el Worker.
        `connect-src 'self' ${api}`,
        'frame-src https://www.google.com https://maps.google.com',
        "worker-src 'none'",
        "manifest-src 'self'",
        "form-action 'none'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
    ].join('; ')
}

export const CABECERAS_SEGURIDAD = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
}

export function htmlSitio(m: ManifiestoSitio, opciones: { slug: string; origin: string; nonce: string; api: string }): string {
    const { slug, origin, nonce } = opciones
    const v = m.runtime
    const titulo = escaparHtml(m.meta.titulo || m.username)
    const descripcion = escaparHtml(m.meta.descripcion || '')
    const fondo = colorSeguro(m.meta.loadingBackground, '#ffffff')
    const tema = colorSeguro(m.meta.themeColor, fondo)
    const tiendaEstandar = `https://my.piru.app/${encodeURIComponent(m.username)}`
    const absoluta = (path: string | null) => (path && /^\/_piru\/a\/[a-f0-9]{16,64}\.[a-z0-9]+$/.test(path) ? `${origin}${path}` : null)
    const og = absoluta(m.meta.ogImage)
    const icono = absoluta(m.meta.icono)
    const config = {
        restauranteId: m.restauranteId,
        username: m.username,
        slug,
        api: opciones.api,
        tiendaEstandar,
    }
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${titulo}</title>
<meta name="description" content="${descripcion}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escaparHtml(origin)}/">
<meta property="og:title" content="${titulo}">
<meta property="og:description" content="${descripcion}">
${og ? `<meta property="og:image" content="${escaparHtml(og)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${escaparHtml(og)}">` : '<meta name="twitter:card" content="summary">'}
${icono ? `<link rel="icon" href="${escaparHtml(icono)}"><link rel="apple-touch-icon" href="${escaparHtml(icono)}">` : ''}
<meta name="theme-color" content="${tema}">
<style>html,body{background:${fondo};margin:0}</style>
${m.css ? `<link rel="stylesheet" href="/_piru/s/${m.css}.css">` : ''}
<script type="importmap" nonce="${nonce}">${jsonEnHtml({ imports: IMPORTS_RUNTIME(v) })}</script>
<link rel="modulepreload" href="/_piru/runtime/${v}/react.js">
<link rel="modulepreload" href="/_piru/runtime/${v}/sdk.js">
<link rel="modulepreload" href="/_piru/s/${m.bundle}.js">
<script id="piru-config" type="application/json">${jsonEnHtml(config)}</script>
</head>
<body>
<div id="root"></div>
<noscript>Pedí desde <a href="${escaparHtml(tiendaEstandar)}">la tienda</a>.</noscript>
<script type="module" src="/_piru/runtime/${v}/boot.js" data-page="/_piru/s/${m.bundle}.js" nonce="${nonce}"></script>
</body>
</html>`
}

function respuestaR2(objeto: ObjetoR2, tipo: string, extra: Record<string, string> = {}): Response {
    return new Response(objeto.body, {
        headers: {
            'Content-Type': tipo,
            'Cache-Control': INMUTABLE,
            ...CABECERAS_SEGURIDAD,
            ...extra,
        },
    })
}

const noEncontrado = () => new Response('No encontrado', { status: 404, headers: CABECERAS_SEGURIDAD })

/** Archivos del runtime: `/_piru/runtime/v1/react.js`. Se sirven aunque el sitio no esté activo. */
async function servirRuntime(path: string, env: EnvPaginas): Promise<Response | null> {
    const m = path.match(/^\/_piru\/runtime\/(v\d+)\/([a-z-]+)\.js$/)
    if (!m) return null
    if (!env.SITIOS || !MODULOS_RUNTIME.has(m[2])) return noEncontrado()
    const objeto = await env.SITIOS.get(`runtime/${m[1]}/${m[2]}.js`)
    return objeto ? respuestaR2(objeto, TIPOS.js) : noEncontrado()
}

/**
 * Bundles y assets del sitio. Content-addressed: se sirven por slug aunque el sitio esté
 * deshabilitado, para no romper un HTML cacheado. El hash no se adivina y no hay listado.
 */
async function servirArchivoSitio(path: string, slug: string, env: EnvPaginas): Promise<Response | null> {
    const bundle = path.match(/^\/_piru\/s\/([a-f0-9]{8,64})\.(js|css)$/)
    const asset = path.match(/^\/_piru\/a\/([a-f0-9]{16,64})\.(png|jpg|jpeg|webp|avif|gif|svg|woff2|mp4|webm)$/)
    if (!bundle && !asset) return null
    if (!env.SITIOS) return noEncontrado()
    const [, hash, ext] = (bundle ?? asset)!
    const key = bundle ? `sitios/${slug}/s/${hash}.${ext}` : `sitios/${slug}/a/${hash}.${ext}`
    const objeto = await env.SITIOS.get(key)
    if (!objeto) return noEncontrado()
    // Un SVG abierto directo podría ejecutar scripts: se sirve sin permisos.
    const extra: Record<string, string> =
        ext === 'svg' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" } : {}
    return respuestaR2(objeto, TIPOS[ext], extra)
}

/** Rutas de plataforma: muestran datos del comprador y viven en `my.piru.app`, otro origen. */
export function redireccionPlataforma(url: URL, username: string): string | null {
    const path = url.pathname
    const my = 'https://my.piru.app'
    if (url.searchParams.has('demo')) return `${my}/${encodeURIComponent(username)}?demo`
    if (/^\/(pedido|mesa|sala|pago)(\/|$)/.test(path)) return `${my}${path}${url.search}`
    if (path === '/checkout' || path === '/checkout/') return `${my}/${encodeURIComponent(username)}/checkout${url.search}`
    if (path === '/success' || path === '/success/') return `${my}/${encodeURIComponent(username)}/success${url.search}`
    return null
}

export async function leerManifiesto(slug: string, env: EnvPaginas): Promise<ManifiestoSitio | null> {
    if (!env.SITIOS_KV) return null
    try {
        const valor = await env.SITIOS_KV.get(`sitio:${slug}`, { type: 'json', cacheTtl: 30 })
        return esManifiesto(valor) ? valor : null
    } catch {
        // Si KV falla, el subdominio cae en la tienda estándar: nunca queda sin tienda.
        return null
    }
}

function nonce(): string {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '')
}

/**
 * Atiende el pedido si corresponde a Páginas; `null` para seguir con el proxy de la tienda estándar.
 */
export async function atenderPaginas(request: Request, slug: string, env: EnvPaginas): Promise<Response | null> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/_piru/')) {
        if (request.method !== 'GET' && request.method !== 'HEAD')
            return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
        return (await servirRuntime(url.pathname, env)) ?? (await servirArchivoSitio(url.pathname, slug, env)) ?? noEncontrado()
    }

    const manifiesto = await leerManifiesto(slug, env)
    if (!manifiesto) return null
    if (request.method !== 'GET' && request.method !== 'HEAD')
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })

    const destino = redireccionPlataforma(url, manifiesto.username)
    if (destino) return new Response(null, { status: 302, headers: { Location: destino, 'Cache-Control': 'no-store' } })
    if (url.pathname === '/favicon.ico') {
        return manifiesto.meta.icono
            ? new Response(null, { status: 302, headers: { Location: manifiesto.meta.icono, 'Cache-Control': 'public, max-age=3600' } })
            : noEncontrado()
    }
    if (url.pathname === '/robots.txt')
        return new Response('User-agent: *\nAllow: /\n', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
        })

    const n = nonce()
    const api = `${env.API_ORIGIN || 'https://api.piru.app'}/api`
    return new Response(request.method === 'HEAD' ? null : htmlSitio(manifiesto, { slug, origin: url.origin, nonce: n, api }), {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Content-Security-Policy': cspSitio(n, env),
            ...CABECERAS_SEGURIDAD,
        },
    })
}
