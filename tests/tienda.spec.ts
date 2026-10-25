import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { prepararTienda, productos, sinDesborde } from './tienda.fixture'

for (const plantilla of ['elegante', 'moderna', 'artesanal']) {
    for (const width of [375, 1280]) {
        test(`${plantilla}: carta, detalle y carrito a ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 })
            const { errores } = await prepararTienda(page, plantilla)
            await page.goto('/casa-oliva')
            await expect(page.locator('[data-plantilla]')).toHaveAttribute('data-plantilla', plantilla)
            await expect(page.getByRole('heading', { name: /^Para empezar/ })).toBeVisible()
            await expect(page.getByRole('button', { name: /Pan de campo/ })).toHaveCount(1)
            // Un producto exclusivo de puntos no aparece en la carta de venta.
            await expect(page.locator('main').getByRole('button', { name: /Regalo del club/ })).toHaveCount(1)
            await expect(page.locator('section[aria-label="Club"]')).toHaveCount(0)
            await sinDesborde(page)
            if (process.env.TIENDA_SHOTS) {
                await mkdir(process.env.TIENDA_SHOTS, { recursive: true })
                await page.screenshot({
                    path: `${process.env.TIENDA_SHOTS}/${plantilla}-${width}.png`,
                    fullPage: true,
                })
            }
            await page.getByRole('button', { name: /Pan de campo/ }).click()
            const detalle = page.getByRole('dialog')
            await expect(detalle).toBeVisible()
            await detalle.getByRole('button', { name: /Agregar|Sumar/ }).click()
            await detalle.getByRole('button', { name: 'Cerrar', exact: true }).click()
            await page.getByRole('button', { name: /Ver pedido/ }).click()
            const carrito = page.getByRole('dialog')
            await expect(carrito.getByText('Pan de campo', { exact: true })).toBeVisible()
            await expect(carrito.getByText('$3.500', { exact: true }).first()).toBeVisible()
            await carrito.getByRole('button', { name: 'Cerrar pedido' }).click()
            await expect(carrito).not.toBeVisible()
            await page.getByRole('button', { name: /Ver pedido/ }).click()
            await carrito.getByRole('button', { name: 'Continuar' }).click()
            await expect(carrito.getByRole('heading', { name: 'Revisá tu pedido' })).toBeVisible()
            await expect(carrito.getByRole('button', { name: 'Completar datos de envío' })).toBeVisible()
            await sinDesborde(page)
            expect(errores).toEqual([])
        })
    }
    test(`${plantilla}: sala usa la misma plantilla y respeta los ítems de cada participante`, async ({
        page,
    }) => {
        const { rest, errores } = await prepararTienda(page, plantilla)
        await page.addInitScript(
            ({ rest, productos }) => {
                localStorage.setItem(
                    'piru-mesa-storage',
                    JSON.stringify({
                        state: {
                            restaurante: rest,
                            productos,
                            qrToken: 'prueba',
                            clienteNombre: 'Ana',
                            clienteTelefono: '1112345678',
                            clienteId: 'ana',
                            pedidoId: 1,
                            mesa: { nombre: 'Amigos' },
                        },
                        version: 0,
                    })
                )
                sessionStorage.setItem('bienvenida_shown_prueba', '1')
            },
            { rest, productos }
        )
        await page.routeWebSocket('**/ws/prueba', (socket) => {
            socket.send(
                JSON.stringify({
                    type: 'ESTADO_INICIAL',
                    payload: {
                        pedidoId: 1,
                        estado: 'pending',
                        clientes: [
                            { id: 'ana', nombre: 'Ana' },
                            { id: 'luis', nombre: 'Luis' },
                        ],
                        items: [
                            {
                                id: 10,
                                productoId: 3,
                                nombreProducto: 'Pan de campo',
                                clienteNombre: 'Ana',
                                cantidad: 1,
                                precioUnitario: '3500',
                            },
                            {
                                id: 11,
                                productoId: 4,
                                nombreProducto: 'Ravioles de calabaza',
                                clienteNombre: 'Luis',
                                cantidad: 1,
                                precioUnitario: '16000',
                            },
                        ],
                    },
                })
            )
        })
        await page.goto('/sala/prueba')
        await expect(page.locator('[data-plantilla]')).toHaveAttribute('data-plantilla', plantilla)
        await expect(page.getByText('Hola, Ana', { exact: true })).toBeVisible()
        await expect(page.locator('[data-plantilla] > header').getByText(/Recomendado de la casa|Nuestro favorito|Una recomendación para vos/, { exact: true })).toHaveCount(1)
        await page.getByRole('button', { name: /Ver el pedido/ }).click()
        const carrito = page.getByRole('dialog')
        await expect(carrito.getByText('Pan de campo', { exact: true })).toBeVisible()
        await expect(carrito.getByText('Ravioles de calabaza', { exact: true })).toBeVisible()
        await expect(carrito.getByRole('button', { name: /Quitar Pan de campo/ })).toHaveCount(1)
        await expect(carrito.getByRole('button', { name: /Quitar Ravioles/ })).toHaveCount(0)
        expect(errores).toEqual([])
    })
}

test('sin configuración y con plantilla desconocida usa Artesanal', async ({ page }) => {
    const { errores } = await prepararTienda(page, 'desconocida', false)
    await page.goto('/casa-oliva')
    await expect(page.locator('[data-plantilla]')).toHaveAttribute('data-plantilla', 'artesanal')
    await expect(page.getByRole('button', { name: /Pan de campo/ })).toBeVisible()
    await expect(page.getByRole('region', { name: 'La casa' })).toHaveCount(0)
    expect(errores).toEqual([])
})

test('cambiar de restaurante no arrastra el carrito ni la plantilla de otro local', async ({ page }) => {
    await prepararTienda(page, 'moderna')
    await page.route('**/api/public/restaurante/otro', (route) =>
        route.fulfill({
            json: {
                success: true,
                data: {
                    restaurante: { id: 91, nombre: 'Otra casa', tienda: { plantilla: 'artesanal' } },
                    productos: [],
                    horarios: [],
                },
            },
        })
    )
    await page.goto('/casa-oliva?rep=3x1')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.evaluate(() => {
        window.history.pushState({}, '', '/otro')
        window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.locator('[data-plantilla]')).toHaveAttribute('data-plantilla', 'artesanal')
    await expect(page.getByRole('button', { name: /Ver pedido/ })).toHaveCount(0)
})

test('la demo mantiene la plantilla, aísla el carrito y no consulta datos privados ni registra eventos', async ({
    page,
}) => {
    await prepararTienda(page, 'artesanal')
    const peticiones: string[] = []
    page.on('request', (request) => {
        if (request.url().includes('/api/')) peticiones.push(new URL(request.url()).pathname)
    })
    await page.addInitScript(() => {
        localStorage.setItem('cliente_telefono', '1112345678')
        localStorage.setItem(
            'deliveryCart_casa-oliva',
            JSON.stringify({
                items: [
                    { id: 'original', productoId: 3, nombre: 'Pan de campo', cantidad: 1, precio: '3500' },
                ],
            })
        )
        localStorage.setItem('piru-demo-recorrido-v1:casa-oliva', '1')
    })
    await page.goto('/casa-oliva?demo&tk=ignorar-en-demo')
    await expect(page.locator('[data-plantilla]')).toHaveAttribute('data-plantilla', 'artesanal')
    await page.waitForTimeout(800)
    expect(peticiones.filter((path) => /cliente|mis-pedidos|tracking|evento|create/.test(path))).toEqual([])
    expect(
        await page.evaluate(() => JSON.parse(localStorage.getItem('deliveryCart_casa-oliva')!).items[0].id)
    ).toBe('original')
})

test('el checkout conserva el intento al reintentar y envía el mismo contrato de pedido', async ({
    page,
}) => {
    await prepararTienda(page, 'moderna')
    await page.addInitScript(() => {
        localStorage.setItem('cliente_nombre', 'Ana')
        localStorage.setItem('cliente_telefono', '1112345678')
        localStorage.setItem('cliente_direccion', 'Gorriti 4800')
    })
    const intentos: {
        clave: string | undefined
        payload: { restauranteId: number; items: { productoId: number; cantidad: number }[] }
    }[] = []
    await page.route('**/api/public/delivery/create', async (route) => {
        intentos.push({
            clave: route.request().headers()['idempotency-key'],
            payload: route.request().postDataJSON(),
        })
        await route.fulfill(
            intentos.length === 1
                ? { json: { success: false, message: 'Probá nuevamente' } }
                : { json: { success: true, data: { id: 123, total: '4700', deliveryFee: 1200 } } }
        )
    })
    await page.goto('/casa-oliva')
    await page.getByRole('button', { name: /Pan de campo/ }).click()
    await page
        .getByRole('dialog')
        .getByRole('button', { name: /Agregar/ })
        .click()
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click()
    await page.getByRole('button', { name: /Ver pedido/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar Pedido' }).click()
    await expect(page.getByText('Probá nuevamente', { exact: true })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar Pedido' }).click()
    await expect(page).toHaveURL(/\/casa-oliva\/success/)
    expect(intentos).toHaveLength(2)
    expect(intentos[0].clave).toBeTruthy()
    expect(intentos[1].clave).toBe(intentos[0].clave)
    expect(intentos[1].payload).toMatchObject({ restauranteId: 90, items: [{ productoId: 3, cantidad: 1 }] })
})

for (const width of [375, 1280]) {
    test(`moderna: identidad protagonista y recomendado sin foto a ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        const { rest, errores } = await prepararTienda(page, 'moderna')
        await page.route('https://tienda.test/logo.svg', (route) =>
            route.fulfill({
                contentType: 'image/svg+xml',
                body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><rect x="2" y="2" width="196" height="156" rx="78" fill="#315cfd"/><text x="100" y="104" fill="white" font-family="Georgia" font-size="70" font-weight="bold" text-anchor="middle">CO</text></svg>',
            })
        )
        const cartaSinFotos = productos.map((producto) => ({
            ...producto,
            imagenUrl: null,
            imagenesExtra: [],
        }))
        await page.route('**/api/public/restaurante/casa-oliva', (route) =>
            route.fulfill({
                json: {
                    success: true,
                    data: {
                        restaurante: { ...rest, imagenUrl: 'https://tienda.test/logo.svg' },
                        productos: cartaSinFotos,
                        horarios: [],
                    },
                },
            })
        )
        await page.goto('/casa-oliva')
        const hero = page.locator('[data-plantilla] > header')
        await expect(hero.getByRole('heading', { level: 1, name: 'Casa Oliva', exact: true })).toBeVisible()
        await expect(hero.getByText('Casa Oliva', { exact: true })).toHaveCount(1)
        const logo = hero.locator('img').first()
        await expect(logo).toBeVisible()
        expect((await logo.boundingBox())!.height).toBeGreaterThanOrEqual(128)
        const favorito = hero.getByRole('button', { name: /^Nuestro favorito:/ })
        await expect(favorito.locator('img')).toHaveCount(0)
        await expect(favorito.getByText('Ver plato', { exact: true })).toBeVisible()
        const nombre = (await favorito.getAttribute('aria-label'))!.replace('Nuestro favorito: ', '')
        const producto = cartaSinFotos.find((p) => p.nombre === nombre)!
        await expect(favorito.getByText(producto.descripcion!, { exact: true })).toBeVisible()
        const pan = page.locator('main').getByRole('button', { name: /Pan de campo/ })
        await expect(pan.locator('img')).toHaveCount(0)
        await expect(page.locator('main .lucide-utensils')).toHaveCount(0)
        await expect(
            pan.getByText('Horneado cada mañana, con aceite de oliva.', { exact: true })
        ).toBeVisible()
        await sinDesborde(page)
        if (process.env.TIENDA_SHOTS) {
            await mkdir(process.env.TIENDA_SHOTS, { recursive: true })
            await page.screenshot({
                path: `${process.env.TIENDA_SHOTS}/moderna-sin-fotos-${width}.png`,
                fullPage: true,
            })
        }
        await favorito.click()
        await expect(page.getByRole('dialog').getByText(nombre, { exact: true }).first()).toBeVisible()
        expect(errores).toEqual([])
    })
}

