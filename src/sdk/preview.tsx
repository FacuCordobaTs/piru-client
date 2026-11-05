/**
 * Runtime de la vista previa del editor (`/_piru/runtime/v1/preview.js`). Corre dentro de un iframe
 * `sandbox="allow-scripts"` sin `allow-same-origin`: origen opaco, sin acceso a la sesión del editor.
 *
 * Protocolo (docs/PAGINAS_PROPIAS.md, §11.3): el editor crea un `MessageChannel` y manda
 * `{ tipo: 'piru-preview-init', token }` con el puerto. Por ese puerto llegan
 * `{ tipo: 'render', token, codigo, css, config, respuesta, escenario }` y vuelven
 * `{ tipo: 'listo' | 'error' | 'consola', … }`. Los mensajes sin el token se ignoran.
 *
 * El editor visual suma (docs/PLAN_PAGINAS.md, §6.2):
 * - `{ tipo: 'contenido', contenido }`: el `CONTENIDO` nuevo sin recompilar. El editor compila
 *   `contenido.ts` con un setter (`__piruContenidoVivo`); se vuelve a dibujar la misma página, sin
 *   perder el carrito ni el scroll. Responde `{ tipo: 'contenido-aplicado', ok }`.
 * - `{ tipo: 'editor', activo, nombres }`: modo selección. Al pasar el mouse se marca la sección
 *   (`data-piru-seccion`), al tocarla vuelve `{ tipo: 'seleccionar', id }` y el doble clic en un
 *   texto con `data-piru-prop` lo edita en el lugar y vuelve `{ tipo: 'editar-texto', id, prop, valor }`.
 * - `{ tipo: 'seleccion', id, desplazar }`: marca la sección elegida en la lista (y la muestra).
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
/** Lo último que se montó: para volver a dibujar con otro `CONTENIDO` sin recargar los datos. */
let montado: { tienda: ReturnType<typeof crearTienda>; Page: ComponentType; preview: DatosPreview } | null = null

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
        montado = { tienda, Page: modulo.default, preview: { respuesta: m.respuesta, escenario: m.escenario } }
        dibujar()
        enviar({ tipo: 'listo' })
    } catch (e) {
        enviar({ tipo: 'error', texto: e instanceof Error ? e.message : String(e) })
    } finally {
        if (urlAnterior) URL.revokeObjectURL(urlAnterior)
        urlAnterior = url
    }
}

function dibujar() {
    if (!raiz || !montado) return
    raiz.render(
        <PiruSiteRoot
            tienda={montado.tienda}
            Page={montado.Page}
            preview={montado.preview}
            onError={(e) => enviar({ tipo: 'error', texto: e.message })}
        />
    )
}

/** Cambia `CONTENIDO` en el módulo ya cargado (lo expone la compilación del editor) y redibuja. */
function aplicarContenido(contenido: unknown) {
    const vivo = (window as unknown as { __piruContenidoVivo?: (c: unknown) => void }).__piruContenidoVivo
    if (!montado || typeof vivo !== 'function') return enviar({ tipo: 'contenido-aplicado', ok: false })
    vivo(contenido)
    dibujar()
    enviar({ tipo: 'contenido-aplicado', ok: true })
}

// ── Editor visual: selección, marcas y edición en el lugar ──

const editor = { activo: false, nombres: {} as Record<string, string>, seleccion: null as string | null, hover: null as string | null }
let marcas: { hover: HTMLDivElement; seleccion: HTMLDivElement } | null = null
let cuadro = 0

