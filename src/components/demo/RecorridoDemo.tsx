import { useRef, useState, type ComponentType, type PointerEvent, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight } from 'lucide-react'
import { CLIENTA_DEMO, DESCUENTO_DEMO } from '@/lib/demo'
import type { DatosDemo } from './escenas/datos'
import { TiendaCelular } from './escenas/TiendaCelular'
import { ClienteBase } from './escenas/ClienteBase'
import { Recompra } from './escenas/Recompra'
import { ClubPuntos } from './escenas/ClubPuntos'
import { PanelAdmin } from './escenas/PanelAdmin'

interface Paso {
  id: string
  titulo: string
  texto: ReactNode
  boton: string
  Escena: ComponentType<{ datos: DatosDemo }>
  /** La escena se apoya en el borde de abajo del escenario: el celular asoma desde ahí. */
  abajo?: boolean
}

/** La parte de la descripción que remite a lo que el local ve en su tienda, detrás del diálogo. */
const Vivo = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-ink">{children}</strong>

const PASOS: Paso[] = [
  {
    id: 'tienda',
    titulo: 'Esta es la demo de tu tienda en Piru',
    texto: 'La armamos con tu carta. Tus clientes piden en un minuto desde el celular y el pedido te llega a tu WhatsApp, sin comisiones.',
    boton: 'Empezar',
    Escena: TiendaCelular,
    abajo: true,
  },
  {
    id: 'clientes',
    titulo: 'Cada pedido suma un cliente a tu base',
    texto: 'Queda guardado quién te compra, qué pide y cada cuánto, sin planillas. Y sabés qué historia, reel o QR te trajo cada venta.',
    boton: 'Siguiente',
    Escena: ClienteBase,
  },
  {
    id: 'recompra',
    titulo: 'Piru te avisa quién se está yendo',
    texto: (
      <>
        Y te deja el mensaje listo para mandar desde tu WhatsApp.{' '}
        <Vivo>
          En esta demo entrás como {CLIENTA_DEMO.corto}, que volvió así: su {DESCUENTO_DEMO}% ya está aplicado.
        </Vivo>
      </>
    ),
    boton: 'Siguiente',
    Escena: Recompra,
  },
  {
    id: 'puntos',
    titulo: 'Puntos para que siempre vuelvan',
    texto: (
      <>
        Cada pedido suma puntos para canjear por envío gratis, descuentos o productos.{' '}
        <Vivo>
          {CLIENTA_DEMO.corto} tiene {CLIENTA_DEMO.puntos} y sus datos guardados: probá pedir como ella.
        </Vivo>
      </>
    ),
    boton: 'Siguiente',
    Escena: ClubPuntos,
  },
  {
    id: 'panel',
    titulo: 'Y todo lo manejás desde tu panel',
    texto: (
      <>
        Pedidos, menú, clientes y campañas, en un solo lugar. Tocá <Vivo>«Ver tu panel de administrador»</Vivo>, arriba de
        la tienda: entrás directo, sin contraseña.
      </>
    ),
    boton: 'Probar mi tienda',
    Escena: PanelAdmin,
  },
]

/**
 * El recorrido de la demo: se abre la primera vez que el local entra a su link (DemoTienda) y no
 * se puede cerrar hasta el último paso, que presenta el botón del panel que aparece después arriba
 * de la tienda. Cada paso: el número, el título, una ilustración animada con los datos del local,
 * la descripción y un botón. Deslizar sobre la ilustración (o las flechas) también avanza o vuelve.
 */
