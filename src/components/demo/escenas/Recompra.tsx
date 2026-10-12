import { Check, CheckCheck, MessageCircle, PartyPopper } from 'lucide-react'
import { CLIENTA_DEMO, DESCUENTO_DEMO } from '@/lib/demo'
import { Escena } from './Escena'
import { Toque } from './Toque'
import { d, useSecuencia } from './animacion'
import type { DatosDemo } from './datos'

/**
 * Paso 3: Hoy, con el mensaje para Martina, que se está yendo (lleva 21 días sin pedir y pedía cada
 * 12: más de 1,5 veces su ritmo). El texto es el 2º toque de recompra para "se está yendo", que
 * va con 10% (backend/src/lib/recetas-recompra.ts). Fases: 0 listo · 1 toca "Abrir WhatsApp" ·
 * 2 enviado desde el WhatsApp del local · 3 toca "Marcar enviado" · 4 Martina volvió a pedir.
 */
export function Recompra({ datos }: { datos: DatosDemo }) {
  const n = useSecuencia(1500, 4)
  const fase = n % 5
  const enviado = fase >= 2
  const marcado = fase >= 3
  return (
    <Escena
      etiqueta={`${CLIENTA_DEMO.corto} lleva ${CLIENTA_DEMO.diasSinPedir} días sin pedir en ${datos.local} y Piru la marca como que se está yendo. El mensaje para traerla de vuelta, con ${DESCUENTO_DEMO}% de descuento, se abre listo en el WhatsApp del local; ella vuelve a pedir.`}
    >
      <div className="e-sube e-tarjeta absolute left-[12px] top-[10px] w-[336px] p-3" style={d(0)}>
        <p className="text-[9.5px] font-semibold uppercase tracking-[.08em] text-ink-3">Hoy · mensajes para mandar</p>

        <div className="mt-2 flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-500/10 text-[10.5px] font-bold text-orange-700">
            {CLIENTA_DEMO.iniciales}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-ink">{CLIENTA_DEMO.nombre}</p>
            <p className="truncate text-[10px] text-ink-3">
              Pedía cada ~{CLIENTA_DEMO.cadencia} días · hace {CLIENTA_DEMO.diasSinPedir} que no pide
            </p>
          </div>
          <span
            className="e-pop shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_6px_14px_-6px_rgb(249_115_22/.8)]"
            style={d(500)}
          >
            Se está yendo
          </span>
        </div>

        <div className="mt-2 rounded-[12px] bg-[#EFEAE2] p-2">
          <div className="e-burbuja e-sube ml-auto max-w-[272px] px-2.5 py-1.5 text-[10.5px] leading-[1.4]" style={d(350)}>
            <p>
              Volvé a tu ritmo, {CLIENTA_DEMO.corto}: tu pedido de siempre en {datos.local} te está esperando.
            </p>
            <p className="mt-1">
              Y esta vez va con {DESCUENTO_DEMO}% de descuento: se aplica solo al entrar desde acá.
            </p>
            <p className="mt-1 truncate text-[#027EB5] underline decoration-[#027EB5]/40">{datos.enlace}?tk=v1.4c9e…</p>
            <p className="mt-0.5 flex items-center justify-end gap-1 text-[8.5px] text-[#667781]">
              19:02
              <CheckCheck
                size={12}
                className={`transition-colors duration-500 ${enviado ? 'text-[#53BDEB]' : 'text-[#8696A0]'}`}
              />
            </p>
          </div>
        </div>

        {fase === 4 ? (
          <div
            key="volvio"
            className="e-pop mt-2.5 flex h-8 items-center justify-center gap-2 rounded-full bg-emerald-600 text-[11.5px] font-semibold text-white"
          >
            <PartyPopper size={14} />
            {CLIENTA_DEMO.corto} volvió a pedir con su {DESCUENTO_DEMO}%
          </div>
        ) : (
          <div className="mt-2.5 flex gap-2">
            <span
              className={`relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1FAF55] text-[11.5px] font-semibold text-white transition-[scale] duration-200 ${fase === 1 ? 'scale-[.97]' : ''}`}
            >
              <MessageCircle size={14} />
              Abrir WhatsApp
              {fase === 1 && <Toque vuelta={n} />}
            </span>
            <span
              className={`relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[11.5px] font-semibold ring-1 transition-[scale,background-color,color] duration-300 ${
                marcado ? 'bg-ink text-white ring-ink' : 'text-ink ring-line'
              } ${fase === 3 ? 'scale-[.97]' : ''}`}
            >
              <Check size={14} />
              {marcado ? 'Enviado' : 'Marcar enviado'}
              {fase === 3 && <Toque vuelta={n} />}
            </span>
          </div>
        )}
      </div>
    </Escena>
  )
}
