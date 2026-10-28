# Subdominios de tienda (`*.piru.app`)

El proyecto Cloudflare Pages de `web/` publica la tienda estándar en `my.piru.app`. Pages no admite
dominios comodín, así que este Worker hace de proxy para `<tienda>.piru.app` y deja que React
resuelva la tienda a partir del hostname.

El Worker no crea tiendas: el alta, el catálogo y los pedidos siguen en el backend y el admin. El
diseño propio, si existe, se registra en `src/store-sites/registry.ts`.

## Agregar una tienda

1. Crear o verificar la tienda con su `username` en el alta habitual.
2. Copiar `src/store-sites/burgers10/` a `src/store-sites/<subdominio>/` y cambiar el diseño.
3. Registrar el subdominio y su `username` en `src/store-sites/registry.ts`.
4. Agregar sus metadatos en `src/store-sites/meta.ts` y sus imágenes en `public/sites/<subdominio>/`.
5. Publicar `web/`. No hay que tocar el Worker ni Cloudflare para cada tienda nueva.

Una tienda sin entrada en el registro igual funciona en su subdominio, con la plantilla estándar.

## Desplegar el Worker (una vez)

1. Publicar `web/` en Cloudflare Pages con `VITE_API_URL=https://api.piru.app/api`, comando
   `bun run build` y salida `dist`.
2. Anotar el dominio de producción del proyecto (por ejemplo `https://piru-web.pages.dev`). No usar
   una preview de rama.
3. En `wrangler.toml`, reemplazar `CLIENT_PAGES_ORIGIN` por ese origen. Es una URL pública, no un
   secreto, y debe quedar en `[vars]`: una variable puesta a mano en el dashboard se pierde en el
   próximo `wrangler deploy`.
4. Desde `web/`, con sesión de Cloudflare:

   ```bash
   bunx wrangler login
   bunx wrangler deploy --config cloudflare/wrangler.toml
   ```

5. DNS de la zona `piru.app`: `AAAA`, nombre `*`, contenido `100::`, **Proxied** (nube naranja).
   Es la entrada del Worker, no un servidor de origen. Conservar los registros específicos de
   `api`, `admin`, correo y demás servicios.
6. Workers Routes: agregar `*.piru.app/*` al Worker `piru-store-subdomains`. Usar **Route**, no
   Custom Domain.
7. Agregar rutas más específicas **sin Worker** para cada subdominio de infraestructura:

   - `api.piru.app/*`
   - `admin.piru.app/*`
   - `www.piru.app/*`
   - `info.piru.app/*`
   - `marketing.piru.app/*`
   - `mozos.piru.app/*`
   - `interno.piru.app/*`
   - `images.piru.app/*`
   - `my.piru.app/*` (la tienda estándar)
   - `pages.piru.app/*` (el editor de Páginas)
   - cualquier otro servicio (correo, CDN, staging…)

   `piru.app` (apex) queda fuera de la ruta comodín.
8. En SSL/TLS → Edge Certificates, verificar que haya un certificado activo que cubra `*.piru.app`.
   No hace falta emitir uno por tienda.
9. Probar `https://burgers10.piru.app/`, `/success`, `/c/:slug`, un pedido completo, y confirmar que
   `admin.piru.app`, `api.piru.app` y `my.piru.app` siguen funcionando.

El backend debe estar desplegado con el CORS de tiendas propias
(`backend/src/lib/public-store-origin.ts`) antes de probar el checkout desde el subdominio.

## Páginas (sitios propios)

El mismo Worker sirve los sitios de Páginas (`paginas.ts`, docs/PAGINAS_PROPIAS.md): si existe
`sitio:<slug>` en el KV `SITIOS_KV`, arma el HTML del sitio y sirve `/_piru/*` desde el bucket R2
`piru-sitios`; si no, sigue el proxy de arriba. Los bindings están en `wrangler.toml`. El runtime se
compila y se sube una vez por versión:

```bash
bun scripts/build-runtime.ts
bun scripts/subir-runtime.ts
```

`pages.piru.app` (el editor, proyecto Pages `piru-paginas`) tiene su ruta sin Worker, como el resto
de la infraestructura.

## Desarrollo local

Desde `web/`, `bun run dev` y abrir `http://burgers10.localhost:5173`. `*.localhost` resuelve a
127.0.0.1 en los navegadores modernos. El Worker no corre en local: se prueba la app directo contra
`VITE_API_URL`.

Para probar la API local desde ese origen hay que habilitarlo en el CORS de desarrollo; el CORS de
producción sólo admite `https://*.piru.app`.

## Qué hace el Worker

- Resuelve el slug con `src/lib/store-domain.ts` y descarta hosts de infraestructura.
- Sólo acepta `GET` y `HEAD`; el resto responde 405.
- Valida `CLIENT_PAGES_ORIGIN` (https, `*.pages.dev`, sin puerto ni ruta).
- Pide el mismo path y query al origen Pages.
- Borra `Host`, `Cookie` y `Authorization`; no devuelve `Set-Cookie`.
- Reescribe las redirecciones del mismo Pages al host de la tienda.
- Para tiendas registradas, escribe título, descripción, ícono, `theme-color` y Open Graph/Twitter
  en el HTML. Es lo que ven WhatsApp, Instagram y los buscadores, que no ejecutan JavaScript.

## Límites

- El Worker no reenvía cookies ni sesiones: el navegador tiene almacenamiento separado por origen.
- El carrito de `my.piru.app/<username>` no se comparte con `<username>.piru.app`.
- Los pagos y mutaciones van directos a `api.piru.app`.
- Un subdominio nuevo de infraestructura necesita su exclusión de Route y sumarse a los reservados.
- El tráfico consume cuota de Workers.

## Revertir

Quitar la Route `*.piru.app/*` y el registro DNS comodín. Las tiendas siguen disponibles en
`my.piru.app/<username>`; los dominios propios no dependen de este Worker. Los cambios de código
(diseños y registro) se revierten publicando otra vez `web/`.

## Validación

```bash
# desde web/
bun test tests/store-domain.test.ts tests/store-subdomains.test.ts
bun run build

# desde backend/
bun test src/lib/public-store-origin.test.ts
```

Referencia: [Cloudflare Pages y dominios comodín](https://developers.cloudflare.com/pages/platform/known-issues/),
[Workers Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/).
