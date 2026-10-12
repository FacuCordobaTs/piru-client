import { BarChart3, ChevronRight, LayoutDashboard, Link2, Receipt, Sparkles, UtensilsCrossed, Users } from 'lucide-react'
import { Escena } from './Escena'
import { Toque } from './Toque'
import { d, useSecuencia } from './animacion'
import type { DatosDemo } from './datos'

// Las secciones del panel del local (admin): la operación y, en Clientes, su marketing.
const SECCIONES = [
  { Icono: Receipt, nombre: 'Pedidos', texto: 'Los de hoy' },
  { Icono: UtensilsCrossed, nombre: 'Menú', texto: 'Productos y precios' },
  { Icono: Users, nombre: 'Clientes', texto: 'Tu base' },
  { Icono: Link2, nombre: 'Campañas', texto: 'Links medidos' },
  { Icono: Sparkles, nombre: 'Puntos', texto: 'El club' },
  { Icono: BarChart3, nombre: 'Estadísticas', texto: 'Tus números' },
]

/**
 * Paso 5: el botón que aparece arriba de la tienda (IslaPanelDemo, con su mismo dibujo) y el panel
 * al que lleva. El dedo lo toca en cada vuelta y las secciones del panel se van marcando.
 */
export function PanelAdmin({ datos }: { datos: DatosDemo }) {
  const n = useSecuencia(1100, 0)
  const resaltada = n % SECCIONES.length
  const toca = resaltada === 0
  return (
    <Escena
      etiqueta={`Arriba de la tienda, el botón «Ver tu panel de administrador» lleva al panel de ${datos.local}: pedidos, menú, clientes, campañas, puntos y estadísticas.`}
    >
      <div className="e-baja absolute left-[46px] top-[12px] w-[268px]" style={d(100)}>
        <div
          className={`relative flex items-center gap-2.5 rounded-full bg-white/90 py-1.5 pl-1.5 pr-3 text-ink shadow-[0_12px_28px_-12px_rgb(0_0_0/.45),inset_0_1px_0_rgb(255_255_255/.8)] ring-1 ring-black/5 transition-[scale] duration-200 ${toca ? 'scale-[.97]' : ''}`}
        >
          <span className="relative grid size-[30px] shrink-0 place-items-center rounded-full bg-brand text-white">
            <span className="e-latido absolute inset-0 rounded-full" />
            <LayoutDashboard size={15} />
          </span>
          <span className="h-5 w-px bg-current opacity-20" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[11.5px] font-semibold">Ver tu panel de administrador</span>
            <span className="block truncate text-[9.5px] text-ink-3">Pedidos, menú y clientes</span>
          </span>
          <ChevronRight size={14} className="shrink-0 opacity-60" />
          {toca && <Toque vuelta={n} claro={false} />}
        </div>
      </div>

      <svg className="absolute inset-0" width={360} height={280} viewBox="0 0 360 280" fill="none" aria-hidden>
        <path d="M 180 58 L 180 82" stroke="#FF7A00" strokeWidth={2} strokeLinecap="round" opacity={0.6} className="e-hormigas" />
      </svg>

      <div className="e-sube absolute left-[14px] top-[86px] w-[332px] overflow-hidden rounded-[14px] bg-white shadow-[0_0_0_1px_#ECE4D8,0_24px_40px_-24px_rgb(40_24_8/.55)]" style={d(350)}>
        <div className="flex h-[22px] items-center gap-1.5 border-b border-black/5 bg-[#F3EEE6] px-2.5">
          <span className="size-[7px] rounded-full bg-[#FF5F57]" />
          <span className="size-[7px] rounded-full bg-[#FEBC2E]" />
          <span className="size-[7px] rounded-full bg-[#28C840]" />
          <span className="mx-auto rounded-[5px] bg-white/85 px-2.5 py-px text-[8.5px] font-medium text-[#6b6258]">admin.piru.app</span>
        </div>
        <div className="p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[12px] font-semibold text-ink">Panel de {datos.local}</p>
            <span className="e-pop shrink-0 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-white" style={d(1100)}>
              1 pedido nuevo
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {SECCIONES.map((s, i) => (
              <div key={s.nombre} className="e-pop" style={d(500 + i * 70)}>
                <div
                  className={`flex h-[58px] flex-col justify-between rounded-[11px] p-2 ring-1 transition-[box-shadow,background-color] duration-300 ${
                    i === resaltada ? 'bg-brand-soft/70 ring-2 ring-brand' : 'bg-white ring-line'
                  }`}
                >
                  <span
                    className={`grid size-[22px] place-items-center rounded-md transition-colors duration-300 ${
                      i === resaltada ? 'bg-brand text-white' : 'bg-sand text-ink-2'
                    }`}
                  >
                    <s.Icono size={12} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[10.5px] font-semibold leading-tight text-ink">{s.nombre}</p>
                    <p className="truncate text-[8.5px] text-ink-3">{s.texto}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Escena>
  )
}
