/**
 * Compila el runtime `v1` de Páginas (docs/PAGINAS_PROPIAS.md, §7): los módulos compartidos que
 * cargan todos los sitios por import map, el SDK `@piru/tienda`, el boot y la vista previa, y el
 * `.d.ts` del SDK para el editor y la Guía para Claude.
 *
 *   bun scripts/build-runtime.ts            → dist-runtime/v1/*
 *
 * Además copia el runtime a `../sitios/public/_piru/runtime/v1/` (la vista previa del editor lo carga
 * desde pages.piru.app) y los tipos a `../sitios/src/generado/` y
 * `../backend/src/lib/sitios-sdk-tipos.generado.ts` (la guía), si esas carpetas existen. Un mismo
 * build alimenta R2, el editor y la guía: no se desincronizan.
 */
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import ts from 'typescript'

export const RUNTIME_VERSION = 'v1'
const raiz = path.resolve(import.meta.dir, '..')
const salida = path.join(raiz, 'dist-runtime', RUNTIME_VERSION)
const temporal = path.join(raiz, 'node_modules', '.tmp', 'runtime-entradas')
const requerir = createRequire(path.join(raiz, 'package.json'))
const API_URL = process.env.PIRU_API_URL || 'https://api.piru.app/api'

process.env.NODE_ENV = 'production'

/** Envoltura ESM con exports nombrados de un paquete CommonJS (React no publica ESM). */
function envolturaCjs(paquete: string): string {
    const claves = Object.keys(requerir(paquete)).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k) && k !== 'default')
    return [
        `import m from ${JSON.stringify(paquete)}`,
        `export default m`,
        `export const { ${claves.join(', ')} } = m`,
    ].join('\n')
}

const EXTERNOS = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'motion/react', 'react-router', '@piru/tienda']

/** `@/…` → `src/…`, como el alias de Vite. */
const aliasArroba = {
    name: 'alias-arroba',
    setup(build: import('bun').PluginBuilder) {
        build.onResolve({ filter: /^@\// }, (args) => {
            const base = path.join(raiz, 'src', args.path.slice(2))
            for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx', ''])
                if (existsSync(base + ext) && /\.tsx?$/.test(base + ext)) return { path: base + ext }
            return undefined
        })
    },
}

/** Externos por nombre exacto: la opción `external` de Bun también marca los subpaths (`react` →
 * `react/jsx-runtime`), y el módulo de `react/jsx-runtime` terminaría importándose a sí mismo. */
const externosExactos = (lista: string[]) => ({
    name: 'externos-exactos',
    setup(build: import('bun').PluginBuilder) {
        build.onResolve({ filter: /^[^./]/ }, (args) => (lista.includes(args.path) ? { path: args.path, external: true } : undefined))
    },
})

type Modulo = { nombre: string; entrada: string; externos: string[] }

