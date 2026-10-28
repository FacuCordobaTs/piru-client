/**
 * Sube el runtime compilado (`dist-runtime/v1/*.js`) al bucket R2 de Páginas, en `runtime/v1/`.
 * Una vez por versión del runtime, después de `bun scripts/build-runtime.ts`:
 *
 *   bun scripts/subir-runtime.ts            (usa la sesión de wrangler)
 *
 * Los sitios publicados cargan siempre la versión con la que se compilaron; un runtime nuevo
 * se publica como `v2` sin pisar `v1`.
 */
import { readdirSync } from 'node:fs'
import path from 'node:path'

const version = 'v1'
const bucket = process.env.R2_SITIOS_BUCKET || 'piru-sitios'
const dir = path.resolve(import.meta.dir, '..', 'dist-runtime', version)
for (const archivo of readdirSync(dir).filter((a) => a.endsWith('.js'))) {
    const destino = `${bucket}/runtime/${version}/${archivo}`
    const proc = Bun.spawnSync(
        ['bunx', 'wrangler', 'r2', 'object', 'put', destino, '--file', path.join(dir, archivo), '--content-type', 'text/javascript; charset=utf-8', '--cache-control', 'public, max-age=31536000, immutable', '--remote'],
        { stdout: 'inherit', stderr: 'inherit' }
    )
    if (proc.exitCode !== 0) throw new Error(`No se subió ${archivo}`)
}
