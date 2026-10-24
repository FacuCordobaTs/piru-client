import { describe, expect, test } from 'bun:test'
import { armarFuentes, armarPaleta, contraste, leerTienda } from '../src/lib/tienda'
import { resolverPlantilla } from '../src/lib/plantillas'
import { productosDeSecciones, seccionesDeProductos } from '../src/features/tienda/catalogo'
import { checkIsOpen } from '../src/features/tienda/horarios'

describe('contrato de tienda', () => {
    test('datos parciales o inválidos no rompen el diseño y mantienen el fallback', () => {
        for (const bruto of [null, '{', [], 42, { plantilla: '../../moderna' }]) {
            const tienda = leerTienda(bruto)
            expect(resolverPlantilla(tienda.plantilla)).toBe('artesanal')
            expect(
                contraste(armarPaleta(null, tienda).texto, armarPaleta(null, tienda).fondo)
            ).toBeGreaterThanOrEqual(4.5)
        }
        const tienda = leerTienda(
            JSON.stringify({
                plantilla: 'artesanal',
                colores: { fondo: '#fff', texto: '#fff' },
                galeria: ['javascript:alert(1)', '//otro.test/foto', 'https://img.test/1.jpg'],
                portadaUrl: 'javascript:alert(1)',
            })
        )
        expect(tienda.plantilla).toBe('artesanal')
        expect(tienda.galeria).toEqual(['https://img.test/1.jpg'])
        expect(tienda.portadaUrl).toBeUndefined()
        const paleta = armarPaleta(null, tienda)
        expect(contraste(paleta.texto, paleta.fondo)).toBeGreaterThanOrEqual(4.5)
    })
    test('cada diseño tiene base propia y admite una dirección de arte explícita', () => {
        const moderna = armarPaleta(null, { plantilla: 'moderna' })
        const artesanal = armarPaleta(null, { plantilla: 'artesanal' })
        expect(moderna.fondo).not.toBe(artesanal.fondo)
        expect(armarFuentes({ plantilla: 'artesanal' }).titulos).toContain('Fraunces')
        const tienda = leerTienda({
            plantilla: 'moderna',
            colores: { fondo: '#101010', acento: '#ffbb00' },
            fuentes: { titulos: 'Anton', pesoTitulos: 400 },
        })
        expect(armarPaleta(null, tienda)).toMatchObject({ fondo: '#101010', acento: '#ffbb00', oscuro: true })
        expect(armarFuentes(tienda)).toMatchObject({ pesoTitulos: 400 })
        expect(armarFuentes(tienda).titulos).toContain('Anton')
    })
})

test('catálogo compartido: categorías ordenadas, canjes separados y detalle en el orden visible', () => {
    const productos = [
        { id: 1, nombre: 'Sin foto', categoria: 'Comida', categoriaOrden: 2 },
        { id: 2, nombre: 'Bebida', categoria: 'Bebidas', categoriaOrden: 1, imagenUrl: '/bebida.jpg' },
        {
            id: 3,
            nombre: 'Con foto extra',
            categoria: 'Comida',
            categoriaOrden: 2,
            imagenesExtra: ['/foto.jpg'],
        },
        { id: 4, nombre: 'Premio', categoria: 'Club', soloCanjePuntos: true },
        { id: 5, nombre: 'Sin categoría' },
    ]
    const secciones = seccionesDeProductos(productos)
    expect(secciones.map((s) => s.nombre)).toEqual(['Bebidas', 'Comida', 'Sin categoría'])
    expect(productosDeSecciones(secciones).map((p) => p.id)).toEqual([2, 3, 1, 5])
    expect(seccionesDeProductos([])).toEqual([])
})

test('horarios: la madrugada pertenece al turno anterior y la siguiente apertura se calcula igual en ambos flujos', () => {
    const horarios = [{ diaSemana: 5, horaApertura: '20:00', horaCierre: '02:00' }]
    expect(checkIsOpen(horarios, new Date(2026, 9, 24, 1, 30)).abierto).toBe(true)
    expect(checkIsOpen(horarios, new Date(2026, 9, 24, 2, 0)).abierto).toBe(false)
    expect(checkIsOpen(horarios, new Date(2026, 9, 23, 19, 0))).toEqual({
        abierto: false,
        proximaApertura: 'hoy a las 20:00',
    })
    expect(checkIsOpen([], new Date())).toEqual({ abierto: true, proximaApertura: null })
})
