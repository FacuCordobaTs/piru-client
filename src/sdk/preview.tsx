/**
 * Runtime de la vista previa del editor (`/_piru/runtime/v1/preview.js`). Corre dentro de un iframe
 * `sandbox="allow-scripts"` sin `allow-same-origin`: origen opaco, sin acceso a la sesión del editor.
 *
 * Protocolo (docs/PAGINAS_PROPIAS.md, §11.3): el editor crea un `MessageChannel` y manda
 * `{ tipo: 'piru-preview-init', token }` con el puerto. Por ese puerto llegan
 * `{ tipo: 'render', token, codigo, css, config, respuesta, escenario }` y vuelven
 * `{ tipo: 'listo' | 'error' | 'consola', … }`. Los mensajes sin el token se ignoran.
 */
import { createRoot, type Root } from 'react-dom/client'
import { PiruSiteRoot, crearTienda, type ConfigSitio, type DatosPreview } from '@piru/tienda'
import type { ComponentType } from 'react'

type Render = {
    tipo: 'render'
    token: string
    codigo: string
    css: string
    config: ConfigSitio
    respuesta: DatosPreview['respuesta']
    escenario: DatosPreview['escenario']
}

let puerto: MessagePort | null = null
let token: string | null = null
let raiz: Root | null = null
let urlAnterior: string | null = null

const enviar = (mensaje: Record<string, unknown>) => puerto?.postMessage({ ...mensaje, token })

for (const nivel of ['log', 'info', 'warn', 'error'] as const) {
    const original = console[nivel].bind(console)
    console[nivel] = (...args: unknown[]) => {
        original(...args)
        enviar({ tipo: 'consola', nivel, texto: args.map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : safeJson(a))).join(' ') })
    }
}
function safeJson(v: unknown) {
    try {
        return JSON.stringify(v)
    } catch {
        return String(v)
    }
}
window.addEventListener('error', (e) => enviar({ tipo: 'error', texto: e.message }))
window.addEventListener('unhandledrejection', (e) => enviar({ tipo: 'error', texto: String((e.reason as Error)?.message ?? e.reason) }))

async function render(m: Render) {
    let estilo = document.getElementById('piru-sitio-css')
    if (!estilo) {
        estilo = document.createElement('style')
        estilo.id = 'piru-sitio-css'
        document.head.appendChild(estilo)
    }
    estilo.textContent = m.css
    const url = URL.createObjectURL(new Blob([m.codigo], { type: 'text/javascript' }))
    try {
        const modulo = (await import(/* @vite-ignore */ url)) as { default?: ComponentType }
        if (typeof modulo.default !== 'function') throw new Error('page.tsx tiene que tener `export default` de un componente')
        raiz?.unmount()
        const contenedor = document.getElementById('root')!
        raiz = createRoot(contenedor)
        const tienda = crearTienda({ ...m.config, preview: true })
        raiz.render(
            <PiruSiteRoot
                tienda={tienda}
                Page={modulo.default}
                preview={{ respuesta: m.respuesta, escenario: m.escenario }}
                onError={(e) => enviar({ tipo: 'error', texto: e.message })}
            />
        )
        enviar({ tipo: 'listo' })
    } catch (e) {
        enviar({ tipo: 'error', texto: e instanceof Error ? e.message : String(e) })
    } finally {
        if (urlAnterior) URL.revokeObjectURL(urlAnterior)
        urlAnterior = url
    }
}

window.addEventListener('message', (e) => {
    const datos = e.data as { tipo?: string; token?: string } | null
    if (datos?.tipo !== 'piru-preview-init' || !e.ports[0] || typeof datos.token !== 'string' || puerto) return
    puerto = e.ports[0]
    token = datos.token
    puerto.onmessage = (ev) => {
        const m = ev.data as Render
        if (m?.token !== token || m.tipo !== 'render') return
        void render(m)
    }
    enviar({ tipo: 'preparado' })
})
