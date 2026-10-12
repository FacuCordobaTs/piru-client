import { Check, Link2, MessageCircle } from 'lucide-react'
import { Escena } from './Escena'
import { Telefono } from './Telefono'
import { TiendaReplica } from './TiendaReplica'
import { d } from './animacion'
import type { DatosDemo } from './datos'

const ANCHO_CELULAR = 178

/**
 * Paso 1: la tienda del local en un celular que asoma desde abajo del escenario (el recorrido
 * apoya esta escena en el borde inferior), con tres avisos: su link, sin comisiones y el pedido
 * en su WhatsApp.
 */
export function TiendaCelular({ datos }: { datos: DatosDemo }) {
  return (
    <Escena
      etiqueta={`La tienda de ${datos.local} en el celular de un cliente, en ${datos.enlace}: sin comisiones y con el pedido directo al WhatsApp del local.`}
    >
      <div className="e-asoma absolute top-[14px]" style={{ left: (360 - ANCHO_CELULAR) / 2, width: ANCHO_CELULAR, ...d(0) }}>
        <div className="origin-top-left" style={{ transform: `scale(${ANCHO_CELULAR / 412})` }}>
          <Telefono>
            <TiendaReplica datos={datos} />
          </Telefono>
        </div>
      </div>

      <div className="e-pop absolute left-[4px] top-[52px]" style={d(650)}>
        <div className="e-chip e-flota flex items-center gap-2 whitespace-nowrap py-2 pl-2 pr-3" style={d(1800)}>
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          <span className="text-[11.5px] font-semibold leading-tight text-ink">
            Sin comisiones
            <span className="block text-[10px] font-normal text-ink-3">El 100% es tuyo</span>
          </span>
        </div>
      </div>

      <div className="e-pop absolute right-[2px] top-[118px]" style={d(950)}>
        <div className="e-chip e-flota flex items-center gap-2 whitespace-nowrap py-2 pl-2 pr-3" style={d(2400)}>
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
            <MessageCircle size={14} strokeWidth={2.4} />
          </span>
          <span className="text-[11.5px] font-semibold leading-tight text-ink">
            A tu WhatsApp
            <span className="block text-[10px] font-normal text-ink-3">Con todo el detalle</span>
          </span>
        </div>
      </div>

      <div
        className="e-pop absolute left-[14px] top-[208px] flex max-w-[190px] items-center gap-1.5 rounded-full bg-ink py-1.5 pl-2.5 pr-3 text-[11px] font-semibold text-white shadow-[0_12px_24px_-10px_rgb(25_21_18/.7)]"
        style={d(1250)}
      >
        <Link2 size={13} className="shrink-0 text-brand" strokeWidth={2.4} />
        <span className="truncate">{datos.enlace}</span>
      </div>
    </Escena>
  )
}
