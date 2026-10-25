import { expect, type Page } from '@playwright/test'

export const foto = 'https://tienda.test/plato.svg'
export const productos = [
    {
        id: 1,
        nombre: 'Burrata de la huerta',
        descripcion: 'Tomates de estación, albahaca fresca y pan de masa madre.',
        precio: '12500',
        imagenUrl: foto,
        imagenesExtra: ['https://tienda.test/detalle.svg'],
        categoria: 'Para empezar',
        categoriaOrden: 1,
        ingredientes: [],
        agregados: [],
        variantes: [],
        disponible: true,
        permiteNota: true,
        puntosGanados: 125,
    },
    {
        id: 2,
        nombre: 'Croquetas de hongos',
        descripcion: 'Doradas por fuera, cremosas por dentro.',
        precio: '8500',
        imagenUrl: foto,
        categoria: 'Para empezar',
        categoriaOrden: 1,
        ingredientes: [],
        agregados: [],
        variantes: [],
        disponible: true,
        descuento: 10,
    },
    {
        id: 3,
        nombre: 'Pan de campo',
        descripcion: 'Horneado cada mañana, con aceite de oliva.',
        precio: '3500',
        imagenUrl: null,
        categoria: 'Para empezar',
        categoriaOrden: 1,
        ingredientes: [],
        agregados: [],
        variantes: [],
        disponible: true,
    },
    {
        id: 4,
        nombre: 'Ravioles de calabaza',
        descripcion: 'Pasta hecha a mano, manteca de hierbas y queso estacionado.',
        precio: '16000',
        imagenUrl: foto,
        categoria: 'Los principales',
        categoriaOrden: 2,
        ingredientes: [],
        agregados: [],
        variantes: [],
        disponible: true,
    },
    {
        id: 5,
        nombre: 'Limonada de la casa',
        descripcion: 'Limón, menta y jengibre.',
        precio: '4500',
        imagenUrl: null,
        categoria: 'Para tomar',
        categoriaOrden: 3,
        ingredientes: [],
        agregados: [],
        variantes: [],
        disponible: true,
    },
    {
        id: 6,
        nombre: 'Regalo del club',
        precio: '0',
        imagenUrl: foto,
        categoria: 'Club',
        soloCanjePuntos: true,
        puntosNecesarios: 100,
        ingredientes: [],
        agregados: [],
        variantes: [],
    },
]
export function restaurante(plantilla?: string, completo = true) {
    return {
        id: 90,
        nombre: 'Casa Oliva',
        username: 'casa-oliva',
        imagenUrl: null,
        imagenLightUrl: null,
        direccion: completo ? 'Gorriti 4820, Palermo' : null,
        deliveryEnabled: true,
        takeawayEnabled: true,
        deliveryFee: '1200',
        direccionSoloTexto: true,
        permitirPedidosProgramados: true,
        sistemaPuntos: true,
        configuracionPuntos: { pesosPorPunto: 100, modoAcumulacion: 'monto' },
        orderGroupEnabled: true,
        metodosPago: [{ id: 'cash', nombre: 'Efectivo' }],
        tienda: completo
            ? {
                  plantilla,
                  productoDestacadoId: 2,
                  frase: 'El placer de comer bien.',
                  bajada: 'Cocina de estación, buenos ingredientes y tiempo para disfrutar. Tu mesa está donde estés.',
                  portadaUrl: foto,
                  galeria: ['https://tienda.test/casa.svg'],
                  historia: {
                      titulo: 'Una cocina con raíces',
                      texto: 'Nos gusta cocinar como nos enseñaron: con las manos, con paciencia y con lo mejor de cada estación.\nDesde nuestra cocina en Palermo, llevamos ese espíritu a cada mesa.',
                  },
                  instagram: 'casaoliva',
                  whatsapp: '5491112345678',
              }
            : { plantilla },
    }
}
export async function prepararTienda(page: Page, plantilla?: string, completo = true) {
    const rest = restaurante(plantilla, completo)
    const errores: string[] = []
    page.on('pageerror', (error) => errores.push(error.message))
    if (!process.env.TIENDA_FUENTES_REALES)
        await page.route('https://fonts.googleapis.com/**', (route) =>
            route.fulfill({ contentType: 'text/css', body: '' })
        )
    await page.route('https://tienda.test/**', (route) =>
        route.fulfill({
            contentType: 'image/svg+xml',
            body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 700"><defs><radialGradient id="b"><stop stop-color="#bfc5a2"/><stop offset="1" stop-color="#6e7854"/></radialGradient></defs><path fill="url(#b)" d="M0 0h800v700H0z"/><circle cx="400" cy="350" r="265" fill="#ebe6db"/><circle cx="400" cy="350" r="215" fill="#faf8ef"/><ellipse cx="400" cy="370" rx="140" ry="115" fill="#d9b181"/><g fill="#b33e25"><circle cx="320" cy="300" r="46"/><circle cx="475" cy="330" r="45"/><circle cx="400" cy="440" r="40"/></g><g fill="#405c32"><ellipse cx="355" cy="395" rx="24" ry="55" transform="rotate(-25 355 395)"/><ellipse cx="455" cy="260" rx="25" ry="55" transform="rotate(45 455 260)"/></g><ellipse cx="400" cy="345" rx="72" ry="68" fill="#fffef7"/></svg>`,
        })
    )
    await page.route('**/api/**', async (route) => {
        const url = new URL(route.request().url())
        if (url.pathname.endsWith('/public/restaurante/casa-oliva'))
            return route.fulfill({
                json: { success: true, data: { restaurante: rest, productos, horarios: [], sucursales: [] } },
            })
        if (url.pathname.endsWith('/mesa/join/prueba'))
            return route.fulfill({
                json: {
                    success: true,
                    data: {
                        restaurante: rest,
                        productos,
                        mesa: { id: 1, nombre: 'Amigos', qrToken: 'prueba' },
                        pedido: { id: 1, estado: 'pending' },
                    },
                },
            })
        if (url.pathname.includes('/cliente/'))
            return route.fulfill({ json: { success: true, data: { puntos: 740 } } })
        return route.fulfill({ json: { success: true, data: [] } })
    })
    return { rest, errores }
}
export async function sinDesborde(page: Page) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}
