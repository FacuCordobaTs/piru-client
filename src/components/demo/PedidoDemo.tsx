import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { LayoutDashboard } from 'lucide-react'
import { URL_PANEL, type PedidoDemoInfo } from '@/lib/demo'

/** Una línea del mensaje con el formato de WhatsApp: *negrita* y _cursiva_. */
function Linea({ texto }: { texto: string }) {
  const partes = texto.split(/(\*[^*\n]+\*|_[^_\n]+_)/g)
  return (
    <>
      {partes.map((parte, i) =>
        parte.length > 2 && parte.startsWith('*') && parte.endsWith('*') ? (
          <strong key={i} className="font-semibold">
            {parte.slice(1, -1)}
          </strong>
        ) : parte.length > 2 && parte.startsWith('_') && parte.endsWith('_') ? (
          <em key={i}>{parte.slice(1, -1)}</em>
        ) : (
          parte
        ),
      )}
    </>
  )
}

/**
 * El final del pedido de prueba: en vez de crearlo, la demo muestra el mensaje que le llegaría al
 * local por WhatsApp (el texto del flujo real, con sus productos) y lo que pasa después.
 */
export function PedidoDemo({
  pedido,
  local,
  onCerrar,
  contenedor,
}: {
  pedido: PedidoDemoInfo | null
  local: string
  onCerrar: () => void
  /** El contenedor `[data-piru-demo]` del sitio de Páginas; sin él, el portal va al `body`. */
  contenedor?: HTMLElement | null
}) {
  // Mientras el diálogo se va, sigue mostrando el último pedido (sin efecto: se copia al pintar).
  const [ultimo, setUltimo] = useState(pedido)
  if (pedido && pedido !== ultimo) setUltimo(pedido)
  const mostrado = pedido ?? ultimo
  const caja = useRef<HTMLDivElement>(null)
  const nombre = mostrado?.cliente.trim().split(/\s+/)[0] || 'tu cliente'
  const iniciales = (mostrado?.cliente ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase())
    .join('')
  return (
    <Dialog.Root open={pedido !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <Dialog.Portal container={contenedor ?? undefined}>
        <Dialog.Overlay className="demo-fondo fixed inset-0 z-[80] bg-[#120F0D]/55 backdrop-blur-[3px]" />
        <Dialog.Content
          // Como en el recorrido: el foco arranca en el diálogo, no marcado en el primer botón.
          ref={caja}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            caja.current?.focus({ preventScroll: true })
          }}
          className="demo-caja fixed left-1/2 top-1/2 z-[90] flex max-h-[calc(100dvh-24px)] w-[min(440px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[28px] bg-paper px-5 pb-4 pt-4 text-center font-sans text-ink shadow-[0_40px_100px_-30px_rgb(0_0_0/.55)] outline-none sm:px-7 sm:pb-5 sm:pt-5"
        >
          <p className="shrink-0 text-[12.5px] font-semibold text-ink-3">Pedido de prueba · no se envió</p>
          <Dialog.Title className="mt-1.5 shrink-0 text-balance text-[24px] font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[28px]">
            Así te llega el pedido de {nombre}
          </Dialog.Title>

          {mostrado && (
            <div className="escenario mt-3.5 flex min-h-0 w-full flex-1 justify-center overflow-hidden rounded-[22px] p-3 ring-1 ring-black/[.06]">
              <div className="flex min-h-0 w-full max-w-[330px] flex-col overflow-hidden rounded-[16px] bg-[#EFEAE2] text-left shadow-[0_0_0_1px_rgb(25_21_18/.06),0_18px_34px_-20px_rgb(40_24_8/.5)]">
                <div className="flex shrink-0 items-center gap-2.5 bg-[#0B6E5C] px-3 py-2 text-white">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/20 text-[11px] font-bold">
                    {iniciales}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold leading-tight">{mostrado.cliente}</p>
                    <p className="truncate text-[10.5px] text-white/70">WhatsApp de {local}</p>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
                  <div className="e-burbuja-entra e-sube mr-6 whitespace-pre-wrap break-words px-2.5 py-2 text-[12.5px] leading-[1.42]">
                    {mostrado.mensaje.split('\n').map((linea, i) => (
                      <span key={i} className="block min-h-[1.42em]">
                        <Linea texto={linea} />
                      </span>
                    ))}
                    <span className="block text-right text-[10px] text-[#667781]">21:04</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Dialog.Description className="mt-3.5 shrink-0 text-balance text-[14.5px] leading-[1.5] text-ink-2">
            En tu tienda, el pedido te llega así a tu WhatsApp, queda en tu panel y {nombre} suma{' '}
            {mostrado?.puntos ?? 0} puntos cuando lo cobrás.
          </Dialog.Description>

          <div className="mt-4 flex w-full shrink-0 flex-col items-center gap-1">
            <a
              href={URL_PANEL}
              className="inline-flex h-12 min-w-[176px] items-center justify-center gap-2 rounded-full bg-brand px-6 text-[15.5px] font-semibold tracking-[-0.01em] text-white shadow-[inset_0_1px_0_rgb(255_255_255/.35),0_10px_24px_-10px_rgb(255_122_0/.75),0_2px_4px_rgb(158_62_0/.18)] transition-[transform,background-color] duration-200 hover:bg-brand-deep active:scale-[.97]"
            >
              <LayoutDashboard className="size-[18px]" strokeWidth={2.2} />
              Ver tu panel de administrador
            </a>
            <button
              type="button"
              onClick={onCerrar}
              className="min-h-11 rounded-full px-4 text-[14.5px] font-semibold text-ink-2 transition-colors hover:bg-sand hover:text-ink"
            >
              Seguir probando
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
