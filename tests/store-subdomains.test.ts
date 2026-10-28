import { afterEach, expect, test } from 'bun:test'
import worker from '../cloudflare/store-subdomains'

const originalFetch = globalThis.fetch
afterEach(() => {
    globalThis.fetch = originalFetch
})
const env = { CLIENT_PAGES_ORIGIN: 'https://piru-web.pages.dev' }

test('el proxy conserva path y query, no reenvía credenciales y devuelve la redirección al subdominio', async () => {
    let forwarded: URL | undefined
    let forwardedHeaders: Headers | undefined
    globalThis.fetch = (async (input, init) => {
        forwarded = new URL(String(input))
        forwardedHeaders = new Headers(init?.headers)
        return new Response(null, {
            status: 302,
            headers: { Location: 'https://piru-web.pages.dev/success?pedido=7', 'Set-Cookie': 'privada=x' },
        })
    }) as typeof fetch

    const response = await worker.fetch(
        new Request('https://burgers10.piru.app/success?pedido=7', {
            headers: { Cookie: 'privada=x', Authorization: 'Bearer privado' },
        }),
        env,
    )

    expect(forwarded?.toString()).toBe('https://piru-web.pages.dev/success?pedido=7')
    expect(forwardedHeaders?.has('cookie')).toBe(false)
    expect(forwardedHeaders?.has('authorization')).toBe(false)
    expect(response.headers.get('location')).toBe('https://burgers10.piru.app/success?pedido=7')
    expect(response.headers.has('set-cookie')).toBe(false)
})

test('no acepta escrituras ni orígenes inválidos', async () => {
    globalThis.fetch = (async () => {
        throw new Error('no debería pedir al origen')
    }) as typeof fetch

    expect((await worker.fetch(new Request('https://burgers10.piru.app', { method: 'POST' }), env)).status).toBe(405)
    for (const origin of [
        'https://piru.app',
        'https://evil.com',
        'http://piru-web.pages.dev',
        'https://piru-web.pages.dev/ruta',
    ]) {
        expect(
            (await worker.fetch(new Request('https://burgers10.piru.app'), { CLIENT_PAGES_ORIGIN: origin })).status,
        ).toBe(503)
    }
})

test('la infraestructura sigue su origen propio', async () => {
    globalThis.fetch = (async (input) => {
        expect((input as Request).url).toBe('https://api.piru.app/public/restaurante/burgers10')
        return new Response('api')
    }) as typeof fetch
    const response = await worker.fetch(
        new Request('https://api.piru.app/public/restaurante/burgers10'),
        env,
    )
    expect(await response.text()).toBe('api')
})

test('una tienda registrada recibe su título, ícono y vista previa', async () => {
    globalThis.fetch = (async () =>
        new Response(
            '<html><head><link rel="icon" type="image/png" href="/logopiru.jpeg" /><link rel="apple-touch-icon" href="/logopiru.jpeg" /><meta name="description" content="Piru" /><meta property="og:title" content="Piru" /><meta property="og:image" content="/logopiru.jpeg" /><meta name="theme-color" content="#f97316" /><title>Piru - Menú Digital</title></head><body></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        )) as typeof fetch

    const html = await (await worker.fetch(new Request('https://burgers10.piru.app/'), env)).text()
    expect(html).toContain('<title>Burgers 10 · Hamburguesas a la parrilla</title>')
    expect(html).toContain('href="https://burgers10.piru.app/sites/burgers10/icon.png"')
    expect(html).toContain('href="https://burgers10.piru.app/sites/burgers10/apple-touch-icon.png"')
    expect(html).toContain('content="https://burgers10.piru.app/sites/burgers10/og.jpg"')
    expect(html).toContain('content="#161310"')
    expect(html).toContain('content="https://burgers10.piru.app/"')
    expect(html).not.toContain('/logopiru.jpeg')
})

test('un subdominio sin diseño registrado conserva el HTML de Piru', async () => {
    globalThis.fetch = (async () =>
        new Response('<html><head><title>Piru - Menú Digital</title></head><body></body></html>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })) as typeof fetch

    const html = await (await worker.fetch(new Request('https://otratienda.piru.app/'), env)).text()
    expect(html).toContain('<title>Piru - Menú Digital</title>')
    expect(html).not.toContain('Burgers 10')
})
