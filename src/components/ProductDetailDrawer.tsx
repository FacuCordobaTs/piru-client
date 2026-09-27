import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

interface Ingrediente {
  id: number
  nombre: string
}

interface Agregado {
  id: number
  nombre: string
  precio: string
  grupo?: number
}

interface Variante {
  id: number
  nombre: string
  precio: string
}

interface ConfiguracionPuntos {
  pesosPorPunto?: number | string
  modoAcumulacion?: string
}

interface Product {
  id: number
  nombre: string
  descripcion: string | null
  precio: number | string
  imagenUrl: string | null
  categoria?: string
  ingredientes?: Ingrediente[]
  agregados?: Agregado[]
  agregadosPrimarios?: Agregado[]
  agregadosSecundarios?: Agregado[]
  variantes?: Variante[]
  variantesSecundarias?: Variante[]
  tituloVariantesPrimarias?: string
  tituloVariantesSecundarias?: string
  tituloExtrasPrimarios?: string
  tituloExtrasSecundarios?: string
  permiteNota?: boolean
  tituloNota?: string
  descuento?: number | null
  descuentoFechaFin?: string | null
  esCanjePuntos?: boolean
  intentandoCanjear?: boolean
  puntosNecesarios?: number | string | null
  puntosDisponiblesUsuario?: number
  puntosGanados?: number | string | null
  sistemaPuntos?: boolean
  configuracionPuntos?: ConfiguracionPuntos
}

interface ProductDetailDrawerProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onAddToOrder: (
    product: Product,
    quantity: number,
    ingredientesExcluidos?: number[],
    agregados?: Agregado[],
    varianteSeleccionada?: Variante,
    varianteSecundariaSeleccionada?: Variante,
    nota?: string
  ) => void
  siblings?: Product[]
  onNavigate?: (product: Product) => void
  sistemaPuntos?: boolean
  configuracionPuntos?: ConfiguracionPuntos
}

type CustomizationStage = 'primary' | 'secondary' | 'extrasPrimary' | 'extrasSecondary' | 'note'

