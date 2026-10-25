import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { contraste } from '../src/lib/paletaTienda'
import { BASES_PLANTILLA, PLANTILLAS } from '../src/lib/plantillas'
import { prepararTienda, productos, sinDesborde } from './tienda.fixture'

for (const plantilla of PLANTILLAS) {
    for (const width of [375, 1280]) {
        test(`${plantilla}: marca roja y azul con superficies legibles a ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 })
            const { rest, errores } = await prepararTienda(page, plantilla)
            await page.route('**/api/public/restaurante/casa-oliva', (route) =>
                route.fulfill({
                    json: {
                        success: true,
                        data: {
                            restaurante: {
                                ...rest,
                                colorPrimario: '#ff0000',
                                colorSecundario: '#0000ff',
                                usarColorUnico: false,
                            },
                            productos,
                            horarios: [],
                        },
                    },
                })
            )
            await page.goto('/casa-oliva')
            await expect(page.locator('[data-plantilla]')).toHaveAttribute('data-plantilla', plantilla)
            await expect(page.getByRole('heading', { name: /^Para empezar/ })).toBeVisible()
            // La marca tiene que estar pintada en áreas visibles, no sólo declarada como variables.
            const primario = page.locator('[data-color-marca="primario"]')
            const secundario = page.locator('[data-color-marca="secundario"]')
            await expect(primario).toBeVisible()
            await expect(secundario).toBeVisible()
            await expect(primario).toHaveCSS('background-color', 'rgb(255, 0, 0)')
            await expect(secundario).toHaveCSS('background-color', 'rgb(0, 0, 255)')
            for (const bloque of [primario, secundario]) {
                const caja = await bloque.boundingBox()
                expect(caja!.width).toBeGreaterThan(80)
                expect(caja!.height).toBeGreaterThanOrEqual(6)
            }
            const nombre = page.getByRole('heading', { level: 1 })
            const tintaNombre = await nombre.evaluate((el) => getComputedStyle(el).color)
            // El nombre lleva la marca en su letra, o va sobre el campo de la marca (Moderna) con la
            // tinta que se lee sobre ella.
            const sobreMarca = await nombre.evaluate((el) => !!el.closest('[data-color-marca="primario"]'))
            if (!sobreMarca) {
                expect(tintaNombre).not.toBe('rgb(23, 19, 15)')
                expect(tintaNombre).not.toBe('rgb(57, 42, 32)')
                expect(tintaNombre).not.toBe('rgb(23, 29, 43)')
            }
            const colores = await page.evaluate(() => {
                const estilo = getComputedStyle(document.documentElement)
                return Object.fromEntries(
                    [
                        'background',
                        'foreground',
                        'card',
                        'secondary',
                        'primary',
                        'primary-foreground',
                        'muted-foreground',
                    ].map((token) => [token, estilo.getPropertyValue(`--${token}`).trim()])
                )
            })
            expect(colores.background).toBe(BASES_PLANTILLA[plantilla].fondo)
            expect(colores.foreground).toBe(BASES_PLANTILLA[plantilla].texto)
            expect(colores.card).toBe(BASES_PLANTILLA[plantilla].superficie)
            for (const fondo of [colores.background, colores.card, colores.secondary]) {
                for (const tinta of [colores.foreground, colores.primary, colores['muted-foreground']]) {
                    expect(contraste(tinta, fondo)).toBeGreaterThanOrEqual(4.5)
                }
            }
            expect(contraste(colores.primary, colores['primary-foreground'])).toBeGreaterThanOrEqual(4.5)
            await sinDesborde(page)
            await page.evaluate(() => document.fonts.ready)
            if (process.env.TIENDA_SHOTS) {
                await mkdir(process.env.TIENDA_SHOTS, { recursive: true })
                await page.screenshot({
                    path: `${process.env.TIENDA_SHOTS}/${plantilla}-rojo-azul-${width}.png`,
                    fullPage: true,
                })
            }
            // El detalle vive en un portal: también debe recibir la paleta de la tienda.
            await page
                .locator('main')
                .getByRole('button', { name: /Pan de campo/ })
                .click()
            const detalle = page.getByRole('dialog')
            await expect(detalle).toBeVisible()
            expect(
                await detalle.evaluate((elemento) =>
                    getComputedStyle(elemento).getPropertyValue('--background').trim()
                )
            ).toBe(colores.background)
            await sinDesborde(page)
            expect(errores).toEqual([])
        })
    }
}
