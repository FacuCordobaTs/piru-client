/**
 * Dominios de tiendas propias: `<tienda>.piru.app`.
 *
 * Es el equivalente a `client/src/lib/event-domain.ts` de Crow, pero acá el subdominio no identifica
 * un evento: identifica la tienda pública. La tienda sigue viviendo en `my.piru.app/<username>` y el
 * subdominio es un alias de esa misma tienda. El diseño propio, si existe, se registra en
 * `src/store-sites/registry.ts`.
 *
 * Este archivo es puro: lo importa el Worker de `web/cloudflare/`, que no tiene `window`.
 */

/** Nombres de infraestructura: cada uno tiene su propio sitio y no se resuelve como tienda. */
const RESERVED = new Set([
    'www',
    'admin',
    'api',
    'mail',
    'smtp',
    'imap',
    'pop',
    'ftp',
    'cdn',
    'assets',
    'static',
    'status',
    'support',
    'docs',
    'autodiscover',
    'autoconfig',
    'dev',
    'staging',
    'my',
    'info',
    'marketing',
    'mozos',
    'interno',
    'images',
    'app',
    'panel',
    'pagos',
    'pago',
    // Páginas propias (docs/PAGINAS_PROPIAS.md): el editor y rutas de plataforma.
    'pages',
    'paginas',
    'sitios',
    'checkout',
    'blog',
    'ayuda',
    'soporte',
])

/** Mismas reglas que un label DNS: 2–63, minúsculas, números y guiones internos. */
export function isStoreSubdomain(slug: string): boolean {
    return (
        slug.length >= 2 &&
        slug.length <= 63 &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
        !RESERVED.has(slug)
    )
}

/**
 * Slug de tienda para un hostname, o `null` si no es un subdominio de tienda.
 * En desarrollo también reconoce `<tienda>.localhost` (Vite en el puerto 5173).
 */
export function storeSlugFromHostname(hostname: string): string | null {
    const host = hostname.toLowerCase()
    const suffix = host.endsWith('.localhost') ? '.localhost' : '.piru.app'
    if (!host.endsWith(suffix)) return null
    const slug = host.slice(0, -suffix.length)
    return isStoreSubdomain(slug) ? slug : null
}
