import { useMemo } from 'react'
import { BASES_PLANTILLA, resolverPlantilla, type PlantillaId } from './plantillas'
import { fotosDeProducto } from '@/lib/fotosProducto'
import { armarPaleta, colorHex, type ColoresRestaurante, type ColoresTienda } from './paletaTienda'
export { armarPaleta, contraste, luminancia, mezclar } from './paletaTienda'
export type { Paleta } from './paletaTienda'

// La tienda personalizada de cada local (docs/TIENDA_PERSONALIZADA.md). Todo es opcional: con sólo
// el nombre y el logo la tienda se arma igual, y cada dato que se cargue la va completando.

export type TiendaConfig = {
    plantilla?: PlantillaId
    colores?: ColoresTienda
    fuentes?: { titulos?: string; cuerpo?: string; cssUrl?: string; pesoTitulos?: number }
    productoDestacadoId?: number
    frase?: string
    bajada?: string
    portadaUrl?: string
    galeria?: string[]
    cinta?: string[]
    historia?: { titulo?: string; texto?: string }
    instagram?: string
    whatsapp?: string
}

export type Fuentes = { titulos: string; cuerpo: string; pesoTitulos: number; hojas: string[] }

/** Lo que la tienda lee del local, además de `tienda`. */
export type RestauranteTienda = ColoresRestaurante & {
    username?: string | null
    direccion?: string | null
    direccionTexto?: string | null
    nombre?: string | null
    imagenUrl?: string | null
    imagenLightUrl?: string | null
    tienda?: unknown
}

const FUENTE_BASE = "'Bricolage Grotesque'"
const PILA_SANS = 'ui-sans-serif, system-ui, sans-serif'

// ── Lectura defensiva ──

const texto = (v: unknown, max: number) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined
const enlace = (v: unknown) =>
    typeof v === 'string' && /^(https:\/\/|\/(?!\/))/i.test(v.trim()) ? v.trim() : undefined
const familia = (v: unknown) => {
    const s = texto(v, 60)
    return s && /^[\p{L}\p{N} ]+$/u.test(s) ? s : undefined
}

/** Acepta el objeto o su JSON y descarta lo que no sirve: un dato malo no rompe la tienda. */
export function leerTienda(bruto: unknown): TiendaConfig {
    let v = bruto
    if (typeof v === 'string') {
        try {
            v = JSON.parse(v)
        } catch {
            return {}
        }
    }
    if (!v || typeof v !== 'object') return {}
    type Objeto = Record<string, unknown>
    const objeto = (x: unknown): Objeto => (x && typeof x === 'object' ? (x as Objeto) : {})
    const t = v as Objeto
    const c = objeto(t.colores)
    const f = objeto(t.fuentes)
    const h = objeto(t.historia)
    const peso = Number(f.pesoTitulos)
    const historia = { titulo: texto(h.titulo, 80), texto: texto(h.texto, 1200) }
    return {
        plantilla: resolverPlantilla(t.plantilla),
        colores: {
            fondo: colorHex(c.fondo),
            texto: colorHex(c.texto),
            acento: colorHex(c.acento),
            superficie: colorHex(c.superficie),
        },
        fuentes: {
            titulos: familia(f.titulos),
            cuerpo: familia(f.cuerpo),
            cssUrl: typeof f.cssUrl === 'string' && /^https:\/\//.test(f.cssUrl) ? f.cssUrl : undefined,
            pesoTitulos: Number.isFinite(peso) && peso >= 100 && peso <= 900 ? peso : undefined,
        },
        productoDestacadoId: typeof t.productoDestacadoId === 'number' && Number.isSafeInteger(t.productoDestacadoId) && t.productoDestacadoId > 0 ? t.productoDestacadoId : undefined,
        frase: texto(t.frase, 90),
        bajada: texto(t.bajada, 220),
        portadaUrl: enlace(t.portadaUrl),
        galeria: Array.isArray(t.galeria)
            ? t.galeria
                  .map(enlace)
                  .filter((u): u is string => !!u)
                  .slice(0, 8)
            : [],
        cinta: Array.isArray(t.cinta)
            ? t.cinta
                  .map((p: unknown) => texto(p, 40))
                  .filter((p): p is string => !!p)
                  .slice(0, 10)
            : [],
        historia: historia.texto ? historia : undefined,
        instagram: texto(t.instagram, 60)
            ?.replace(/^@/, '')
            .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
            .replace(/\/$/, ''),
        whatsapp: texto(t.whatsapp, 30)?.replace(/\D/g, '') || undefined,
    }
}