const CSS_EDITOR = `
html[data-piru-editor] [data-piru-seccion] { cursor: pointer; }
html[data-piru-editor] [data-piru-seccion] [data-piru-prop]:hover { outline: 1.5px dashed rgba(255,122,0,.85); outline-offset: 3px; cursor: text; }
[data-piru-editando] { outline: 2px solid #ff7a00 !important; outline-offset: 4px; cursor: text !important; }
.piru-marca { position: fixed; pointer-events: none; z-index: 2147483646; box-sizing: border-box; border-radius: 4px; display: none; }
.piru-marca[data-tipo="hover"] { border: 1.5px dashed rgba(255,122,0,.9); }
.piru-marca[data-tipo="seleccion"] { border: 2px solid #ff7a00; box-shadow: 0 0 0 9999px rgba(25,21,18,.04) inset; }
.piru-marca span { position: absolute; left: -2px; top: -24px; padding: 3px 8px; border-radius: 6px 6px 6px 0; background: #ff7a00; color: #fff; font: 600 11.5px/1.3 system-ui, sans-serif; white-space: nowrap; }
.piru-marca[data-tipo="hover"] span { background: #191512; }
.piru-marca[data-adentro] span { top: 4px; left: 4px; border-radius: 6px; }
`

function crearMarcas() {
    if (marcas) return marcas
    const estilo = document.createElement('style')
    estilo.textContent = CSS_EDITOR
    document.head.appendChild(estilo)
    const crear = (tipo: string) => {
        const div = document.createElement('div')
        div.className = 'piru-marca'
        div.dataset.tipo = tipo
        div.appendChild(document.createElement('span'))
        document.body.appendChild(div)
        return div
    }
    marcas = { hover: crear('hover'), seleccion: crear('seleccion') }
    return marcas
}

const elementoDe = (id: string | null) => (id ? document.querySelector<HTMLElement>(`[data-piru-seccion="${CSS.escape(id)}"]`) : null)

function ubicar(marca: HTMLDivElement, id: string | null) {
    const el = elementoDe(id)
    const caja = el?.getBoundingClientRect()
    if (!el || !caja || caja.height === 0) {
        marca.style.display = 'none'
        return
    }
    marca.style.display = 'block'
    marca.style.top = `${caja.top}px`
    marca.style.left = `${Math.max(0, caja.left)}px`
    marca.style.width = `${Math.min(caja.width, window.innerWidth)}px`
    marca.style.height = `${caja.height}px`
    marca.toggleAttribute('data-adentro', caja.top < 26)
    marca.firstElementChild!.textContent = editor.nombres[id!] ?? el.dataset.piruTipo ?? ''
}

function cuadroEditor() {
    if (!marcas) return
    ubicar(marcas.seleccion, editor.activo ? editor.seleccion : null)
    ubicar(marcas.hover, editor.activo && editor.hover !== editor.seleccion ? editor.hover : null)
    cuadro = editor.activo ? requestAnimationFrame(cuadroEditor) : 0
}

const seccionDe = (objetivo: EventTarget | null) =>
    objetivo instanceof Element ? objetivo.closest<HTMLElement>('[data-piru-seccion]') : null

function alMover(e: MouseEvent) {
    editor.hover = seccionDe(e.target)?.dataset.piruSeccion ?? null
}

function alTocar(e: MouseEvent) {
    if (e.target instanceof Element && e.target.closest('[data-piru-editando]')) return
    const seccion = seccionDe(e.target)
    if (!seccion) return
    e.preventDefault()
    e.stopPropagation()
    editor.seleccion = seccion.dataset.piruSeccion ?? null
    enviar({ tipo: 'seleccionar', id: editor.seleccion })
}

function alDobleClic(e: MouseEvent) {
    const objetivo = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-piru-prop]') : null
    const seccion = seccionDe(objetivo)
    if (!objetivo || !seccion || objetivo.hasAttribute('data-piru-editando')) return
    e.preventDefault()
    e.stopPropagation()
    editarEnElLugar(objetivo, seccion.dataset.piruSeccion!, objetivo.dataset.piruProp!)
}

const limpiarTexto = (texto: string, multilinea: boolean) =>
    multilinea
        ? texto
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
              .join('\n')
        : texto.replace(/\s+/g, ' ').trim()

/**
 * Edición en el lugar: el texto pasa a `contenteditable` y, al salir, se devuelven los nodos que
 * dibujó React (así React sigue siendo dueño del DOM) y se manda el valor nuevo al editor.
 */
