import { BASES_PLANTILLA, resolverPlantilla, type PlantillaId } from './plantillas'

export type ColoresTienda = { fondo?: string; texto?: string; acento?: string; superficie?: string }
export type ColoresRestaurante = {
    colorPrimario?: string | null
    colorSecundario?: string | null
    usarColorUnico?: boolean | null
}
export type Paleta = {
    fondo: string
    texto: string
    acento: string
    acentoTexto: string
    acentoLegible: string
    marca: string
    marcaTexto: string
    complemento: string
    complementoTexto: string
    superficie: string
    suave: string
    apagado: string
    linea: string
    oscuro: boolean
}

const TINTA_CLARA = '#fbf8f2'
const TINTA_OSCURA = '#17130f'
const CONTRASTE_TEXTO = 4.5

export function colorHex(valor: unknown): string | undefined {
    if (typeof valor !== 'string') return undefined
    const s = valor.trim().toLowerCase()
    if (/^#[0-9a-f]{6}$/.test(s)) return s
    if (/^#[0-9a-f]{3}$/.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
    return undefined
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const aHex = (canales: number[]) =>
    `#${canales
        .map((x) =>
            Math.round(Math.min(255, Math.max(0, x)))
                .toString(16)
                .padStart(2, '0')
        )
        .join('')}`
const canal = (x: number) => {
    const s = x / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
export function luminancia(hex: string) {
    const [r, g, b] = rgb(hex).map(canal)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contraste(a: string, b: string) {
    const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m)
    return (x + 0.05) / (y + 0.05)
}
/** `a` corrido hacia `b` en la proporción `t` (0 = a, 1 = b). */
export function mezclar(a: string, b: string, t: number) {
    const ca = rgb(a)
    const cb = rgb(b)
    return aHex(ca.map((x, i) => x + (cb[i] - x) * t))
}
const legible = (tinta: string, fondos: string[]) =>
    fondos.every((fondo) => contraste(tinta, fondo) >= CONTRASTE_TEXTO)
const mejorTinta = (fondo: string) => {
    const preferida =
        contraste(TINTA_OSCURA, fondo) >= contraste(TINTA_CLARA, fondo) ? TINTA_OSCURA : TINTA_CLARA
    if (legible(preferida, [fondo])) return preferida
    return contraste('#000000', fondo) >= contraste('#ffffff', fondo) ? '#000000' : '#ffffff'
}

/** Busca el tono más cercano al original que se lea en todas las superficies. */
function ajustarContraste(original: string, tinta: string, fondos: string[]) {
    if (legible(original, fondos)) return original
    let desde = 0
    let hasta = 1
    let resultado = tinta
    for (let i = 0; i < 16; i++) {
        const proporcion = (desde + hasta) / 2
        const candidato = mezclar(original, tinta, proporcion)
        if (legible(candidato, fondos)) {
            hasta = proporcion
            resultado = candidato
        } else desde = proporcion
    }
    return resultado
}

/** La plantilla decide las superficies y la tinta. La marca aporta acentos, nunca fondo y texto
 * automáticos. Los overrides de `tienda.colores` son decisiones de diseño explícitas y se validan. */
export function armarPaleta(
    restaurante: ColoresRestaurante | null | undefined,
    tienda: { plantilla?: PlantillaId; colores?: ColoresTienda }
): Paleta {
    const base = BASES_PLANTILLA[resolverPlantilla(tienda.plantilla)]
    const c = tienda.colores ?? {}
    const primario = colorHex(restaurante?.colorPrimario)
    const secundario = restaurante?.usarColorUnico ? undefined : colorHex(restaurante?.colorSecundario)
    const marca = colorHex(c.acento) ?? primario ?? secundario ?? base.acento
    const fondo = colorHex(c.fondo) ?? base.fondo
    const oscuro = luminancia(fondo) < 0.18
    const tintaBase = legible(base.texto, [fondo]) ? base.texto : mejorTinta(fondo)
    const superficieBase =
        fondo === base.fondo ? base.superficie : mezclar(fondo, '#ffffff', oscuro ? 0.06 : 0.5)
    const superficiePropuesta = colorHex(c.superficie) ?? superficieBase
    // Fondo y tarjetas comparten tinta: una tarjeta de luminosidad opuesta necesita normalizarse.
    const superficie = legible(tintaBase, [superficiePropuesta])
        ? superficiePropuesta
        : legible(tintaBase, [superficieBase])
          ? superficieBase
          : fondo
    const textoPropuesto = colorHex(c.texto) ?? tintaBase
    const texto = legible(textoPropuesto, [fondo, superficie]) ? textoPropuesto : tintaBase
    const suavePropuesto = mezclar(
        mezclar(fondo, texto, oscuro ? 0.1 : 0.055),
        secundario ?? marca,
        base.marca.tinte
    )
    const suave = legible(texto, [suavePropuesto]) ? suavePropuesto : fondo
    const fondos = [fondo, superficie, suave]
    // El color original se conserva en áreas de marca con su propia tinta. Los acentos
    // usados como texto necesitan otra versión que contraste sobre las superficies claras.
    const acento = ajustarContraste(marca, texto, fondos)
    const complemento = secundario ?? marca

    return {
        fondo,
        texto,
        acento,
        acentoTexto: mejorTinta(acento),
        acentoLegible: acento,
        marca,
        marcaTexto: mejorTinta(marca),
        complemento,
        complementoTexto: mejorTinta(complemento),
        superficie,
        suave,
        apagado: ajustarContraste(mezclar(texto, fondo, 0.4), texto, fondos),
        linea: mezclar(fondo, texto, oscuro ? 0.2 : 0.14),
        oscuro,
    }
}
