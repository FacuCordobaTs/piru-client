import { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerContent
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Star, Plus, Minus, X } from 'lucide-react'

interface Ingrediente {
  id: number
  nombre: string
}

interface Product {
  id: number
  nombre: string
  descripcion: string | null
  precio: number | string
  imagenUrl: string | null
  categoria?: string
  ingredientes?: Ingrediente[]
}

interface ProductDetailDrawerProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onAddToOrder: (product: Product, quantity: number, ingredientesExcluidos?: number[]) => void
}

export function ProductDetailDrawer({ product, open, onClose, onAddToOrder }: ProductDetailDrawerProps) {
  const [quantity, setQuantity] = useState(1)
  const [mostrarIngredientes, setMostrarIngredientes] = useState(false)
  const [ingredientesExcluidos, setIngredientesExcluidos] = useState<number[]>([])

  // Resetear estado cuando se abre/cierra el drawer o cambia el producto
  useEffect(() => {
    if (open && product) {
      setMostrarIngredientes(false)
      setIngredientesExcluidos([])
      setQuantity(1)
    }
  }, [open, product?.id])

  const toggleIngrediente = (ingredienteId: number) => {
    setIngredientesExcluidos(prev => {
      if (prev.includes(ingredienteId)) {
        return prev.filter(id => id !== ingredienteId)
      } else {
        return [...prev, ingredienteId]
      }
    })
  }

  const handleAdd = () => {
    if (!product) return
    onAddToOrder(product, quantity, ingredientesExcluidos.length > 0 ? ingredientesExcluidos : undefined)
    setQuantity(1)
    setIngredientesExcluidos([])
    setMostrarIngredientes(false)
    onClose()
  }

  const tieneIngredientes = product?.ingredientes && product.ingredientes.length > 0

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {/* 1. Fixed height set to 75vh (3/4 of screen) and flex-col layout */}
      <DrawerContent className="h-[75vh] flex flex-col overflow-hidden">
        {product ? (
          <>
            {/* 2. Image Container: flex-1 allows it to grow/shrink. min-h-0 is crucial for flex-shrink to work */}
            <div className="relative flex-1 min-h-0 w-full bg-secondary">
              {product.imagenUrl ? (
                <img 
                  src={product.imagenUrl} 
                  alt={product.nombre} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">Sin imagen</span>
                </div>
              )}
            </div>

            {/* 3. Content Container: shrink-0 ensures this area doesn't get squished by the image */}
            <div className="p-6 space-y-4 shrink-0 bg-background">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-1 leading-tight">{product.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{product.categoria || 'Sin categoría'}</p>
                </div>
                <Button size="sm" variant="ghost" className="rounded-full bg-primary/10 text-primary px-3 h-8">
                  <Star className="w-3 h-3 mr-1 fill-primary" />
                  4.9
                </Button>
              </div>

              {/* Description: We use line-clamp to ensure the text doesn't push the layout if it's exceptionally long */}
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-foreground">Descripción</h4>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {product.descripcion || 'Sin descripción'}
                </p>
              </div>

              {/* Modificar Ingredientes o Cantidad */}
              {!mostrarIngredientes ? (
                <div className="space-y-3">
                  {tieneIngredientes && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setMostrarIngredientes(true)}
                    >
                      Modificar Ingredientes
                    </Button>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Cantidad</p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-9 w-9"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-bold w-6 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-9 w-9"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Selecciona ingredientes a excluir</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarIngredientes(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {product.ingredientes?.map((ingrediente) => {
                      const estaExcluido = ingredientesExcluidos.includes(ingrediente.id)
                      return (
                        <div
                          key={ingrediente.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            estaExcluido
                              ? 'bg-destructive/10 border border-destructive/30'
                              : 'bg-background hover:bg-muted border border-transparent'
                          }`}
                          onClick={() => toggleIngrediente(ingrediente.id)}
                        >
                          <Checkbox
                            checked={estaExcluido}
                            onCheckedChange={() => toggleIngrediente(ingrediente.id)}
                          />
                          <span className={`text-sm flex-1 ${estaExcluido ? 'line-through text-muted-foreground' : ''}`}>
                            {ingrediente.nombre}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {ingredientesExcluidos.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {ingredientesExcluidos.length} ingrediente{ingredientesExcluidos.length !== 1 ? 's' : ''} excluido{ingredientesExcluidos.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Total Amount & Add Button */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold text-primary">${(parseFloat(String(product.precio)) * quantity).toFixed(2)}</p>
                </div>
                <Button
                  size="lg"
                  onClick={handleAdd}
                  className="rounded-xl px-8 h-12 bg-primary hover:bg-primary/90 font-semibold"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full w-full bg-background" />
        )}
      </DrawerContent>
    </Drawer>
  )
}