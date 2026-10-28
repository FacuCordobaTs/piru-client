/**
 * CSS de las piezas que pone el runtime (pie, hoja de opciones, avisos, error, canjes). Va con el
 * prefijo `piru-` para no chocar con el CSS del sitio y toma el acento de `--piru-acento`.
 */
export const CSS_RUNTIME = `
.piru-pie{display:flex;flex-wrap:wrap;justify-content:center;gap:.25rem .75rem;padding:1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom));font:500 12px/1.4 ui-sans-serif,system-ui,sans-serif;color:var(--piru-footer-fg,#6b6b6b);background:var(--piru-footer-bg,transparent);text-align:center}
.piru-pie a{color:inherit;text-decoration:underline;text-underline-offset:3px}
.piru-velo{position:fixed;inset:0;z-index:2147483000;background:rgba(10,10,10,.5);display:flex;align-items:flex-end;justify-content:center;animation:piru-aparecer .18s ease-out}
@media (min-width:640px){.piru-velo{align-items:center;padding:24px}}
.piru-hoja{--piru-tinta:#141414;--piru-suave:#6b6b6b;--piru-linea:#e7e5e2;position:relative;width:100%;max-width:520px;max-height:92dvh;display:flex;flex-direction:column;background:#fff;color:var(--piru-tinta);border-radius:20px 20px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.18);font:400 15px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;animation:piru-subir .24s cubic-bezier(.2,.8,.2,1)}
@media (min-width:640px){.piru-hoja{border-radius:20px}}
.piru-hoja *{box-sizing:border-box}
.piru-hoja-scroll{overflow-y:auto;overscroll-behavior:contain}
.piru-hoja-foto{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;border-radius:20px 20px 0 0;background:#f2f0ed}
.piru-hoja-cuerpo{padding:18px 20px 8px}
.piru-hoja h2{margin:0;font-size:21px;line-height:1.2;font-weight:750;letter-spacing:-.01em}
.piru-hoja-desc{margin:6px 0 0;color:var(--piru-suave);font-size:14px}
.piru-hoja-precio{margin-top:8px;font-weight:700;font-variant-numeric:tabular-nums}
.piru-hoja-precio s{color:var(--piru-suave);font-weight:500;margin-left:6px}
.piru-grupo{border:0;margin:18px 0 0;padding:0}
.piru-grupo legend{display:flex;justify-content:space-between;width:100%;padding:0 0 8px;font-weight:700;font-size:14px}
.piru-grupo legend small{font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--piru-suave)}
.piru-opcion{display:flex;align-items:center;gap:12px;min-height:48px;padding:10px 2px;border-top:1px solid var(--piru-linea);cursor:pointer}
.piru-opcion:first-of-type{border-top:0}
.piru-opcion input{width:20px;height:20px;margin:0;accent-color:var(--piru-acento,#141414);flex:none}
.piru-opcion span{flex:1}
.piru-opcion em{font-style:normal;color:var(--piru-suave);font-variant-numeric:tabular-nums;font-size:14px}
.piru-nota{width:100%;min-height:76px;resize:vertical;padding:10px 12px;border:1px solid var(--piru-linea);border-radius:12px;font:inherit;color:inherit}
.piru-nota:focus-visible,.piru-opcion input:focus-visible,.piru-boton:focus-visible,.piru-cerrar:focus-visible,.piru-cantidad button:focus-visible{outline:2px solid var(--piru-acento,#141414);outline-offset:2px}
.piru-hoja-pie{display:flex;gap:12px;align-items:center;padding:14px 20px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--piru-linea);background:#fff;border-radius:0 0 20px 20px}
.piru-cantidad{display:flex;align-items:center;border:1px solid var(--piru-linea);border-radius:999px;height:48px}
.piru-cantidad button{width:44px;height:46px;border:0;background:none;font-size:20px;cursor:pointer;color:inherit;border-radius:999px}
.piru-cantidad button:disabled{opacity:.3;cursor:default}
.piru-cantidad output{min-width:24px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.piru-boton{flex:1;height:48px;border:0;border-radius:999px;padding:0 18px;background:var(--piru-acento,#141414);color:var(--piru-acento-texto,#fff);font:700 15px/1 inherit;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;transition:transform .15s,opacity .15s}
.piru-boton:active{transform:scale(.98)}
.piru-boton:disabled{opacity:.45;cursor:not-allowed}
.piru-cerrar{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:999px;border:0;background:rgba(255,255,255,.92);box-shadow:0 1px 6px rgba(0,0,0,.15);font-size:20px;line-height:1;cursor:pointer;color:#141414;z-index:1}
.piru-falta{margin:10px 0 0;font-size:13px;color:#b42318}
.piru-aviso{position:fixed;left:50%;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%);z-index:2147483001;max-width:min(92vw,420px);padding:12px 18px;border-radius:14px;background:#141414;color:#fff;font:500 14px/1.4 ui-sans-serif,system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.25);animation:piru-subir .2s ease-out}
.piru-aviso[data-tono=ok]{background:#14532d}
.piru-aviso[data-tono=error]{background:#7f1d1d}
.piru-error{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;font:400 16px/1.5 ui-sans-serif,system-ui,sans-serif;color:#141414;background:#fafaf9}
.piru-error h1{margin:0;font-size:22px}
.piru-error a{color:#141414;font-weight:700}
.piru-canjes{margin:32px auto;padding:0 16px;max-width:1080px;font-family:inherit}
.piru-canjes h2{margin:0 0 4px;font-size:22px}
.piru-canjes p{margin:0 0 14px;opacity:.75;font-size:14px}
.piru-canjes ul{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
.piru-canjes li{display:flex;gap:12px;align-items:center;padding:10px;border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 18%,transparent);border-radius:14px}
.piru-canjes img{width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none}
.piru-canjes strong{display:block;font-size:14px}
.piru-canjes span{font-size:13px;opacity:.75}
@keyframes piru-aparecer{from{opacity:0}}
@keyframes piru-subir{from{transform:translateY(24px);opacity:0}}
.piru-aviso{animation-name:piru-aviso}
@keyframes piru-aviso{from{transform:translate(-50%,-16px);opacity:0}}
@media (prefers-reduced-motion:reduce){.piru-velo,.piru-hoja,.piru-aviso{animation:none}}
`
