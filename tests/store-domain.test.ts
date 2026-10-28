import { describe, expect, test } from 'bun:test'
import { isStoreSubdomain, storeSlugFromHostname } from '../src/lib/store-domain'

describe('dominios de tienda', () => {
    test('resuelve el subdominio de producción y de desarrollo', () => {
        expect(storeSlugFromHostname('burgers10.piru.app')).toBe('burgers10')
        expect(storeSlugFromHostname('BURGERS10.PIRU.APP')).toBe('burgers10')
        expect(storeSlugFromHostname('che-milanesa.piru.app')).toBe('che-milanesa')
        expect(storeSlugFromHostname('burgers10.localhost')).toBe('burgers10')
    })

    test('rechaza infraestructura, anidados, guiones inválidos y hosts parecidos', () => {
        for (const host of [
            'piru.app',
            'my.piru.app',
            'api.piru.app',
            'admin.piru.app',
            'www.piru.app',
            'info.piru.app',
            'marketing.piru.app',
            'mozos.piru.app',
            'interno.piru.app',
            'images.piru.app',
            'x.y.piru.app',
            'burgers10.piru.app.evil.com',
            '-burgers10.piru.app',
            'burgers10-.piru.app',
            'a'.repeat(64) + '.piru.app',
        ]) {
            expect(storeSlugFromHostname(host)).toBeNull()
        }
    })

    test('el label cumple las reglas de un subdominio DNS', () => {
        expect(isStoreSubdomain('burgers10')).toBe(true)
        expect(isStoreSubdomain('a')).toBe(false)
        expect(isStoreSubdomain('con_guion_bajo')).toBe(false)
        expect(isStoreSubdomain('con espacio')).toBe(false)
    })
})
