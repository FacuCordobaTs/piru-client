import { afterEach, expect, test } from 'bun:test'
import worker from '../cloudflare/store-subdomains'
import { esManifiesto, htmlSitio, redireccionPlataforma, type ManifiestoSitio } from '../cloudflare/paginas'

const originalFetch = globalThis.fetch
afterEach(() => {
    globalThis.fetch = originalFetch
})

const manifiesto: ManifiestoSitio = {
    versionId: 3,
    restauranteId: 42,
    username: 'bronx',
    runtime: 'v1',
    bundle: 'a3f9c0de11223344aabb',
    css: '4f2a00112233aabbccdd',
    meta: {
        titulo: 'Bronx </title><script>alert(1)</script>',
        descripcion: 'Hamburguesas',
        ogImage: '/_piru/a/9be1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg',
        icono: null,
        themeColor: '#161310',
        loadingBackground: '#161310',
    },
    status: 'activo',
}

const r2 = (archivos: Record<string, string>) => ({
    async get(key: string) {
        return key in archivos ? { body: new Response(archivos[key]).body!, httpMetadata: {} } : null
    },
})
const kv = (valores: Record<string, unknown>) => ({
    async get(key: string) {
        return valores[key] ?? null
    },
})
const env = (extra = {}) => ({
    CLIENT_PAGES_ORIGIN: 'https://piru-web.pages.dev',
    SITIOS: r2({
        'runtime/v1/react.js': 'export default 1',
        'sitios/bronx/s/a3f9c0de11223344aabb.js': 'export default function P(){}',
        'sitios/bronx/a/9be1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.svg': '<svg/>',
    }),
    SITIOS_KV: kv({ 'sitio:bronx': manifiesto }),
    ...extra,
})

test('sin sitio en KV sigue el proxy de la tienda estándar', async () => {
    let pedido = ''
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        pedido = String(input)
        return new Response('tienda', { headers: { 'Content-Type': 'text/plain' } })
    }) as typeof fetch
    const res = await worker.fetch(new Request('https://otra.piru.app/'), env())
    expect(await res.text()).toBe('tienda')
    expect(pedido).toBe('https://piru-web.pages.dev/')
})

test('con sitio activo devuelve el HTML con import map, CSP con nonce y metadatos escapados', async () => {
    globalThis.fetch = (async () => {
        throw new Error('no debería pedir al origen')
    }) as typeof fetch
    const res = await worker.fetch(new Request('https://bronx.piru.app/menu/interno'), env())
    const html = await res.text()
    const csp = res.headers.get('content-security-policy')!
    const nonce = csp.match(/'nonce-([^']+)'/)![1]
    expect(html).toContain(`<script type="importmap" nonce="${nonce}">`)
    expect(html).toContain('"@piru/tienda":"/_piru/runtime/v1/sdk.js"')
    expect(html).toContain('data-page="/_piru/s/a3f9c0de11223344aabb.js"')
    expect(html).toContain('href="/_piru/s/4f2a00112233aabbccdd.css"')
    expect(html).toContain('content="https://bronx.piru.app/_piru/a/9be1')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('"restauranteId":42')
    expect(csp).toContain("form-action 'none'")
    expect(csp).toContain("connect-src 'self' https://api.piru.app")
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('cache-control')).toBe('no-cache')
})

test('las rutas de plataforma van a my.piru.app', async () => {
    const casos: [string, string][] = [
        ['https://bronx.piru.app/pedido/77', 'https://my.piru.app/pedido/77'],
        ['https://bronx.piru.app/mesa/abc', 'https://my.piru.app/mesa/abc'],
        ['https://bronx.piru.app/sala/xyz', 'https://my.piru.app/sala/xyz'],
        ['https://bronx.piru.app/pago/tok', 'https://my.piru.app/pago/tok'],
        ['https://bronx.piru.app/checkout?carrito=1', 'https://my.piru.app/bronx/checkout?carrito=1'],
        ['https://bronx.piru.app/success', 'https://my.piru.app/bronx/success'],
        ['https://bronx.piru.app/?demo', 'https://my.piru.app/bronx?demo'],
    ]
    for (const [desde, hacia] of casos) {
        const res = await worker.fetch(new Request(desde), env())
        expect(res.status).toBe(302)
        expect(res.headers.get('location')).toBe(hacia)
    }
    expect(redireccionPlataforma(new URL('https://bronx.piru.app/c/promo'), 'bronx')).toBeNull()
})

test('runtime, bundles y assets salen de R2 con caché inmutable; el SVG sin permisos', async () => {
    const runtime = await worker.fetch(new Request('https://bronx.piru.app/_piru/runtime/v1/react.js'), env())
    expect(runtime.status).toBe(200)
    expect(runtime.headers.get('cache-control')).toContain('immutable')
    expect(runtime.headers.get('content-type')).toContain('javascript')
    const bundle = await worker.fetch(new Request('https://bronx.piru.app/_piru/s/a3f9c0de11223344aabb.js'), env())
    expect(await bundle.text()).toContain('function P')
    const svg = await worker.fetch(
        new Request('https://bronx.piru.app/_piru/a/9be1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.svg'),
        env()
    )
    expect(svg.headers.get('content-security-policy')).toContain("default-src 'none'")
    for (const path of ['/_piru/runtime/v1/../../secreto.js', '/_piru/runtime/v1/otro.js', '/_piru/s/XYZ.js', '/_piru/a/abc.html'])
        expect((await worker.fetch(new Request(`https://bronx.piru.app${path}`), env())).status).toBe(404)
})

test('sólo GET y HEAD; un manifiesto inválido cae en la tienda estándar', async () => {
    expect((await worker.fetch(new Request('https://bronx.piru.app/', { method: 'POST' }), env())).status).toBe(405)
    globalThis.fetch = (async () => new Response('tienda')) as typeof fetch
    const res = await worker.fetch(
        new Request('https://bronx.piru.app/'),
        env({ SITIOS_KV: kv({ 'sitio:bronx': { ...manifiesto, bundle: '../../x' } }) })
    )
    expect(await res.text()).toBe('tienda')
    expect(esManifiesto({ ...manifiesto, status: 'deshabilitado' })).toBe(false)
})

test('el HTML no deja escapar el JSON de configuración', () => {
    const html = htmlSitio({ ...manifiesto, username: 'a</script><script>x' }, { slug: 'bronx', origin: 'https://bronx.piru.app', nonce: 'n', api: 'https://api.piru.app/api' })
    expect(html).not.toContain('</script><script>x')
})
