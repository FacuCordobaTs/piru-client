import { Crown, Link2 } from 'lucide-react'
import { CLIENTA_DEMO, PEDIDO_DEMO, pesos } from '@/lib/demo'
import { Escena } from './Escena'
import { d } from './animacion'
import type { DatosDemo } from './datos'

// Del pedido en el chat a la ficha de Martina, que suma su pedido número 8.
const RUTA = 'M 100 196 C 100 230, 128 236, 158 224'

/** Paso 2: el pedido llega al WhatsApp del local y la clienta queda guardada con su historia. */
export function ClienteBase({ datos }: { datos: DatosDemo }) {
  const [a, b] = datos.destacados
  const total = a.precio + b.precio
  // Siete pedidos parecidos a éste: el gasto acompaña los precios del local.
  const gastado = Math.round((total * CLIENTA_DEMO.pedidos) / 100) * 100
  const fichas = [
    { titulo: 'Pedidos', valor: String(CLIENTA_DEMO.pedidos + 1), mas: true },
    { titulo: 'Gastó', valor: pesos(gastado + total) },
    { titulo: 'Pide cada', valor: `~${CLIENTA_DEMO.cadencia} días` },
    { titulo: 'Favorito', valor: a.nombre },
  ]
  return (
    <Escena
      etiqueta={`El pedido de ${CLIENTA_DEMO.corto} llega al WhatsApp de ${datos.local} y su ficha se actualiza sola: pedidos, gasto, cada cuánto pide, su favorito y por dónde llegó.`}
    >
      <div
        className="e-izquierda absolute left-[8px] top-[10px] w-[184px] overflow-hidden rounded-[16px] bg-[#EFEAE2] shadow-[0_0_0_1px_rgb(25_21_18/.06),0_18px_34px_-20px_rgb(40_24_8/.5)]"
        style={d(0)}
      >
        <div className="flex items-center gap-2 bg-[#0B6E5C] px-2.5 py-1.5 text-white">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/20 text-[9.5px] font-bold">
            {CLIENTA_DEMO.iniciales}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-semibold leading-tight">{CLIENTA_DEMO.nombre}</p>
            <p className="truncate text-[9px] text-white/70">WhatsApp de {datos.local}</p>
          </div>
        </div>
        <div className="p-2">
          <div className="e-burbuja-entra e-sube px-2.5 py-2 text-[10.5px] leading-[1.38]" style={d(350)}>
            <p className="line-clamp-2">¡Hola {datos.local}! Te paso mi pedido:</p>
            <p className="mt-1 font-semibold">Pedido #{PEDIDO_DEMO} · Delivery</p>
            <p className="truncate">1 × {a.nombre}</p>
            <p className="truncate">1 × {b.nombre}</p>
            <p className="mt-1">
              Total: <b>{pesos(total)}</b>
            </p>
            <p className="text-right text-[8.5px] text-[#667781]">21:04</p>
          </div>
        </div>
      </div>

      <svg className="absolute inset-0" width={360} height={280} viewBox="0 0 360 280" fill="none" aria-hidden>
        <path d={RUTA} stroke="#FF7A00" strokeWidth={2} strokeLinecap="round" opacity={0.55} className="e-hormigas" />
      </svg>
      <span
        className="e-viaja absolute left-0 top-0 size-2.5 rounded-full bg-brand shadow-[0_0_0_4px_rgb(255_122_0/.22)]"
        style={d(900, { '--ruta': `path("${RUTA}")`, '--t': '3s' })}
      />

      <div className="e-derecha e-tarjeta absolute left-[158px] top-[78px] w-[194px] p-3" style={d(600)}>
        <span
          className="e-pop absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-700 ring-1 ring-amber-200"
          style={d(1700)}
        >
          <Crown size={10} strokeWidth={2.4} />
          VIP
        </span>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[12px] font-bold text-brand-deep">
            {CLIENTA_DEMO.iniciales}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-ink">{CLIENTA_DEMO.nombre}</p>
            <p className="text-[10px] text-ink-3">{CLIENTA_DEMO.telefono}</p>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {fichas.map((x, i) => (
            <div key={x.titulo} className="e-sube relative rounded-[10px] bg-sand px-2 py-1.5" style={d(850 + i * 120)}>
              <p className="text-[8.5px] font-semibold uppercase tracking-[.07em] text-ink-3">{x.titulo}</p>
              <p className="mt-0.5 truncate text-[11.5px] font-bold tabular-nums text-ink">{x.valor}</p>
              {x.mas && (
                <span className="e-pop absolute right-1.5 top-1.5 rounded-full bg-emerald-600 px-1.5 text-[9px] font-bold text-white" style={d(1450)}>
                  +1
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="e-aparece mt-2.5 flex items-center gap-1.5 text-[10.5px] text-ink-2" style={d(1450)}>
          <Link2 size={12} className="shrink-0 text-brand" strokeWidth={2.4} />
          <span className="truncate">
            Llegó por <b className="font-semibold text-ink">{CLIENTA_DEMO.llego}</b>
          </span>
        </p>
      </div>
    </Escena>
  )
}
