import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import {
  Drawer,
  DrawerContent
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Check } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const SCROLL_EPS = 10

/** Degradados en los bordes del scroll cuando hay más contenido (sin texto). */
function DrawerScrollEdgeFades({ showTop, showBottom }: { showTop: boolean; showBottom: boolean }) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-[2] h-11 bg-linear-to-b from-background from-45% via-background/75 to-transparent transition-opacity duration-300',
          showTop ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-linear-to-t from-background from-55% via-background/80 to-transparent transition-opacity duration-300',
          showBottom ? 'opacity-100' : 'opacity-0'
        )}
      />
    </>
  )
}

function useDrawerScrollOverflowHints(measureVersion: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  const [hints, setHints] = useState({ top: false, bottom: false })

  const recalc = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const canScroll = scrollHeight > clientHeight + SCROLL_EPS
    if (!canScroll) {
      setHints({ top: false, bottom: false })
      return
    }
    setHints({
      top: scrollTop > SCROLL_EPS,
      bottom: scrollTop + clientHeight < scrollHeight - SCROLL_EPS,
    })
  }, [])

  useLayoutEffect(() => {
    recalc()
    requestAnimationFrame(recalc)
  }, [measureVersion, recalc])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    recalc()

    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => requestAnimationFrame(recalc))
      ro.observe(el)
    }

    window.addEventListener('resize', recalc)
    el.addEventListener('scroll', recalc, { passive: true })

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', recalc)
      el.removeEventListener('scroll', recalc)
    }
  }, [recalc])

  return { ref, showTopFade: hints.top, showBottomFade: hints.bottom }
}

interface Ingrediente {
  id: number
  nombre: string
}

interface Agregado {
  id: number
  nombre: string
  precio: string
}

interface Variante {
  id: number
  nombre: string
  precio: string
}

function formatTimeLeft(fechaFin: string | Date | null): string | null {
  if (!fechaFin) return null
  const now = Date.now()
  const end = new Date(fechaFin).getTime()
  const diff = end - now
  if (diff <= 0) return null
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'menos de 1h'
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
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
  variantes?: Variante[]
  descuento?: number | null
  descuentoFechaFin?: string | null
}

interface ProductDetailDrawerProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onAddToOrder: (product: Product, quantity: number, ingredientesExcluidos?: number[], agregados?: Agregado[], varianteSeleccionada?: Variante) => void
}