/** Pesos que se piden a Google Fonts para las familias que ofrece el editor (admin/src/lib/tiendaPresets.ts).
 * Pedir un peso inexistente invalida la hoja entera: las demás familias se piden sólo en su regular. */
const PESOS_FUENTE: Record<string, string> = {
    Lora: ':wght@400;500;600;700',
    // Variable completa: Artesanal usa la itálica y los ejes SOFT y WONK en los títulos.
    Fraunces: ':ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1',
    'DM Sans': ':wght@400;500;600;700;800',
    Unbounded: ':wght@400;500;600;700;800',
    Manrope: ':wght@400;500;600;700;800',
    'Nunito Sans': ':wght@400;500;600;700;800',
    Archivo: ':wght@400;500;600;700;800',
    Barlow: ':wght@400;500;600;700',
    'Libre Franklin': ':wght@400;500;600;700',
    'Playfair Display': ':wght@400;600;700;800;900',
    'Source Sans 3': ':wght@400;600;700',
    'Cormorant Garamond': ':wght@400;500;600;700',
    Inter: ':wght@400;500;600;700;800',
    Outfit: ':wght@400;500;600;700;800',
    Fredoka: ':wght@400;500;600;700',
    Nunito: ':wght@400;600;700;800',
    Rubik: ':wght@400;500;600;700;800',
    Syne: ':wght@400;600;700;800',
    'Work Sans': ':wght@400;500;600;700',
    'Zilla Slab': ':wght@400;500;600;700',
}

