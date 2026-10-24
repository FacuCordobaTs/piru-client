import { describe, expect, test } from 'bun:test'
import { armarPaleta, contraste, type Paleta } from '../src/lib/paletaTienda'
import { BASES_PLANTILLA, PLANTILLAS } from '../src/lib/plantillas'

function comprobarLectura(paleta: Paleta) {
    for (const fondo of [paleta.fondo, paleta.superficie, paleta.suave]) {
        for (const tinta of [paleta.texto, paleta.apagado, paleta.acento, paleta.acentoLegible]) {
            expect(contraste(tinta, fondo)).toBeGreaterThanOrEqual(4.5)
        }
    }
    expect(contraste(paleta.acentoTexto, paleta.acento)).toBeGreaterThanOrEqual(4.5)
    expect(contraste(paleta.marcaTexto, paleta.marca)).toBeGreaterThanOrEqual(4.5)
    expect(contraste(paleta.complementoTexto, paleta.complemento)).toBeGreaterThanOrEqual(4.5)
}

for (const plantilla of PLANTILLAS) {
    describe(`paleta ${plantilla}`, () => {
        test('uno o dos colores intensos conservan el fondo, las tarjetas y la tinta de la plantilla', () => {
            const colores = [
                '#ff0000',
                '#0000ff',
                '#ffff00',
                '#00ff00',
                '#ff00ff',
                '#ffffff',
                '#000000',
                '#888888',
                '#ffe1ef',
            ]
            const base = BASES_PLANTILLA[plantilla]
            comprobarLectura(armarPaleta(null, { plantilla }))
            for (const colorPrimario of colores) {
                for (const colorSecundario of [undefined, ...colores]) {
                    const paleta = armarPaleta({ colorPrimario, colorSecundario }, { plantilla })
                    expect(paleta.fondo).toBe(base.fondo)
                    expect(paleta.superficie).toBe(base.superficie)
                    expect(paleta.texto).toBe(base.texto)
                    expect(paleta.oscuro).toBe(false)
                    expect(paleta.marca).toBe(colorPrimario)
                    expect(paleta.complemento).toBe(colorSecundario ?? colorPrimario)
                    comprobarLectura(paleta)
                }
            }
        })

        test('el secundario se conserva para áreas visibles y el modo de un color lo ignora', () => {
            const marca = { colorPrimario: '#ff0000', colorSecundario: '#0000ff' }
            const uno = armarPaleta({ ...marca, usarColorUnico: true }, { plantilla })
            const dos = armarPaleta(marca, { plantilla })
            // Puede oscurecerse apenas para seguir leyéndose sobre el nuevo tinte.
            expect(contraste(dos.acento, uno.acento)).toBeLessThan(1.3)
            expect(dos.suave).not.toBe(uno.suave)
            expect(contraste(dos.suave, BASES_PLANTILLA[plantilla].fondo)).toBeLessThan(1.8)
            expect(uno).toEqual(armarPaleta({ colorPrimario: marca.colorPrimario }, { plantilla }))
        })

        test('normaliza colores parciales e inválidos sin perder la lectura', () => {
            const soloSecundario = armarPaleta({ colorSecundario: '#00f' }, { plantilla })
            expect(soloSecundario.acento).not.toBe(BASES_PLANTILLA[plantilla].acento)
            comprobarLectura(soloSecundario)
            expect(
                armarPaleta({ colorPrimario: 'red', colorSecundario: 'url(otro)' }, { plantilla })
            ).toEqual(armarPaleta(null, { plantilla }))
        })

        test('los overrides explícitos también mantienen el contraste en todas las superficies', () => {
            for (const fondo of ['#101010', '#ffffff', '#777777', '#ff0000']) {
                const paleta = armarPaleta(null, {
                    plantilla,
                    colores: { fondo, texto: fondo, superficie: '#000000', acento: '#ffff00' },
                })
                expect(paleta.fondo).toBe(fondo)
                comprobarLectura(paleta)
            }
        })
    })
}

test('la marca original se reconoce en ambas plantillas, que mantienen sus bases distintas', () => {
    const marca = { colorPrimario: '#0000ff', colorSecundario: '#ff0000' }
    const artesanal = armarPaleta(marca, { plantilla: 'artesanal' })
    const moderna = armarPaleta(marca, { plantilla: 'moderna' })
    expect(artesanal.marca).toBe(moderna.marca)
    expect(artesanal.marca).toBe(marca.colorPrimario)
    expect(artesanal.complemento).toBe(marca.colorSecundario)
    expect(artesanal.fondo).not.toBe(moderna.fondo)
    expect(artesanal.fondo).toBe('#f4ead8')
    expect(artesanal.texto).toBe('#392a20')
})