export function ProductDetailDrawer({ product, open, onClose, onAddToOrder }: ProductDetailDrawerProps) {
  const [quantity, setQuantity] = useState(1)
  const [ingredientesExcluidos, setIngredientesExcluidos] = useState<number[]>([])
  const [agregadosSeleccionados, setAgregadosSeleccionados] = useState<Agregado[]>([])
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<Variante | null>(null)
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    if (open && product) {
      setIngredientesExcluidos([])
      setAgregadosSeleccionados([])
      setVarianteSeleccionada(null)
      setQuantity(1)
      setIsAdded(false)
    }
  }, [open, product?.id])

  const toggleIngrediente = (ingredienteId: number) => {
    setIngredientesExcluidos(prev => {
      if (prev.includes(ingredienteId)) return prev.filter(id => id !== ingredienteId)
      return [...prev, ingredienteId]
    })
  }

  const isIngredienteIncluido = (ingredienteId: number) => !ingredientesExcluidos.includes(ingredienteId)

  const handleAdd = () => {
    if (!product) return
    setIsAdded(true)
    onAddToOrder(product, quantity, ingredientesExcluidos.length > 0 ? ingredientesExcluidos : undefined, agregadosSeleccionados.length > 0 ? agregadosSeleccionados : undefined, varianteSeleccionada ?? undefined)

    setTimeout(() => {
      setQuantity(1)
      setIngredientesExcluidos([])
      setAgregadosSeleccionados([])
      setVarianteSeleccionada(null)
      setIsAdded(false)
      onClose()
    }, 600)
  }

  const tieneIngredientes = product?.ingredientes && product.ingredientes.length > 0
  const tieneAgregados = product?.agregados && product.agregados.length > 0
  const tieneVariantes = product?.variantes && product.variantes.length > 0

  const toggleAgregado = (agregado: Agregado) => {
    setAgregadosSeleccionados(prev => {
      if (prev.find(a => a.id === agregado.id)) return prev.filter(a => a.id !== agregado.id)
      return [...prev, agregado]
    })
  }

  const hayModificaciones =
    agregadosSeleccionados.length > 0 ||
    ingredientesExcluidos.length > 0 ||
    varianteSeleccionada != null
  const ingredientesExcluidosDetalle = (product?.ingredientes ?? []).filter((ing) =>
    ingredientesExcluidos.includes(ing.id)
  )

  const scrollMeasureKey = product
    ? `${open}-${product.id}-${product.variantes?.length ?? 0}-${product.ingredientes?.length ?? 0}-${product.agregados?.length ?? 0}-${product.imagenUrl ? '1' : '0'}-${hayModificaciones}-${varianteSeleccionada?.id ?? 'x'}-${ingredientesExcluidos.length}-${agregadosSeleccionados.length}`
    : `${open}`

  const { ref: scrollAreaRef, showTopFade, showBottomFade } = useDrawerScrollOverflowHints(scrollMeasureKey)

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent
        className={
          product?.imagenUrl
            ? "flex h-[80vh] min-h-0 flex-col overflow-hidden border-none outline-none"
            : "flex h-[80vh] min-h-0 flex-col overflow-hidden border-none outline-none bg-background max-h-[85vh]"
        }
      >
        {product ? (
          product.imagenUrl ? (
            /* ───────────────────────────────────────────────────────── */
            /* 1. DISEÑO ORIGINAL (CON IMAGEN)                           */
            /* ───────────────────────────────────────────────────────── */
            <>
              <div className="relative h-[38vh] min-h-[140px] max-h-[320px] shrink-0 w-full bg-secondary overflow-hidden">
                <img
                  src={product.imagenUrl}
                  alt={product.nombre}
                  className="absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000 ease-out"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background via-background/60 to-transparent" />
              </div>

              <div className="relative z-10 -mt-8 flex flex-1 min-h-0 flex-col overflow-hidden rounded-t-3xl bg-background shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out fill-mode-both">
                <div className="relative min-h-0 flex flex-1 flex-col overflow-hidden">
                <div ref={scrollAreaRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-2xl font-bold text-foreground leading-tight">{product.nombre}</h3>
                      {product.descuento && product.descuento > 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                          {product.descuento}% OFF
                        </span>
                      )}
                      {product.descuento && product.descuento > 0 && product.descuentoFechaFin && formatTimeLeft(product.descuentoFechaFin) && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          <span>⏱</span>
                          <span>Vence en {formatTimeLeft(product.descuentoFechaFin)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{product.categoria || 'Sin categoría'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {(() => {
                      const precioBase = varianteSeleccionada
                        ? parseFloat(varianteSeleccionada.precio)
                        : parseFloat(String(product.precio))
                      const precioConDescuento = product.descuento && product.descuento > 0
                        ? precioBase * (1 - product.descuento / 100) : precioBase
                      const precioAgregados = (agregadosSeleccionados || []).reduce((sum, ag) => sum + parseFloat(ag.precio || '0'), 0)
                      const total = (precioConDescuento + precioAgregados) * quantity
                      return product.descuento && product.descuento > 0 ? (
                        <>
                          <p className="text-sm text-muted-foreground line-through">${(precioBase * quantity).toFixed(2)}</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${total.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-2xl font-bold text-primary">${total.toFixed(2)}</p>
                      )
                    })()}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <h4 className="font-semibold text-sm text-foreground">Descripción</h4>
                  <p className="text-sm text-foreground/60 leading-relaxed line-clamp-3">
                    {product.descripcion || 'Sin descripción'}
                  </p>
                </div>

                {tieneVariantes && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-semibold text-sm text-foreground">Elige una opción <span className="text-red-500">*</span></h4>
                    <div className="flex flex-col gap-2">
                      {product.variantes!.map((v) => {
                        const isSelected = varianteSeleccionada?.id === v.id
                        return (
                          <div
                            key={v.id}
                            onClick={() => setVarianteSeleccionada(v)}
                            className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border-primary/40 shadow-sm' : 'bg-background hover:bg-muted border-border'}`}
                          >
                            <div className={`w-4 h-4 rounded-full border flex shrink-0 items-center justify-center ${isSelected ? 'border-primary border-[5px]' : 'border-muted-foreground'}`} />
                            <span className={`text-sm flex-1 font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{v.nombre}</span>
                            <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>${parseFloat(v.precio).toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {tieneIngredientes && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 whitespace-normal h-auto py-2">
                          Modificar Ingredientes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[400px] w-[90vw] rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader className="shrink-0">
                          <DialogTitle className="text-left">Confirma los ingredientes incluidos</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-1 space-y-3">
                          <div className="space-y-2 border rounded-lg p-3">
                            {product.ingredientes?.map((ingrediente) => {
                              const estaIncluido = isIngredienteIncluido(ingrediente.id)
                              return (
                                <div
                                  key={ingrediente.id}
                                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${estaIncluido ? 'bg-primary/10 border border-primary/30' : 'bg-destructive/10 border border-destructive/30'}`}
                                  onClick={() => toggleIngrediente(ingrediente.id)}
                                >
                                  <Checkbox checked={estaIncluido} />
                                  <span className={`text-sm flex-1 ${estaIncluido ? '' : 'line-through text-muted-foreground'}`}>{ingrediente.nombre}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {tieneAgregados && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 whitespace-normal h-auto py-2">
                          Agregar Extras
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[400px] w-[90vw] rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader className="shrink-0">
                          <DialogTitle className="text-left">Agregados Opcionales</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-1 space-y-3">
                          <div className="space-y-2 border rounded-lg p-3">
                            {product.agregados?.map((agregado) => {
                              const estaSeleccionado = !!agregadosSeleccionados.find(a => a.id === agregado.id)
                              return (
                                <div
                                  key={agregado.id}
                                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${estaSeleccionado ? 'bg-primary/10 border border-primary/30' : 'bg-background hover:bg-muted border'}`}
                                  onClick={() => toggleAgregado(agregado)}
                                >
                                  <Checkbox checked={estaSeleccionado} />
                                  <span className="text-sm flex-1 font-medium text-foreground">{agregado.nombre}</span>
                                  <span className="text-sm text-muted-foreground">+${parseFloat(agregado.precio).toFixed(2)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {hayModificaciones && (
                  <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Tu pedido así
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {varianteSeleccionada && (
                        <Badge
                          variant="default"
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-primary/20"
                        >
                          + {varianteSeleccionada.nombre}
                        </Badge>
                      )}
                      {agregadosSeleccionados.map((ag) => (
                        <Badge
                          key={ag.id}
                          variant="default"
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-primary/20"
                        >
                          + {ag.nombre}
                        </Badge>
                      ))}
                      {ingredientesExcluidosDetalle.map((ing) => (
                        <Badge
                          key={ing.id}
                          variant="destructive"
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                        >
                          − Sin {ing.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                </div>
                <DrawerScrollEdgeFades showTop={showTopFade} showBottom={showBottomFade} />
                </div>

                <div className="shrink-0 border-t border-border bg-background p-6 pt-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)]">
                  <Button
                    size="lg"
                    onClick={handleAdd}
                    disabled={isAdded || (tieneVariantes && !varianteSeleccionada)}
                    className={`rounded-2xl px-8 h-14 font-bold w-full transition-all duration-300 shadow-lg ${isAdded ? 'bg-emerald-500 text-white scale-[1.02] disabled:opacity-100 disabled:pointer-events-none' : 'bg-primary hover:bg-primary/90 active:scale-[0.98] shadow-primary/20'}`}
                  >
                    {isAdded ? (
                      <span className="flex items-center justify-center gap-2 animate-in zoom-in-50 duration-200">
                        <Check className="w-5 h-5" /> ¡Agregado!
                      </span>
                    ) : "Agregar al pedido"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* ───────────────────────────────────────────────────────── */
            /* 2. DISEÑO TIPOGRÁFICO CON ANIMACIÓN (SIN IMAGEN)          */
            /* ───────────────────────────────────────────────────────── */
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden animate-in fade-in duration-500">

              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-700 ease-out fill-mode-both">
              <div ref={scrollAreaRef} className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

                {/* Header Tipográfico Limpio */}
                <div className="flex items-start justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-3xl font-black text-foreground tracking-tight leading-none">{product.nombre}</h3>
                      {product.descuento && product.descuento > 0 && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mt-1">
                          {product.descuento}% OFF
                        </span>
                      )}
                      {product.descuento && product.descuento > 0 && product.descuentoFechaFin && formatTimeLeft(product.descuentoFechaFin) && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 mt-1">
                          <span>⏱</span>
                          <span>Vence en {formatTimeLeft(product.descuentoFechaFin)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-base font-medium text-muted-foreground">{product.categoria || 'Sin categoría'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {(() => {
                      const precioBase = varianteSeleccionada
                        ? parseFloat(varianteSeleccionada.precio)
                        : parseFloat(String(product.precio))
                      const precioConDescuento = product.descuento && product.descuento > 0
                        ? precioBase * (1 - product.descuento / 100) : precioBase
                      const precioAgregados = (agregadosSeleccionados || []).reduce((sum, ag) => sum + parseFloat(ag.precio || '0'), 0)
                      const total = (precioConDescuento + precioAgregados) * quantity

                      return product.descuento && product.descuento > 0 ? (
                        <>
                          <p className="text-sm text-muted-foreground line-through font-medium mb-0.5">${(precioBase * quantity).toFixed(2)}</p>
                          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${total.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-3xl font-black text-primary">${total.toFixed(2)}</p>
                      )
                    })()}
                  </div>
                </div>

                <Separator className="bg-border/60" />

                {/* Descripción con respiro */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Descripción</h4>
                  <p className="text-base text-foreground/80 leading-relaxed">
                    {product.descripcion || 'Este producto no cuenta con una descripción detallada en este momento.'}
                  </p>
                </div>

                {tieneVariantes && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-semibold text-sm text-foreground">Elige una opción <span className="text-red-500">*</span></h4>
                    <div className="flex flex-col gap-2">
                      {product.variantes!.map((v) => {
                        const isSelected = varianteSeleccionada?.id === v.id
                        return (
                          <div
                            key={v.id}
                            onClick={() => setVarianteSeleccionada(v)}
                            className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border-primary/40 shadow-sm' : 'bg-background hover:bg-muted border-border'}`}
                          >
                            <div className={`w-4 h-4 rounded-full border flex shrink-0 items-center justify-center ${isSelected ? 'border-primary border-[5px]' : 'border-muted-foreground'}`} />
                            <span className={`text-sm flex-1 font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{v.nombre}</span>
                            <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>${parseFloat(v.precio).toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Botones de Extras */}
                <div className="flex gap-3">
                  {tieneIngredientes && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 whitespace-normal h-auto py-2.5 font-semibold">
                          Modificar Ingredientes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[400px] w-[90vw] rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader className="shrink-0">
                          <DialogTitle className="text-left">Confirma los ingredientes incluidos</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-1 space-y-3">
                          <div className="space-y-2 border rounded-lg p-3">
                            {product.ingredientes?.map((ingrediente) => {
                              const estaIncluido = isIngredienteIncluido(ingrediente.id)
                              return (
                                <div
                                  key={ingrediente.id}
                                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${estaIncluido ? 'bg-primary/10 border border-primary/30' : 'bg-destructive/10 border border-destructive/30'}`}
                                  onClick={() => toggleIngrediente(ingrediente.id)}
                                >
                                  <Checkbox checked={estaIncluido} />
                                  <span className={`text-sm flex-1 font-medium ${estaIncluido ? 'text-foreground' : 'line-through text-muted-foreground'}`}>{ingrediente.nombre}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {tieneAgregados && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 whitespace-normal h-auto py-2.5 font-semibold">
                          Agregar Extras
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[400px] w-[90vw] rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader className="shrink-0">
                          <DialogTitle className="text-left">Agregados Opcionales</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-1 space-y-3">
                          <div className="space-y-2 border rounded-lg p-3">
                            {product.agregados?.map((agregado) => {
                              const estaSeleccionado = !!agregadosSeleccionados.find(a => a.id === agregado.id)
                              return (
                                <div
                                  key={agregado.id}
                                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${estaSeleccionado ? 'bg-primary/10 border border-primary/30' : 'bg-background hover:bg-muted border'}`}
                                  onClick={() => toggleAgregado(agregado)}
                                >
                                  <Checkbox checked={estaSeleccionado} />
                                  <span className="text-sm flex-1 font-medium text-foreground">{agregado.nombre}</span>
                                  <span className="text-sm text-muted-foreground font-semibold">+${parseFloat(agregado.precio).toFixed(2)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              <DrawerScrollEdgeFades showTop={showTopFade} showBottom={showBottomFade} />
              </div>

              {hayModificaciones && (
                <div className="shrink-0 px-6 md:px-8 pt-2 pb-1 space-y-2 border-t border-border/60 bg-background animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tu pedido así
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {varianteSeleccionada && (
                      <Badge
                        variant="default"
                        className="rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-primary/20"
                      >
                        + {varianteSeleccionada.nombre}
                      </Badge>
                    )}
                    {agregadosSeleccionados.map((ag) => (
                      <Badge
                        key={ag.id}
                        variant="default"
                        className="rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-primary/20"
                      >
                        + {ag.nombre}
                      </Badge>
                    ))}
                    {ingredientesExcluidosDetalle.map((ing) => (
                      <Badge
                        key={ing.id}
                        variant="destructive"
                        className="rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                      >
                        − Sin {ing.nombre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Footer Anclado: Sube desde abajo sutilmente un instante después */}
              <div className="p-6 pt-4 border-t border-border bg-background shrink-0 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out fill-mode-both">
                <Button
                  size="lg"
                  onClick={handleAdd}
                  disabled={isAdded || (tieneVariantes && !varianteSeleccionada)}
                  className={`rounded-2xl px-8 h-14 font-bold w-full transition-all duration-300 shadow-lg ${isAdded ? 'bg-emerald-500 text-white scale-[1.02] disabled:opacity-100 disabled:pointer-events-none' : 'bg-primary hover:bg-primary/90 active:scale-[0.98] shadow-primary/20'}`}
                >
                  {isAdded ? (
                    <span className="flex items-center justify-center gap-2 animate-in zoom-in-50 duration-200">
                      <Check className="w-5 h-5" /> ¡Agregado!
                    </span>
                  ) : "Agregar al pedido"}
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="h-full w-full bg-background" />
        )}
      </DrawerContent>
    </Drawer>
  )
}