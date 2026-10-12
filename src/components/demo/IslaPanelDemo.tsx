import { ChevronRight, LayoutDashboard } from 'lucide-react'
import { urlPanelDemo } from '@/lib/demo'

/**
 * La isla de la demo: la píldora de vidrio de la tienda de Alfajor (alfajor/src/pages/MenuDelivery.tsx,
 * la de Instagram), con el mismo contra-scroll que el botón "Ver Pedido", pero llevando al panel del
 * local. Entra deslizándose desde arriba cuando `visible` pasa a true (medio segundo después de
 * cerrar el recorrido) y ya no se va. Abre el panel del local en la demo del admin (`/demo/:username`):
 * entra sin login, con datos de ejemplo y un recorrido por el panel.
 */
export function IslaPanelDemo({
  username,
  visible,
  scrollDir,
}: {
  username: string
  visible: boolean
  scrollDir: 'up' | 'down' | null
}) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 flex justify-center z-40 transition-all duration-500 motion-reduce:transition-none ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
    >
      <a
        href={urlPanelDemo(username)}
        aria-label="Ver tu panel de administrador: pedidos, menú y clientes"
        className={`
          mt-3 group relative flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full
          before:absolute before:inset-0 before:rounded-full before:pointer-events-none before:content-[''] before:bg-linear-to-b before:from-white/25 before:via-white/5 before:to-transparent
          hover:scale-[1.02] active:scale-95 transition-all duration-300
          bg-white/20 text-zinc-900 backdrop-blur-xl backdrop-saturate-150 border border-white/40
          shadow-[0_12px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_0_0_1px_rgba(255,255,255,0.3),inset_0_0_16px_rgba(255,255,255,0.3)]
          dark:bg-white/10 dark:text-white dark:backdrop-blur-xl dark:backdrop-saturate-150
          dark:border dark:border-white/15 dark:shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.15),inset_0_0_16px_rgba(255,255,255,0.1)]
          ${scrollDir === 'down' ? '-translate-y-1.5' : scrollDir === 'up' ? 'translate-y-1.5' : 'translate-y-0'}
        `}
      >
        <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/.35)]">
          <span className={`absolute inset-0 rounded-full ${visible ? 'isla-pulso' : ''}`} />
          <LayoutDashboard className="size-[17px]" strokeWidth={2.2} />
        </span>
        <span className="relative z-10 h-6 w-px bg-current opacity-20" />
        <span className="relative z-10 text-left leading-tight">
          <span className="block text-[13px] font-semibold tracking-[-0.005em]">Ver tu panel de administrador</span>
          <span className="block text-[11px] font-medium opacity-65">Pedidos, menú y clientes</span>
        </span>
        <ChevronRight className="relative z-10 size-4 shrink-0 opacity-60 transition-transform duration-300 group-hover:translate-x-0.5" />
      </a>
    </div>
  )
}
