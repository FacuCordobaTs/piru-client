import { describe, expect, test } from 'bun:test'
import {
    aplicarEscenario,
    claveLinea,
    leerLineasGuardadas,
    lineasCarrito,
    motivoBloqueo,
    normalizarTienda,
    validarItem,
    type RespuestaTienda,
} from '../src/sdk/datos'
import { hidratarCarrito } from '../src/features/tienda/carritoPaginas'
import type { ProductoTienda } from '../src/features/tienda/datos'
import { calcularTotalesCheckout, descuentoPuntosCheckout, itemsParaPedido } from '../src/sdk/checkoutDatos'

const respuesta = (): RespuestaTienda => ({
    restaurante: {
        id: 42,
        username: 'bronx',
        nombre: 'Bronx',
        imagenUrl: 'https://images.piru.app/logo.png',
        colorPrimario: '#EAC133',
        telefono: '342 487-9437',
        deliveryFee: '1900.00',
        tienda: { frase: 'Sabores Clásicos', productoDestacadoId: 2, instagram: '@bronx' },
        metodosPago: [{ id: 'cash', label: 'Efectivo' }],
        pausadoPorSuscripcion: false,
    },
    productos: [
        { id: 1, nombre: 'Papas', precio: '3000', categoria: 'Acompañamientos', categoriaOrden: 2, imagenUrl: null },
        {
            id: 2,
            nombre: 'Doble',
            precio: '10000',
            descuento: 10,
            categoria: 'Burgers',
            categoriaOrden: 1,
            imagenUrl: 'https://images.piru.app/doble.jpg',
            variantes: [
                { id: 21, nombre: 'Simple', precio: '8000' },
                { id: 22, nombre: 'Doble', precio: '10000' },
            ],
            agregados: [{ id: 5, nombre: 'Cheddar', precio: '700', grupo: 1 }],
            ingredientes: [{ id: 9, nombre: 'Cebolla' }],
            permiteNota: true,
        },
        { id: 3, nombre: 'Sin foto', precio: '9000', categoria: 'Burgers', categoriaOrden: 1 },
        { id: 4, nombre: 'Gorra', precio: '0', soloCanjePuntos: true, puntosNecesarios: '500' },
        { id: 5, nombre: 'Agua', precio: '1500', categoria: null },
    ],
    horarios: [],
})

describe('normalización de la tienda', () => {
    test('arma local, carta en orden y destacado', () => {
        const d = normalizarTienda(respuesta())
        expect(d.local).toMatchObject({ id: 42, nombre: 'Bronx', whatsapp: '3424879437', instagram: 'bronx', deliveryFee: 1900, abierto: true })
        expect(d.secciones.map((s) => s.nombre)).toEqual(['Burgers', 'Acompañamientos', 'Sin categoría'])
        expect(d.secciones[0].productos.map((p) => p.id)).toEqual([2, 3])
        expect(d.destacado?.id).toBe(2)
        expect(d.productos.find((p) => p.id === 2)).toMatchObject({ precioFinal: 9000, requiereOpciones: true, tieneOpciones: true })
        expect(d.productos.some((p) => p.id === 4)).toBe(false)
        expect(d.canjes).toEqual([]) // sin sistema de puntos no hay canjes
    })

    test('los escenarios de la vista previa cambian el estado sin tocar la respuesta real', () => {
        const real = respuesta()
        expect(normalizarTienda(aplicarEscenario(real, 'pausado')).local.pausado).toBe(true)
        expect(normalizarTienda(aplicarEscenario(real, 'cerrado')).local.abierto).toBe(false)
        expect(normalizarTienda(aplicarEscenario(real, 'sin-productos')).secciones).toEqual([])
        expect(normalizarTienda(aplicarEscenario(real, 'solo-canje')).canjes.length).toBe(3)
        expect(real.restaurante.pausadoPorSuscripcion).toBe(false)
    })
})