function editarEnElLugar(el: HTMLElement, id: string, prop: string) {
    const multilinea = el.hasAttribute('data-piru-multilinea')
    const originales = Array.from(el.childNodes)
    // El navegador puede vaciar los nodos de texto de React al escribir: se guarda su texto también.
    const textos: [Text, string][] = []
    const caminante = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = caminante.nextNode(); n; n = caminante.nextNode()) textos.push([n as Text, (n as Text).data])
    const antes = limpiarTexto(multilinea ? el.innerText : (el.textContent ?? ''), multilinea)
    el.setAttribute('data-piru-editando', '')
    try {
        el.contentEditable = 'plaintext-only'
    } catch {
        el.contentEditable = 'true'
    }
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true'
    el.focus()
    const rango = document.createRange()
    rango.selectNodeContents(el)
    const seleccion = window.getSelection()
    seleccion?.removeAllRanges()
    seleccion?.addRange(rango)
    let terminado = false
    const terminar = (guardar: boolean) => {
        if (terminado) return
        terminado = true
        const valor = limpiarTexto(multilinea ? el.innerText : (el.textContent ?? ''), multilinea)
        el.removeEventListener('keydown', alTeclear)
        el.removeEventListener('blur', alSalir)
        el.removeEventListener('paste', alPegar)
        el.removeAttribute('contenteditable')
        el.removeAttribute('data-piru-editando')
        el.replaceChildren(...originales)
        for (const [nodo, texto] of textos) nodo.data = texto
        if (guardar && valor !== antes) enviar({ tipo: 'editar-texto', id, prop, valor })
    }
    const alTeclear = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            terminar(false)
        } else if (e.key === 'Enter' && (!multilinea || e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            terminar(true)
        }
    }
    const alSalir = () => terminar(true)
    const alPegar = (e: ClipboardEvent) => {
        if (el.contentEditable === 'plaintext-only') return
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData?.getData('text/plain') ?? '')
    }
    el.addEventListener('keydown', alTeclear)
    el.addEventListener('blur', alSalir)
    el.addEventListener('paste', alPegar)
}

function modoEditor(activo: boolean, nombres: Record<string, string>) {
    editor.nombres = nombres
    if (activo === editor.activo) return
    editor.activo = activo
    crearMarcas()
    document.documentElement.toggleAttribute('data-piru-editor', activo)
    if (activo) {
        document.addEventListener('mousemove', alMover, { passive: true })
        document.addEventListener('click', alTocar, true)
        document.addEventListener('dblclick', alDobleClic, true)
    } else {
        document.removeEventListener('mousemove', alMover)
        document.removeEventListener('click', alTocar, true)
        document.removeEventListener('dblclick', alDobleClic, true)
    }
    if (activo && !cuadro) cuadro = requestAnimationFrame(cuadroEditor)
    if (!activo) {
        editor.hover = null
        cuadroEditor()
    }
}
document.addEventListener('mouseleave', () => (editor.hover = null))

function seleccionar(id: string | null, desplazar: boolean) {
    editor.seleccion = id
    if (desplazar) elementoDe(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (!cuadro) cuadroEditor()
}

type MensajeEditor =
    | Render
    | { tipo: 'contenido'; token: string; contenido: unknown }
    | { tipo: 'editor'; token: string; activo: boolean; nombres?: Record<string, string> }
    | { tipo: 'seleccion'; token: string; id: string | null; desplazar?: boolean }

window.addEventListener('message', (e) => {
    const datos = e.data as { tipo?: string; token?: string } | null
    if (datos?.tipo !== 'piru-preview-init' || !e.ports[0] || typeof datos.token !== 'string' || puerto) return
    puerto = e.ports[0]
    token = datos.token
    puerto.onmessage = (ev) => {
        const m = ev.data as MensajeEditor
        if (m?.token !== token) return
        if (m.tipo === 'render') void render(m)
        else if (m.tipo === 'contenido') aplicarContenido(m.contenido)
        else if (m.tipo === 'editor') modoEditor(m.activo === true, m.nombres ?? {})
        else if (m.tipo === 'seleccion') seleccionar(typeof m.id === 'string' ? m.id : null, m.desplazar === true)
    }
    enviar({ tipo: 'preparado' })
})