function formatTimeLeft(fechaFin: string | Date | null): string | null {
  if (!fechaFin) return null
  const diff = new Date(fechaFin).getTime() - Date.now()
  if (diff <= 0) return null
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'menos de 1h'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function ProductDetailDrawer({
  product,
  open,
  onClose,
  onAddToOrder,
  siblings,
  onNavigate,
  sistemaPuntos,
  configuracionPuntos,
}: ProductDetailDrawerProps) {
  const [stage, setStage] = useState<CustomizationStage>('primary')
  const quantity = 1
  const [ingredientesExcluidos, setIngredientesExcluidos] = useState<number[]>([])
  const [agregadosSeleccionados, setAgregadosSeleccionados] = useState<Agregado[]>([])
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<Variante | null>(null)
  const [varianteSecundariaSeleccionada, setVarianteSecundariaSeleccionada] = useState<Variante | null>(null)
  const [nota, setNota] = useState('')
  const [addCount, setAddCount] = useState(0)
  const [showCounter, setShowCounter] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const productId = product?.id

  useEffect(() => {
    if (!open || productId === undefined) return
    setStage('primary')
    setIngredientesExcluidos([])
    setAgregadosSeleccionados([])
    setVarianteSeleccionada(null)
    setVarianteSecundariaSeleccionada(null)
    setNota('')
    setAddCount(0)
    setShowCounter(false)
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [open, productId])

  useEffect(() => {
    if (!open) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
    }
  }, [open, onClose])

  const tieneIngredientes = Boolean(product?.ingredientes?.length)
  const agregadosPrimarios = product?.agregadosPrimarios
    ?? product?.agregados?.filter((agregado) => (agregado.grupo ?? 1) === 1)
    ?? []
  const agregadosSecundarios = product?.agregadosSecundarios
    ?? product?.agregados?.filter((agregado) => agregado.grupo === 2)
    ?? []
  const tieneAgregadosPrimarios = agregadosPrimarios.length > 0
  const tieneAgregadosSecundarios = agregadosSecundarios.length > 0
  const tieneVariantes = Boolean(product?.variantes?.length)
  const tieneVariantesSecundarias = Boolean(product?.variantesSecundarias?.length)
  const stages: CustomizationStage[] = [
    'primary',
    ...(tieneVariantesSecundarias ? ['secondary' as const] : []),
    ...(tieneIngredientes || tieneAgregadosPrimarios ? ['extrasPrimary' as const] : []),
    ...(tieneAgregadosSecundarios ? ['extrasSecondary' as const] : []),
    ...(product?.permiteNota ? ['note' as const] : []),
  ]
  const stageIndex = stages.indexOf(stage)
  const isExtrasStage = stage === 'extrasPrimary' || stage === 'extrasSecondary'
  const isDetailsStage = isExtrasStage || stage === 'note'
  const currentExtras = stage === 'extrasSecondary' ? agregadosSecundarios : agregadosPrimarios
  const currentExtrasTitle = stage === 'extrasSecondary'
    ? (product?.tituloExtrasSecundarios || 'Extras')
    : (product?.tituloExtrasPrimarios || 'Extras')
  const sinImagen = !product?.imagenUrl

  const lista = siblings ?? []
  const currentIndex = product ? lista.findIndex((item) => item.id === product.id) : -1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < lista.length - 1
  const puedeNavegar = stage === 'primary' && addCount === 0 && currentIndex >= 0 && lista.length > 1

  const irA = (direction: number) => {
    if (!puedeNavegar) return
    const target = lista[currentIndex + direction]
    if (target) onNavigate?.(target)
  }

  useEffect(() => {
    if (!open) return
    const handleArrowKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault()
        irA(1)
      } else if (event.key === 'ArrowLeft' && hasPrev) {
        event.preventDefault()
        irA(-1)
      }
    }
    window.addEventListener('keydown', handleArrowKey)
    return () => window.removeEventListener('keydown', handleArrowKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, puedeNavegar, currentIndex, lista])

  const toggleIngrediente = (id: number) => {
    setIngredientesExcluidos((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const toggleAgregado = (agregado: Agregado) => {
    setAgregadosSeleccionados((current) => current.some((item) => item.id === agregado.id)
      ? current.filter((item) => item.id !== agregado.id)
      : [...current, agregado])
  }

  const variantBloqueada = stage === 'primary'
    ? tieneVariantes && !varianteSeleccionada
    : stage === 'secondary'
      ? tieneVariantesSecundarias && !varianteSecundariaSeleccionada
      : false

  const precioBasePrimario = varianteSeleccionada
    ? parseFloat(varianteSeleccionada.precio)
    : parseFloat(String(product?.precio ?? 0))
  const precioBase = precioBasePrimario + (varianteSecundariaSeleccionada ? parseFloat(varianteSecundariaSeleccionada.precio) : 0)
  const tieneDescuento = Boolean(product?.descuento && product.descuento > 0)
  const precioUnitConDescuento = tieneDescuento ? precioBase * (1 - (product!.descuento! / 100)) : precioBase
  const precioAgregados = agregadosSeleccionados.reduce((sum, agregado) => sum + parseFloat(agregado.precio || '0'), 0)
  const total = (precioUnitConDescuento + precioAgregados) * quantity
  const totalTachado = (precioBase + precioAgregados) * quantity

  const handleAdd = () => {
    if (!product) return
    onAddToOrder(
      product,
      quantity,
      ingredientesExcluidos.length ? ingredientesExcluidos : undefined,
      agregadosSeleccionados.length ? agregadosSeleccionados : undefined,
      varianteSeleccionada ?? undefined,
      varianteSecundariaSeleccionada ?? undefined,
      nota.trim() || undefined
    )
    const newCount = addCount + 1
    setAddCount(newCount)
    if (newCount >= 2) {
      setShowCounter(true)
      window.setTimeout(() => setShowCounter(false), 700)
    }
  }

  const handleContinue = () => {
    if (variantBloqueada) return
    if (addCount > 0 || stageIndex >= stages.length - 1) {
      handleAdd()
      return
    }
    setStage(stages[stageIndex + 1])
  }

  const handleBack = () => {
    if (stageIndex > 0) setStage(stages[stageIndex - 1])
  }

  const esCanje = Boolean(product?.intentandoCanjear || product?.esCanjePuntos)
  const puntosRequeridos = Number(product?.puntosNecesarios || 0)
  const puntosDisponibles = product?.puntosDisponiblesUsuario === undefined
    ? undefined
    : Number(product.puntosDisponiblesUsuario)
  const puntosInsuficientes = esCanje && puntosDisponibles !== undefined && puntosDisponibles < puntosRequeridos
  const sistemaPuntosActivo = Boolean(
    sistemaPuntos
    ?? product?.sistemaPuntos
    ?? (Number(product?.puntosGanados || 0) > 0 || Number(product?.puntosNecesarios || 0) > 0)
  )
  const configPuntos = configuracionPuntos ?? product?.configuracionPuntos
  const puntosDirectos = Number(product?.puntosGanados || 0)
  const divisorMonto = Number(configPuntos?.pesosPorPunto || 100)
  const puntosPorMonto = (configPuntos?.modoAcumulacion === 'monto' || configPuntos?.modoAcumulacion === 'ambos') && divisorMonto > 0
    ? Math.floor(precioUnitConDescuento / divisorMonto)
    : 0
  const puntosQueDa = (() => {
    if (esCanje) return 0
    if (configPuntos?.modoAcumulacion === 'producto') return puntosDirectos
    if (configPuntos?.modoAcumulacion === 'monto') return puntosPorMonto
    if (configPuntos?.modoAcumulacion === 'ambos') return puntosDirectos + puntosPorMonto
    if (puntosDirectos > 0) return puntosDirectos
    if (configPuntos && divisorMonto > 0) return Math.floor(precioUnitConDescuento / divisorMonto)
    return 0
  })()
  const tienePuntosBadge = sistemaPuntosActivo && !esCanje && puntosQueDa > 0
  const timeLeft = tieneDescuento ? formatTimeLeft(product?.descuentoFechaFin ?? null) : null
  const nombreLength = product?.nombre.trim().length ?? 0
  const nombreFontSize = nombreLength > 90 ? 15 : nombreLength > 65 ? 17 : nombreLength > 45 ? 20 : nombreLength > 30 ? 23 : undefined
  const nombreLargo = nombreLength > 30
  const rowButtonClass = 'flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-colors'
  const navigationButtonClass = 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground active:scale-[0.98] disabled:opacity-35'

  if (!open || !product || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
      <div
        aria-hidden
        className={cn('fixed inset-0 bg-secondary bg-cover bg-center bg-no-repeat', sinImagen && 'bg-background')}
        style={sinImagen ? undefined : { backgroundImage: `url(${JSON.stringify(product.imagenUrl)})` }}
      />
      {!sinImagen && <div aria-hidden className="fixed inset-0 bg-black/20" />}

      <button
        type="button"
        onClick={stage === 'primary' ? onClose : handleBack}
        aria-label={stage === 'primary' ? 'Volver al menú' : 'Volver al paso anterior'}
        className="fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-[130] flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md active:bg-black/60"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {puedeNavegar && lista.length > 1 && (
        <div className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[120] rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold tabular-nums text-white shadow-lg backdrop-blur-md">
          {currentIndex + 1} / {lista.length}
        </div>
      )}

      <div ref={scrollContainerRef} className="fixed inset-0 z-[110] overflow-y-auto overscroll-y-contain touch-pan-y [scrollbar-gutter:stable]">
        <main className={cn(
          'mx-auto flex min-h-full w-full max-w-md flex-col',
          sinImagen ? 'pt-20' : 'pt-[clamp(16rem,44dvh,24rem)]'
        )}>
          <section className="relative flex flex-1 flex-col rounded-t-[32px] bg-background px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-10 shadow-[0_-12px_45px_rgba(0,0,0,0.24)]">
            <div aria-hidden className="absolute left-1/2 top-3 h-1.5 w-10 -translate-x-1/2 rounded-full bg-foreground/15" />

            <header className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {esCanje && <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Canje de Puntos</span>}
                {tieneDescuento && <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{product.descuento}% OFF</span>}
                {timeLeft && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" /> Vence en {timeLeft}
                  </span>
                )}
              </div>
              <div className={cn('flex gap-3', nombreLargo ? 'flex-col items-stretch gap-1' : 'items-end justify-between')}>
                <h2 id="product-detail-title" className="min-w-0 flex-1 break-words text-[28px] font-bold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere]" style={nombreFontSize ? { fontSize: nombreFontSize } : undefined}>
                  {product.nombre}
                </h2>
                <div className={cn('shrink-0 text-right', nombreLargo && 'self-end')}>
                  {tieneDescuento && <p className="text-sm font-medium text-muted-foreground line-through">${totalTachado.toFixed(2)}</p>}
                  {esCanje
                    ? <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{puntosRequeridos} pts</p>
                    : <p className="text-2xl font-bold text-primary">${total.toFixed(2)}</p>}
                </div>
              </div>
            </header>

            <div className="flex-1 space-y-7">
              {stage === 'primary' && (
                <div className="space-y-2">
                  <p className="text-[15px] leading-relaxed text-foreground/70">{product.descripcion || 'Sin descripción.'}</p>
                  {tienePuntosBadge && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> Sumás +{puntosQueDa} {puntosQueDa === 1 ? 'punto' : 'puntos'}
                    </span>
                  )}
                </div>
              )}

              {((stage === 'primary' && tieneVariantes) || (stage === 'secondary' && tieneVariantesSecundarias)) && (
                <div className="space-y-1">
                  <p className="px-1 pb-1 text-[13px] font-medium text-muted-foreground">
                    {stage === 'primary'
                      ? (product.tituloVariantesPrimarias || 'Elegí una opción')
                      : (product.tituloVariantesSecundarias || 'Elegí también una segunda opción')}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {(stage === 'primary' ? product.variantes! : product.variantesSecundarias!).map((variant) => {
                      const selected = (stage === 'primary' ? varianteSeleccionada : varianteSecundariaSeleccionada)?.id === variant.id
                      return (
                        <button key={variant.id} type="button" onClick={() => stage === 'primary' ? setVarianteSeleccionada(variant) : setVarianteSecundariaSeleccionada(variant)} className={cn(rowButtonClass, selected ? 'bg-primary/10' : 'bg-secondary/50')}>
                          <span className={cn('text-[15px]', selected ? 'font-semibold text-primary' : 'text-foreground')}>{variant.nombre}</span>
                          <span className="flex items-center gap-2">
                            <span className={cn('text-[15px]', selected ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                              {stage === 'secondary'
                                ? (parseFloat(variant.precio) > 0 ? `+$${parseFloat(variant.precio).toFixed(2)}` : 'Incluido')
                                : `$${parseFloat(variant.precio).toFixed(2)}`}
                            </span>
                            {selected && <Check className="h-[18px] w-[18px] text-primary" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {stage === 'note' && (
                <div className="space-y-3">
                  <div>
                    <p className="px-1 text-lg font-bold text-foreground">{product.tituloNota || '¿Querés aclarar algo?'}</p>
                    <p className="px-1 pt-1 text-sm text-muted-foreground">Opcional</p>
                  </div>
                  <Textarea value={nota} onChange={(event) => setNota(event.target.value.slice(0, 500))} maxLength={500} autoFocus placeholder="Escribí una aclaración para este producto" className="min-h-28 resize-none rounded-2xl bg-secondary/50 px-4 py-3 text-base" />
                  <p className="px-1 text-right text-xs text-muted-foreground">{nota.length}/500</p>
                </div>
              )}

              {stage === 'extrasPrimary' && tieneIngredientes && (
                <div className="space-y-1">
                  <p className="px-1 pb-1 text-lg font-bold text-foreground">Ingredientes</p>
                  <div className="flex flex-col gap-0.5">
                    {product.ingredientes!.map((ingrediente) => {
                      const incluido = !ingredientesExcluidos.includes(ingrediente.id)
                      return (
                        <button key={ingrediente.id} type="button" onClick={() => toggleIngrediente(ingrediente.id)} className={cn(rowButtonClass, incluido ? 'bg-secondary/60' : 'bg-secondary/30')}>
                          <span className={cn('text-[15px]', incluido ? 'text-foreground' : 'text-muted-foreground line-through')}>{ingrediente.nombre}</span>
                          {incluido && <Check className="h-[18px] w-[18px] text-foreground/70" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {isExtrasStage && currentExtras.length > 0 && (
                <div className="space-y-1">
                  <p className="px-1 pb-1 text-lg font-bold text-foreground">{currentExtrasTitle}</p>
                  <div className="flex flex-col gap-0.5">
                    {currentExtras.map((agregado) => {
                      const selected = agregadosSeleccionados.some((item) => item.id === agregado.id)
                      return (
                        <button key={agregado.id} type="button" onClick={() => toggleAgregado(agregado)} className={cn(rowButtonClass, selected ? 'bg-primary/10' : 'bg-secondary/50')}>
                          <span className={cn('text-[15px]', selected ? 'font-semibold text-primary' : 'text-foreground')}>{agregado.nombre}</span>
                          <span className="flex items-center gap-2">
                            <span className={cn('text-[15px]', selected ? 'font-semibold text-primary' : 'text-muted-foreground')}>+${parseFloat(agregado.precio).toFixed(2)}</span>
                            {selected && <Check className="h-[18px] w-[18px] text-primary" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-2">
              <div className="flex items-stretch gap-2">
                {puedeNavegar && (
                  <button type="button" onClick={() => irA(-1)} disabled={!hasPrev} aria-label="Producto anterior" className={navigationButtonClass}><ChevronLeft className="h-5 w-5" /></button>
                )}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={(!isDetailsStage && variantBloqueada) || puntosInsuficientes}
                  className={cn(
                    'relative h-14 min-w-0 flex-1 rounded-2xl px-2 text-[17px] font-semibold active:scale-[0.98]',
                    addCount > 0
                      ? 'bg-emerald-500 text-white'
                      : !isDetailsStage && variantBloqueada
                        ? 'bg-foreground/10 text-muted-foreground'
                        : 'bg-primary text-primary-foreground'
                  )}
                >
                  {showCounter
                    ? <span className="text-2xl font-black">x{addCount}</span>
                    : addCount > 0
                      ? <span className="flex items-center justify-center gap-2"><Check className="h-5 w-5" /> Agregar otro igual</span>
                      : stageIndex < stages.length - 1
                        ? 'Continuar'
                        : puntosInsuficientes
                          ? `Puntos insuficientes (${puntosRequeridos} pts)`
                          : esCanje
                            ? `Canjear por ${puntosRequeridos} pts`
                            : `Agregar · $${total.toFixed(2)}`}
                </button>
                {puedeNavegar && (
                  <button type="button" onClick={() => irA(1)} disabled={!hasNext} aria-label="Producto siguiente" className={navigationButtonClass}><ChevronRight className="h-5 w-5" /></button>
                )}
              </div>
              {addCount > 0 && (
                <button type="button" onClick={onClose} className="h-14 w-full rounded-2xl bg-secondary text-[17px] font-semibold text-foreground active:scale-[0.98]">Cerrar</button>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>,
    document.body
  )
}