export function armarFuentes(tienda: TiendaConfig): Fuentes {
    const base = BASES_PLANTILLA[resolverPlantilla(tienda.plantilla)]
    const f = {
        ...tienda.fuentes,
        titulos: tienda.fuentes?.titulos ?? base.titulos,
        cuerpo: tienda.fuentes?.cuerpo ?? base.cuerpo,
    }
    const hojas: string[] = []
    if (f.cssUrl) hojas.push(f.cssUrl)
    else {
        // Sin hoja propia se pide la familia a Google Fonts en su peso regular, que existe siempre.
        for (const nombre of [f.titulos, f.cuerpo]) {
            if (nombre && nombre !== 'Bricolage Grotesque') {
                const pesos = PESOS_FUENTE[nombre] ?? ''
                hojas.push(
                    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nombre).replace(/%20/g, '+')}${pesos}&display=swap`
                )
            }
        }
    }
    const titulos = f.titulos ? `'${f.titulos}'` : FUENTE_BASE
    const cuerpo = f.cuerpo ? `'${f.cuerpo}'` : FUENTE_BASE
    return {
        titulos:
            resolverPlantilla(tienda.plantilla) === 'artesanal'
                ? `${titulos}, Georgia, serif`
                : `${titulos}, ${FUENTE_BASE}, ${PILA_SANS}`,
        cuerpo: `${cuerpo}, ${PILA_SANS}`,
        // Las fuentes de títulos suelen tener un solo peso: sin dato, se usa el regular salvo en la de base.
        pesoTitulos:
            f.pesoTitulos ??
            (tienda.fuentes?.titulos ? (f.titulos === 'Bricolage Grotesque' ? 800 : 400) : base.peso),
        hojas: [...new Set(hojas)],
    }
}

/** El logo que se lee sobre un fondo oscuro (`imagenUrl`) o claro (`imagenLightUrl`, si existe). */
export const logoPara = (restaurante: RestauranteTienda | null | undefined, sobreOscuro: boolean) =>
    (sobreOscuro
        ? restaurante?.imagenUrl || restaurante?.imagenLightUrl
        : restaurante?.imagenLightUrl || restaurante?.imagenUrl) || null

// ── Caché por local: la pantalla de carga y la sala grupal se ven con la identidad del local. ──

const claveCache = (username: string) => `tienda_${username}`

export function guardarTiendaCache(
    username: string | null | undefined,
    restaurante: RestauranteTienda | null | undefined
) {
    if (!username || !restaurante) return
    try {
        const {
            nombre,
            direccion,
            direccionTexto,
            imagenUrl,
            imagenLightUrl,
            colorPrimario,
            colorSecundario,
            usarColorUnico,
            tienda,
        } = restaurante
        sessionStorage.setItem(
            claveCache(username),
            JSON.stringify({
                username,
                nombre,
                direccion,
                direccionTexto,
                imagenUrl,
                imagenLightUrl,
                colorPrimario,
                colorSecundario,
                usarColorUnico,
                tienda,
            })
        )
    } catch {
        /* storage bloqueado */
    }
}

export function leerTiendaCache(username: string | null | undefined): RestauranteTienda | null {
    if (!username) return null
    try {
        const v = JSON.parse(sessionStorage.getItem(claveCache(username)) || 'null')
        return v && typeof v === 'object' ? v : null
    } catch {
        return null
    }
}

export function useTienda(restaurante: RestauranteTienda | null | undefined) {
    const tiendaBruta = restaurante?.tienda
    const tienda = useMemo(() => leerTienda(tiendaBruta), [tiendaBruta])
    const paleta = useMemo(
        () => armarPaleta(restaurante, tienda),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tienda, restaurante?.colorPrimario, restaurante?.colorSecundario, restaurante?.usarColorUnico]
    )
    const fuentes = useMemo(() => armarFuentes(tienda), [tienda])
    return { tienda, paleta, fuentes }
}

// ── Carta ──

/** Precio sin decimales cuando es entero ($2.000) y con dos sólo si los tiene. */
export function formatoPesos(valor: number | string): string {
    const n = Number(valor)
    if (!Number.isFinite(n)) return '$0'
    const conCentavos = Math.round(n * 100) % 100 !== 0
    return `$${n.toLocaleString('es-AR', { minimumFractionDigits: conCentavos ? 2 : 0, maximumFractionDigits: conCentavos ? 2 : 0 })}`
}

export function precioProducto(producto: { precio?: number | string; descuento?: number | null }) {
    const original = Number(producto.precio || 0)
    const descuento = Number(producto.descuento || 0)
    return { original, descuento, final: descuento > 0 ? original * (1 - descuento / 100) : original }
}

/** Orden en que se ve una categoría: primero los productos con foto (la grilla) y después los de
 * sólo texto (la lista). El detalle navega en este mismo orden. */
export function ordenVisual<T extends { imagenUrl?: string | null; imagenesExtra?: string[] | null }>(
    productos: T[]
): { conFoto: T[]; sinFoto: T[] } {
    const conFoto: T[] = []
    const sinFoto: T[] = []
    for (const p of productos) (fotosDeProducto(p).length > 0 ? conFoto : sinFoto).push(p)
    return { conFoto, sinFoto }
}

export type Turno = { diaSemana: number; horaApertura: string; horaCierre: string }

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const SEMANA = [1, 2, 3, 4, 5, 6, 0]
const minutos = (hora: string) => {
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
}
export const hhmm = (hora: string) => hora.slice(0, 5)

export const turnosDelDia = (horarios: Turno[], dia: number) =>
    horarios
        .filter((h) => h.diaSemana === dia)
        .sort((a, b) => minutos(a.horaApertura) - minutos(b.horaApertura))
        .map((h) => `${hhmm(h.horaApertura)} – ${hhmm(h.horaCierre)}`)
        .join(' · ')

/** El estado del local en una frase: "Abierto · hasta las 23:45" o "Cerrado · abrimos hoy a las 19:45". */
export function textoEstado(horarios: Turno[], estado: { abierto: boolean; proximaApertura: string | null }) {
    if (!estado.abierto)
        return estado.proximaApertura ? `Cerrado · abrimos ${estado.proximaApertura}` : 'Cerrado por ahora'
    const ahora = new Date()
    const hoy = ahora.getDay()
    const ayer = (hoy + 6) % 7
    const m = ahora.getHours() * 60 + ahora.getMinutes()
    for (const h of horarios) {
        const a = minutos(h.horaApertura)
        const c = minutos(h.horaCierre)
        const enCurso =
            c > a
                ? h.diaSemana === hoy && m >= a && m < c
                : (h.diaSemana === hoy && m >= a) || (h.diaSemana === ayer && m < c)
        if (enCurso) return `Abierto · hasta las ${hhmm(h.horaCierre)}`
    }
    return 'Abierto ahora'
}

/** Botón secundario de la tienda: contorno de la tinta, se llena al pasar. */
export const ACCESO_SECUNDARIO =
    'inline-flex h-14 max-w-full items-center gap-2 rounded-full border-[1.5px] border-foreground px-5 text-[14px] font-semibold text-foreground transition-[background-color,color,transform] duration-200 hover:bg-foreground hover:text-background active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60'