describe('carrito del SDK', () => {
    const d = normalizarTienda(respuesta())
    const doble = d.productos.find((p) => p.id === 2)!

    test('exige variantes y valida opciones', () => {
        expect(validarItem(doble, { productoId: 2 })).toEqual({ ok: false, reason: 'requires-options' })
        expect(validarItem(doble, { productoId: 2, varianteId: 99 })).toEqual({ ok: false, reason: 'unavailable' })
        expect(validarItem(doble, { productoId: 2, varianteId: 22, agregados: [77] })).toEqual({ ok: false, reason: 'unavailable' })
        expect(validarItem(undefined, { productoId: 2 })).toEqual({ ok: false, reason: 'unavailable' })
        expect(validarItem(doble, { productoId: 2, varianteId: 22, agregados: [5], ingredientesExcluidos: [9], nota: ' bien cocida ' }).ok).toBe(true)
    })

    test('calcula el subtotal como la tienda estándar', () => {
        const v = validarItem(doble, { productoId: 2, varianteId: 21, agregados: [5], ingredientesExcluidos: [9], nota: 'x' })
        if (!v.ok) throw new Error()
        const lineas = lineasCarrito([{ ...v.linea, key: claveLinea(v.linea), cantidad: 2 }], d.productos)
        // (8000 - 10%) + 700 = 7900 por unidad
        expect(lineas[0]).toMatchObject({ precioUnitario: 7900, subtotal: 15800, subtotalFormatted: '$15.800', opciones: ['Simple', '+ Cheddar', 'Sin Cebolla', '“x”'] })
    })

    test('motivos de bloqueo', () => {
        const papas = lineasCarrito([{ productoId: 1, agregados: [], ingredientesExcluidos: [], key: '1', cantidad: 1 }], d.productos)
        expect(motivoBloqueo([], d.local)).toBe('empty')
        expect(motivoBloqueo(papas, d.local)).toBeNull()
        expect(motivoBloqueo(papas, { ...d.local, pausado: true })).toBe('paused')
        expect(motivoBloqueo(papas, { ...d.local, abierto: false })).toBe('closed')
        expect(motivoBloqueo(papas, { ...d.local, abierto: false, permiteProgramados: true })).toBeNull()
        const fantasma = lineasCarrito([{ productoId: 999, agregados: [], ingredientesExcluidos: [], key: 'x', cantidad: 1 }], d.productos)
        expect(motivoBloqueo(fantasma, d.local)).toBe('unavailable')
    })

    test('la misma combinación suma en la misma línea y lo guardado se valida al leer', () => {
        expect(claveLinea({ productoId: 2, varianteId: 21, agregados: [5, 3] })).toBe(claveLinea({ productoId: 2, varianteId: 21, agregados: [3, 5] }))
        expect(leerLineasGuardadas([{ productoId: 1, cantidad: 2 }, { productoId: -1, cantidad: 1 }, { productoId: 2, cantidad: 500 }, 'x']).length).toBe(1)
    })
})

describe('checkout de Páginas', () => {
    test('hidrata con el catálogo real y descarta lo que ya no existe', () => {
        const productos = respuesta().productos as unknown as ProductoTienda[]
        const { items, descartados } = hidratarCarrito(
            [
                { productoId: 2, cantidad: 2, varianteId: 22, agregados: [5], ingredientesExcluidos: [9], nota: 'sin sal' },
                { productoId: 2, cantidad: 1 }, // falta la variante
                { productoId: 999, cantidad: 1 },
                { productoId: 4, cantidad: 1 }, // sólo canje
            ],
            productos
        )
        expect(descartados).toBe(3)
        expect(items).toHaveLength(1)
        expect(items[0]).toMatchObject({ productoId: 2, nombre: 'Doble - Doble', precio: '9700.00', cantidad: 2, ingredientesExcluidosNombres: ['Cebolla'], nota: 'sin sal', esCanjePuntos: false })
    })

    test('arma el pedido con los extras del catálogo, no con precios del sitio', () => {
        const d = normalizarTienda(respuesta())
        const [item] = itemsParaPedido(
            [{ productoId: 2, cantidad: 2, varianteId: 22, agregados: [5], ingredientesExcluidos: [9], nota: 'sin sal', key: 'k' }],
            d.productos
        )
        expect(item).toEqual({
            productoId: 2,
            cantidad: 2,
            varianteId: 22,
            agregados: [{ id: 5, nombre: 'Cheddar', precio: '700' }],
            ingredientesExcluidos: [9],
            nota: 'sin sal',
        })
    })

    test('los puntos y el total respetan la regla del backend', () => {
        const base = { permiteCanjeEnvioGratis: true, permiteCanjeDescuento: true, puntosEnvioGratis: 300, descuentoPuntosCosto: 500, descuentoMontoMinimo: 0, descuentoTope: 0 }
        expect(descuentoPuntosCheckout({ ...base, activo: true, descuentoTipo: 'fijo', descuentoValor: 500 }, 10000)).toBe(500)
        expect(descuentoPuntosCheckout({ ...base, activo: true, descuentoTipo: 'porcentaje', descuentoValor: 10, descuentoTope: 300 }, 10000)).toBe(300)
        expect(descuentoPuntosCheckout({ ...base, activo: true, descuentoTipo: 'fijo', descuentoValor: 500, descuentoMontoMinimo: 12000 }, 10000)).toBe(0)
        expect(descuentoPuntosCheckout(null, 10000)).toBe(0)

        expect(calcularTotalesCheckout({ itemsTotal: 10000, deliveryFee: 1900, canjeEnvio: false, descuentoPuntos: 500, descuento: 200 })).toMatchObject({
            subtotal: 10000,
            envio: 1900,
            descuentoPuntos: 500,
            descuento: 200,
            total: 11200,
        })
        expect(calcularTotalesCheckout({ itemsTotal: 10000, deliveryFee: 1900, canjeEnvio: true, descuentoPuntos: 500, descuento: 0 }).total).toBe(9500)
    })
})
