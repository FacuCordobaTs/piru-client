import { BadgePercent, Check, Gift, Truck } from 'lucide-react'
import { CLIENTA_DEMO, CONFIG_PUNTOS_DEMO, pesos } from '@/lib/demo'
import { Escena } from './Escena'
import { d, useContador } from './animacion'
import type { DatosDemo } from './datos'

const TOPE = 1000
const RUTA = 'M 104 212 C 150 236, 196 150, 246 112'

/**
 * Paso 4: un pedido cobrado le suma puntos a Martina (1 cada $100, la regla por defecto del club)
 * y llega a los 740 que tiene en la demo: ya alcanza el envío gratis o el descuento, y le falta
 * poco para un producto del local.
 */
export function ClubPuntos({ datos }: { datos: DatosDemo }) {
  const [a, b] = datos.destacados
  const suma = Math.min(400, Math.max(20, Math.floor(a.precio / CONFIG_PUNTOS_DEMO.pesosPorPunto)))
  const saldo = useContador(CLIENTA_DEMO.puntos, 1300, 1700, CLIENTA_DEMO.puntos - suma)
  const premios = [
    { Icono: Truck, nombre: 'Envío gratis', puntos: CONFIG_PUNTOS_DEMO.puntosEnvioGratis },
    { Icono: BadgePercent, nombre: `${CONFIG_PUNTOS_DEMO.descuentoValor}% OFF`, puntos: CONFIG_PUNTOS_DEMO.descuentoPuntosCosto },
    { Icono: Gift, nombre: `${b.nombre} gratis`, puntos: TOPE },
  ]
  return (
    <Escena
      etiqueta={`Un pedido cobrado le suma ${suma} puntos a ${CLIENTA_DEMO.corto}, que llega a ${CLIENTA_DEMO.puntos} en el club de ${datos.local}: ya puede canjear el envío gratis o el descuento.`}
    >
      <div className="e-izquierda e-tarjeta absolute left-[8px] top-[22px] w-[152px] p-3" style={d(0)}>
        <p className="text-[12px] font-semibold text-ink">Pedido #1302</p>
        <p className="truncate text-[10px] text-ink-3">{CLIENTA_DEMO.nombre}</p>
        <div className="my-2 border-t border-dashed border-line" />
        <div className="flex justify-between gap-2 text-[10.5px] text-ink-2">
          <span className="truncate">1 × {a.nombre}</span>
          <span className="shrink-0 tabular-nums">{pesos(a.precio)}</span>
        </div>
        <div className="my-2 border-t border-dashed border-line" />
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold text-ink">Total</span>
          <span className="text-[13.5px] font-bold tabular-nums text-ink">{pesos(a.precio)}</span>
        </div>
        <span
          className="e-pop mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-700"
          style={d(500)}
        >
          <Check size={10} strokeWidth={3} />
          Cobrado
        </span>
        <p className="e-sube mt-2 rounded-[10px] bg-brand-soft px-2 py-1.5 text-[10.5px] font-semibold text-brand-deep" style={d(800)}>
          Suma +{suma} puntos
        </p>
      </div>

      <span
        className="e-vuela absolute left-0 top-0 z-10 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-bold text-white shadow-[0_8px_18px_-6px_rgb(255_122_0/.8)]"
        style={d(1050, { '--ruta': `path("${RUTA}")` })}
      >
        +{suma}
      </span>

      <div className="e-derecha e-tarjeta absolute left-[148px] top-[34px] w-[204px] p-3.5" style={d(300)}>
        <p className="truncate text-[9px] font-semibold uppercase tracking-[.08em] text-ink-3">Club {datos.local}</p>
        <p className="text-[11.5px] font-semibold text-ink">{CLIENTA_DEMO.nombre}</p>
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[30px] font-bold leading-none tracking-tight tabular-nums text-ink">
            {saldo.toLocaleString('es-AR')}
          </span>
          <span className="text-[11px] font-medium text-ink-3">puntos</span>
        </p>
        <div className="relative mt-2.5 h-[7px] rounded-full bg-line/80">
          <div className="h-full rounded-full bg-brand" style={{ width: `${(saldo / TOPE) * 100}%` }} />
          {premios.slice(0, 2).map((p) => (
            <span
              key={p.puntos}
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-brand-deep"
              style={{ left: `${(p.puntos / TOPE) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-3 grid gap-1.5">
          {premios.map((p, i) => {
            const alcanzado = saldo >= p.puntos
            return (
              <div key={p.nombre} className="e-sube flex items-center gap-2 text-[10.5px]" style={d(600 + i * 120)}>
                <span
                  className={`grid size-[22px] shrink-0 place-items-center rounded-md transition-colors duration-500 ${
                    alcanzado ? 'bg-brand-soft text-brand-deep' : 'bg-sand text-ink-3'
                  }`}
                >
                  <p.Icono size={12} />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.nombre}</span>
                {alcanzado ? (
                  <span className="flex shrink-0 items-center gap-0.5 font-semibold text-emerald-700">
                    <Check size={11} strokeWidth={3} />
                    {p.puntos.toLocaleString('es-AR')}
                  </span>
                ) : (
                  <span className="shrink-0 tabular-nums text-ink-3">faltan {(p.puntos - saldo).toLocaleString('es-AR')}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="e-aparece absolute left-[10px] top-[258px] text-[9.5px] text-ink-3" style={d(1400)}>
        Ejemplo: 1 punto cada {pesos(CONFIG_PUNTOS_DEMO.pesosPorPunto)} · se suman cuando cobrás el pedido
      </p>
    </Escena>
  )
}