for (const width of [375, 1280]) {
    for (const conFotos of [true, false]) {
        test(`artesanal: identidad de mostrador sin arcos a ${width}px ${conFotos ? 'con' : 'sin'} fotos`, async ({
            page,
        }) => {
            await page.setViewportSize({ width, height: 900 })
            const { rest, errores } = await prepararTienda(page, 'artesanal')
            const carta = conFotos
                ? productos
                : productos.map((producto) => ({ ...producto, imagenUrl: null, imagenesExtra: [] }))
            await page.route('https://tienda.test/logo-casa.svg', (route) =>
                route.fulfill({
                    contentType: 'image/svg+xml',
                    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 120"><rect x="2" y="2" width="176" height="116" fill="#a34b34"/><text x="90" y="82" fill="#fffaf1" font-family="Georgia" font-size="68" font-weight="bold" text-anchor="middle">CO</text></svg>',
                })
            )
            await page.route('**/api/public/restaurante/casa-oliva', (route) =>
                route.fulfill({
                    json: {
                        success: true,
                        data: {
                            restaurante: {
                                ...rest,
                                imagenUrl: 'https://tienda.test/logo-casa.svg',
                                tienda: {
                                    ...rest.tienda,
                                    portadaUrl: conFotos ? rest.tienda.portadaUrl : undefined,
                                    galeria: conFotos ? rest.tienda.galeria : [],
                                },
                            },
                            productos: carta,
                            horarios: [],
                        },
                    },
                })
            )
            await page.goto('/casa-oliva')
            const plantilla = page.locator('[data-plantilla="artesanal"]')
            const hero = page.getByRole('banner', { name: 'Bienvenida a la casa' })
            await expect(
                hero.getByRole('heading', { name: 'Casa Oliva', exact: true, level: 1 })
            ).toBeVisible()
            await expect(hero.getByText('Qué bueno tenerte por acá.', { exact: true })).toBeVisible()
            await expect(plantilla.locator('.artesanal-cuadros').first()).toBeVisible()
            await expect(plantilla.locator('.lucide-flower-2, .lucide-utensils')).toHaveCount(0)
            await page.evaluate(() => document.fonts.ready)
            const sinArcos = await plantilla.locator('img').evaluateAll((imagenes) =>
                imagenes.every((imagen) => {
                    const estilos = getComputedStyle(imagen)
                    return [
                        estilos.borderTopLeftRadius,
                        estilos.borderTopRightRadius,
                        estilos.borderBottomLeftRadius,
                        estilos.borderBottomRightRadius,
                    ].every((radio) => parseFloat(radio) <= 6)
                })
            )
            expect(sinArcos).toBe(true)
            const pan = page.locator('main').getByRole('button', { name: /Pan de campo/ })
            await expect(pan.locator('img')).toHaveCount(0)
            await expect(
                pan.getByText('Horneado cada mañana, con aceite de oliva.', { exact: true })
            ).toBeVisible()
            await sinDesborde(page)
            if (process.env.TIENDA_SHOTS) {
                await mkdir(process.env.TIENDA_SHOTS, { recursive: true })
                await page.screenshot({
                    path: `${process.env.TIENDA_SHOTS}/artesanal-${conFotos ? 'con' : 'sin'}-fotos-${width}.png`,
                    fullPage: true,
                })
            }
            await pan.click()
            await expect(
                page.getByRole('dialog').getByText('Pan de campo', { exact: true }).first()
            ).toBeVisible()
            expect(errores).toEqual([])
        })
    }
}


for (const plantilla of ['elegante', 'moderna', 'artesanal']) {
    test(`${plantilla}: sólo muestra el destacado elegido, sin reemplazos automáticos`, async ({ page }) => {
        const { rest, errores } = await prepararTienda(page, plantilla)
        for (const productoDestacadoId of [4, undefined, 999, 6]) {
            await page.route('**/api/public/restaurante/casa-oliva', route => route.fulfill({ json: {
                success: true, data: { restaurante: { ...rest, tienda: { ...rest.tienda, productoDestacadoId } }, productos, horarios: [], sucursales: [] },
            } }))
            await page.goto('/casa-oliva')
            const hero = page.locator('[data-plantilla] > header')
            await expect(hero.getByRole('heading', { level: 1, name: 'Casa Oliva', exact: true })).toBeVisible()
            await expect(hero.getByText(/Recomendado de la casa|Nuestro favorito|Una recomendación para vos/, { exact: true })).toHaveCount(productoDestacadoId === 4 ? 1 : 0)
            if (productoDestacadoId === 4) await expect(hero.getByText('Ravioles de calabaza', { exact: true })).toBeVisible()
        }
        expect(errores).toEqual([])
    })
}