async function main() {
    rmSync(salida, { recursive: true, force: true })
    rmSync(temporal, { recursive: true, force: true })
    mkdirSync(salida, { recursive: true })
    mkdirSync(temporal, { recursive: true })

    const escribir = (nombre: string, codigo: string) => {
        const archivo = path.join(temporal, nombre)
        writeFileSync(archivo, codigo)
        return archivo
    }

    const modulos: Modulo[] = [
        { nombre: 'react', entrada: escribir('react.js', envolturaCjs('react')), externos: [] },
        { nombre: 'react-jsx-runtime', entrada: escribir('react-jsx-runtime.js', envolturaCjs('react/jsx-runtime')), externos: ['react'] },
        { nombre: 'react-dom', entrada: escribir('react-dom.js', envolturaCjs('react-dom')), externos: ['react'] },
        { nombre: 'react-dom-client', entrada: escribir('react-dom-client.js', envolturaCjs('react-dom/client')), externos: ['react', 'react-dom'] },
        { nombre: 'motion', entrada: escribir('motion.js', `export * from 'motion/react'`), externos: ['react', 'react/jsx-runtime', 'react-dom'] },
        { nombre: 'react-router', entrada: escribir('react-router.js', `export * from 'react-router'`), externos: ['react', 'react-dom'] },
        // Sólo para la vista previa del editor: en el sitio publicado lucide va dentro del bundle.
        { nombre: 'lucide', entrada: escribir('lucide.js', `export * from 'lucide-react'`), externos: ['react'] },
        { nombre: 'sdk', entrada: path.join(raiz, 'src/sdk/index.ts'), externos: EXTERNOS.filter((e) => e !== '@piru/tienda') },
        { nombre: 'boot', entrada: path.join(raiz, 'src/sdk/boot.tsx'), externos: EXTERNOS },
        { nombre: 'preview', entrada: path.join(raiz, 'src/sdk/preview.tsx'), externos: EXTERNOS },
    ]

    const hashes: Record<string, string> = {}
    for (const modulo of modulos) {
        const resultado = await Bun.build({
            entrypoints: [modulo.entrada],
            target: 'browser',
            format: 'esm',
            minify: true,
            splitting: false,
            plugins: [externosExactos(modulo.externos), aliasArroba],
            jsx: { runtime: 'automatic', importSource: 'react' },
            define: {
                'process.env.NODE_ENV': '"production"',
                'import.meta.env.VITE_API_URL': JSON.stringify(API_URL),
            },
        })
        if (!resultado.success) {
            for (const log of resultado.logs) console.error(log)
            throw new Error(`No compiló ${modulo.nombre}`)
        }
        const codigo = await resultado.outputs[0].text()
        writeFileSync(path.join(salida, `${modulo.nombre}.js`), codigo)
        hashes[`${modulo.nombre}.js`] = createHash('sha256').update(codigo).digest('hex').slice(0, 16)
        console.log(`  ${modulo.nombre}.js  ${(codigo.length / 1024).toFixed(1)} KB`)
    }

    const dts = generarDts()
    writeFileSync(path.join(salida, 'piru-tienda.d.ts'), dts)
    writeFileSync(path.join(salida, 'manifest.json'), JSON.stringify({ version: RUNTIME_VERSION, hashes }, null, 2))

    const sitios = path.resolve(raiz, '../sitios')
    if (existsSync(sitios)) {
        const destino = path.join(sitios, 'public/_piru/runtime', RUNTIME_VERSION)
        rmSync(destino, { recursive: true, force: true })
        mkdirSync(destino, { recursive: true })
        cpSync(salida, destino, { recursive: true })
        mkdirSync(path.join(sitios, 'src/generado'), { recursive: true })
        writeFileSync(path.join(sitios, 'src/generado/piru-tienda.d.ts'), dts)
        console.log('  → copiado a sitios/')
    }
    const backend = path.resolve(raiz, '../backend/src/lib')
    if (existsSync(backend)) {
        writeFileSync(
            path.join(backend, 'sitios-sdk-tipos.generado.ts'),
            `// Generado por web/scripts/build-runtime.ts desde web/src/sdk/tipos.ts. No editar a mano.\nexport const TIPOS_SDK = ${JSON.stringify(dts)}\n`
        )
        console.log('  → tipos copiados a backend/')
    }
    rmSync(temporal, { recursive: true, force: true })
}

/** `tipos.ts` → `declare module '@piru/tienda' { … }` con un `export const` por miembro de `ApiTienda`. */
export function generarDts(): string {
    const archivo = path.join(raiz, 'src/sdk/tipos.ts')
    const fuente = ts.createSourceFile(archivo, readFileSync(archivo, 'utf8'), ts.ScriptTarget.Latest, true)
    const api = fuente.statements.find((s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === 'ApiTienda')
    if (!api) throw new Error('tipos.ts no declara ApiTienda')
    const miembros = api.members.map((m) => (m.name as ts.Identifier).text)
    const cuerpo = fuente.statements
        .map((s) => s.getFullText(fuente))
        .join('')
        .replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '')
    const indentado = cuerpo
        .trim()
        .split('\n')
        .map((l) => (l ? `    ${l}` : l))
        .join('\n')
    return [
        '// @piru/tienda — SDK de los sitios de Páginas de Piru. Generado desde web/src/sdk/tipos.ts.',
        "declare module '@piru/tienda' {",
        indentado,
        '',
        ...miembros.map((m) => `    export const ${m}: ApiTienda['${m}']`),
        '}',
        '',
    ].join('\n')
}

if (import.meta.main) await main()