export function RecorridoDemo({
  abierto,
  datos,
  onTerminar,
}: {
  abierto: boolean
  datos: DatosDemo
  onTerminar: () => void
}) {
  const [i, setI] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const caja = useRef<HTMLDivElement>(null)
  const toque = useRef<number | null>(null)
  const paso = PASOS[i]
  const ultimo = i === PASOS.length - 1

  function ir(j: number) {
    if (j < 0 || j >= PASOS.length || j === i) return
    setDir(j > i ? 1 : -1)
    setI(j)
  }
  function siguiente() {
    if (ultimo) onTerminar()
    else ir(i + 1)
  }
  function empezarToque(e: PointerEvent) {
    if (e.pointerType !== 'mouse') toque.current = e.clientX
  }
  function terminarToque(e: PointerEvent) {
    if (toque.current === null) return
    const dx = e.clientX - toque.current
    toque.current = null
    if (dx < -50) ir(i + 1)
    else if (dx > 50) ir(i - 1)
  }

  return (
    <Dialog.Root open={abierto}>
      <Dialog.Portal>
        <Dialog.Overlay className="demo-fondo fixed inset-0 z-[80] bg-[#120F0D]/55 backdrop-blur-[3px]" />
        <Dialog.Content
          ref={caja}
          // El foco arranca en el diálogo y no en el botón: así el botón no queda marcado para
          // quien lo toca con el dedo. Con teclado, Enter y las flechas avanzan igual.
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            caja.current?.focus({ preventScroll: true })
          }}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') ir(i + 1)
            else if (e.key === 'ArrowLeft') ir(i - 1)
            else if (e.key === 'Enter' && e.target === e.currentTarget) siguiente()
          }}
          className="demo-caja fixed left-1/2 top-1/2 z-[90] flex max-h-[calc(100dvh-24px)] w-[min(440px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[28px] bg-paper px-5 pb-5 pt-4 text-center font-sans text-ink shadow-[0_40px_100px_-30px_rgb(0_0_0/.55)] outline-none sm:px-7 sm:pb-6 sm:pt-5"
        >
          <p className="shrink-0 text-[12.5px] font-semibold tabular-nums text-ink-3" aria-live="polite">
            {i + 1} de {PASOS.length}
          </p>

          <div key={`titulo-${i}`} data-dir={dir} className="demo-texto mt-1.5 flex min-h-[2.3em] w-full shrink-0 items-center justify-center text-[25px] sm:text-[29px]">
            <Dialog.Title className="text-balance text-[1em] font-bold leading-[1.12] tracking-[-0.02em] text-ink">
              {paso.titulo}
            </Dialog.Title>
          </div>

          {/* Con la proporción de las escenas; en una pantalla baja es lo único que se achica. */}
          <div
            className="escenario relative mt-3.5 aspect-[360/292] min-h-[150px] w-full shrink overflow-hidden rounded-[22px] ring-1 ring-black/[.06]"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={empezarToque}
            onPointerUp={terminarToque}
            onPointerCancel={() => (toque.current = null)}
          >
            <div className={`demo-marco absolute inset-0 px-3 pt-3 ${paso.abajo ? 'pb-0' : 'pb-3'}`}>
              <div
                key={`escena-${i}`}
                className={`demo-escena grid h-full justify-items-center ${paso.abajo ? 'items-end' : 'items-center'}`}
              >
                <paso.Escena datos={datos} />
              </div>
            </div>
          </div>

          <div
            key={`texto-${i}`}
            data-dir={dir}
            className="demo-texto mt-3 flex min-h-[6em] w-full shrink-0 items-center justify-center text-[14.5px] leading-[1.5]"
          >
            <Dialog.Description className="text-balance text-ink-2">{paso.texto}</Dialog.Description>
          </div>

          <button
            type="button"
            onClick={siguiente}
            className="mt-3 inline-flex h-12 min-w-[176px] shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 text-[15.5px] font-semibold tracking-[-0.01em] text-white shadow-[inset_0_1px_0_rgb(255_255_255/.35),0_10px_24px_-10px_rgb(255_122_0/.75),0_2px_4px_rgb(158_62_0/.18)] transition-[transform,background-color] duration-200 hover:bg-brand-deep active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand-deep"
          >
            {paso.boton}
            {!ultimo && <ArrowRight className="size-4" strokeWidth={2.4} />}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
