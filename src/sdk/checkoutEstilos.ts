/**
 * CSS del checkout de Páginas. Va con el prefijo `piru-checkout-` y toma todo de variables
 * (`--pc-*`) que el componente setea con las props de diseño. No depende de Tailwind: el sitio
 * publicado sólo trae su propio CSS.
 */
export const CSS_CHECKOUT = `
.piru-checkout-velo{position:fixed;inset:0;z-index:2147483000;background:rgba(10,10,10,.5);display:flex;align-items:flex-end;justify-content:center;animation:piru-checkout-aparecer .18s ease-out}
.piru-checkout-velo[data-pagina=true]{align-items:stretch;padding:0;background:transparent}
@media (min-width:720px){.piru-checkout-velo{align-items:center;padding:24px}}
.piru-checkout{--pc-acento:#141414;--pc-acento-texto:#fff;--pc-texto:#141414;--pc-suave:color-mix(in srgb, var(--pc-texto) 55%, transparent);--pc-superficie:#fff;--pc-linea:#e7e5e2;--pc-radio:18px;--pc-fuente:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;position:relative;display:flex;flex-direction:column;width:100%;max-width:560px;max-height:92dvh;background:var(--pc-superficie);color:var(--pc-texto);border-radius:var(--pc-radio) var(--pc-radio) 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.18);font-family:var(--pc-fuente);font-size:15px;line-height:1.45;animation:piru-checkout-subir .24s cubic-bezier(.2,.8,.2,1)}
@media (min-width:720px){.piru-checkout{border-radius:var(--pc-radio)}}
.piru-checkout[data-variante=pagina]{width:100%;max-width:none;height:100dvh;max-height:none;border-radius:0;background:var(--pc-superficie)}
.piru-checkout *{box-sizing:border-box}
.piru-checkout-cabecera{display:flex;align-items:center;gap:12px;padding:14px 18px 8px;flex:none}
.piru-checkout[data-variante=pagina] .piru-checkout-cabecera{width:100%;max-width:720px;margin:0 auto;padding-top:20px}
.piru-checkout-titulo{flex:1;min-width:0;margin:0;font-size:17px;font-weight:750;letter-spacing:-.01em}
.piru-checkout-icono{display:grid;place-items:center;width:36px;height:36px;flex:none;border:0;border-radius:999px;background:transparent;color:inherit;cursor:pointer}
.piru-checkout-icono:hover{background:color-mix(in srgb, var(--pc-texto) 7%, transparent)}
.piru-checkout-progreso{display:flex;gap:6px;flex:1;align-items:center}
.piru-checkout-progreso span{height:5px;flex:1;border-radius:999px;background:color-mix(in srgb, var(--pc-texto) 14%, transparent);transition:background .2s}
.piru-checkout-progreso span.activo{background:var(--pc-texto)}
.piru-checkout-paso-numero{flex:none;font-size:12px;font-weight:700;color:var(--pc-suave);font-variant-numeric:tabular-nums}
.piru-checkout-cuerpo{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:8px 18px 20px;display:flex;flex-direction:column;gap:18px}
.piru-checkout[data-variante=pagina] .piru-checkout-cuerpo{width:100%;max-width:720px;margin:0 auto;padding:12px 18px 28px}
.piru-checkout-pie{flex:none;padding:14px 18px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--pc-linea);background:var(--pc-superficie)}
.piru-checkout[data-variante=pagina] .piru-checkout-pie{width:100%;max-width:720px;margin:0 auto;border-top:1px solid var(--pc-linea)}
.piru-checkout-seccion{display:flex;flex-direction:column;gap:12px;min-width:0}
.piru-checkout-seccion > h3{margin:0;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--pc-suave)}
.piru-checkout-ayuda{margin:0;font-size:13px;color:var(--pc-suave)}
.piru-checkout-campo{display:flex;flex-direction:column;gap:6px;min-width:0}
.piru-checkout-campo > label{font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--pc-suave)}
.piru-checkout-campo input,.piru-checkout-campo textarea,.piru-checkout-campo select{width:100%;min-height:46px;border:1px solid var(--pc-linea);border-radius:calc(var(--pc-radio) * .66);background:color-mix(in srgb, var(--pc-texto) 4%, var(--pc-superficie));color:inherit;font:inherit;padding:10px 12px;outline:none}
.piru-checkout-campo textarea{min-height:86px;resize:vertical}
.piru-checkout-campo input:focus-visible,.piru-checkout-campo textarea:focus-visible,.piru-checkout-campo select:focus-visible,.piru-checkout-tarjeta:focus-visible,.piru-checkout-boton:focus-visible,.piru-checkout-icono:focus-visible,.piru-checkout-enlace:focus-visible{outline:2px solid var(--pc-acento);outline-offset:2px}
.piru-checkout-fila{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.piru-checkout-tarjetas{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.piru-checkout-tarjetas.una{grid-template-columns:1fr}
.piru-checkout-tarjeta{display:flex;align-items:center;gap:10px;min-height:54px;width:100%;border:1px solid var(--pc-linea);border-radius:calc(var(--pc-radio) * .66);background:transparent;color:inherit;padding:12px;text-align:left;cursor:pointer;font:inherit;transition:background .15s,border-color .15s}
.piru-checkout-tarjeta:hover{background:color-mix(in srgb, var(--pc-texto) 4%, transparent)}
.piru-checkout-tarjeta[aria-pressed=true]{border-color:var(--pc-acento);background:color-mix(in srgb, var(--pc-acento) 9%, transparent)}
.piru-checkout-tarjeta[disabled]{opacity:.45;cursor:not-allowed}
.piru-checkout-tarjeta-texto{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.piru-checkout-tarjeta-texto strong{font-size:14px;font-weight:700}
.piru-checkout-tarjeta-texto small{font-size:12px;color:var(--pc-suave)}
.piru-checkout-tarjeta svg{flex:none}
.piru-checkout-tarjeta .piru-checkout-check{color:var(--pc-acento)}
.piru-checkout-aviso{margin:0;display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:calc(var(--pc-radio) * .6);background:color-mix(in srgb, #b42318 10%, var(--pc-superficie));color:#b42318;font-size:13px;font-weight:600}
.piru-checkout-aviso.info{background:color-mix(in srgb, var(--pc-acento) 9%, var(--pc-superficie));color:var(--pc-texto)}
.piru-checkout-aviso.ok{background:color-mix(in srgb, #157347 12%, var(--pc-superficie));color:#157347}
.piru-checkout-aviso svg{flex:none;margin-top:1px}
.piru-checkout-resumen{display:flex;flex-direction:column;gap:7px;padding:12px 14px;border-radius:calc(var(--pc-radio) * .7);background:color-mix(in srgb, var(--pc-texto) 5%, var(--pc-superficie))}
.piru-checkout-resumen-fila{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:var(--pc-suave)}
.piru-checkout-resumen-fila strong,.piru-checkout-resumen-fila span:last-child{color:var(--pc-texto);font-weight:600;font-variant-numeric:tabular-nums}
.piru-checkout-resumen-total{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-top:1px dashed var(--pc-linea);padding-top:9px;margin-top:2px;font-size:15px;font-weight:750}
.piru-checkout-resumen-total span:last-child{font-size:22px;font-variant-numeric:tabular-nums}
.piru-checkout-total-pie{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;font-size:13px;color:var(--pc-suave)}
.piru-checkout-total-pie strong{font-size:24px;color:var(--pc-texto);font-variant-numeric:tabular-nums}
.piru-checkout-boton{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border:0;border-radius:999px;background:var(--pc-acento);color:var(--pc-acento-texto);font:700 15px/1.2 inherit;padding:10px 18px;cursor:pointer;transition:transform .15s,opacity .15s}
.piru-checkout-boton:active{transform:scale(.99)}
.piru-checkout-boton:disabled{opacity:.45;cursor:not-allowed}
.piru-checkout-boton.secundario{background:transparent;color:var(--pc-texto);border:1px solid var(--pc-linea)}
.piru-checkout-boton.whatsapp{background:#25d366;color:#fff}
.piru-checkout-enlace{display:inline-flex;align-items:center;gap:5px;border:0;background:none;padding:2px;color:inherit;font:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.piru-checkout-lineas{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.piru-checkout-lineas li{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid color-mix(in srgb, var(--pc-texto) 8%, transparent)}
.piru-checkout-lineas li:last-child{border-bottom:0}
.piru-checkout-lineas-foto{width:44px;height:44px;border-radius:calc(var(--pc-radio) * .45);object-fit:cover;background:color-mix(in srgb, var(--pc-texto) 8%, var(--pc-superficie));flex:none}
.piru-checkout-lineas-texto{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.piru-checkout-lineas-texto strong{font-size:14px}
.piru-checkout-lineas-texto small{font-size:12px;color:var(--pc-suave)}
.piru-checkout-lineas-precio{flex:none;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}
.piru-checkout-exito{display:flex;flex-direction:column;gap:16px;align-items:stretch;padding:8px 0 4px}
.piru-checkout-exito-icono{display:grid;place-items:center;width:52px;height:52px;border-radius:999px;background:color-mix(in srgb, #157347 14%, var(--pc-superficie));color:#157347;margin:0 auto}
.piru-checkout-exito h2{margin:0;text-align:center;font-size:26px;line-height:1.15;letter-spacing:-.02em}
.piru-checkout-exito > p{margin:0;text-align:center;color:var(--pc-suave);font-size:14px}
.piru-checkout-pago{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:calc(var(--pc-radio) * .7);background:color-mix(in srgb, var(--pc-texto) 5%, var(--pc-superficie))}
.piru-checkout-pago strong{font-size:14px}
.piru-checkout-pago p{margin:0;font-size:13px;color:var(--pc-suave)}
.piru-checkout-copiar{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;border:1px solid var(--pc-linea);border-radius:calc(var(--pc-radio) * .55);background:var(--pc-superficie);color:inherit;padding:10px 12px;font:inherit;text-align:left;cursor:pointer}
.piru-checkout-copiar small{display:block;font-size:11px;color:var(--pc-suave)}
.piru-checkout-copiar strong{font-size:14px}
.piru-checkout-cargando{display:flex;align-items:center;justify-content:center;gap:8px;padding:28px 0;color:var(--pc-suave);font-size:14px}
.piru-checkout-spin{animation:piru-checkout-girar 1s linear infinite}
.piru-checkout-preview{border:1px dashed var(--pc-linea);border-radius:calc(var(--pc-radio) * .6);padding:10px 12px;font-size:12px;color:var(--pc-suave)}
.piru-checkout-sin-stock{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:24px 0;color:var(--pc-suave)}
@keyframes piru-checkout-aparecer{from{opacity:0}}
@keyframes piru-checkout-subir{from{transform:translateY(24px);opacity:0}}
@keyframes piru-checkout-girar{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.piru-checkout-velo,.piru-checkout{animation:none}.piru-checkout-boton{transition:none}}
`
