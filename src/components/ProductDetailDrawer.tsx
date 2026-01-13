import { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerContent
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X } from 'lucide-react'

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

  // Inicialmente todos los ingredientes están incluidos (ninguno excluido)
  // Al hacer clic, se excluye o se vuelve a incluir
  const toggleIngrediente = (ingredienteId: number) => {
    setIngredientesExcluidos(prev => {
      if (prev.includes(ingredienteId)) {
        // Si estaba excluido, lo incluimos de nuevo (lo removemos de la lista de excluidos)
        return prev.filter(id => id !== ingredienteId)
      } else {
        // Si estaba incluido, lo excluimos (lo agregamos a la lista de excluidos)
        return [...prev, ingredienteId]
      }
    })
  }

  // Verificar si un ingrediente está incluido (no está en la lista de excluidos)
  const isIngredienteIncluido = (ingredienteId: number) => {
    return !ingredientesExcluidos.includes(ingredienteId)
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
                <div>
                  <p className="text-2xl font-bold text-primary">${(parseFloat(String(product.precio)) * quantity).toFixed(2)}</p>
                </div>
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
              </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Confirma los ingredientes incluidos</p>
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
                      const estaIncluido = isIngredienteIncluido(ingrediente.id)
                      return (
                        <div
                          key={ingrediente.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            estaIncluido
                              ? 'bg-primary/10 border border-primary/30'
                              : 'bg-destructive/10 border border-destructive/30'
                          }`}
                          onClick={() => toggleIngrediente(ingrediente.id)}
                        >
                          <Checkbox
                            checked={estaIncluido}
                          />
                          <span className={`text-sm flex-1 ${estaIncluido ? '' : 'line-through text-muted-foreground'}`}>
                            {ingrediente.nombre}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {ingredientesExcluidos.length > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      {ingredientesExcluidos.length} ingrediente{ingredientesExcluidos.length !== 1 ? 's' : ''} excluido{ingredientesExcluidos.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Total Amount & Add Button */}
              <div className="flex items-center justify-between pt-4 border-t border-border">

                <Button
                  size="lg"
                  onClick={handleAdd}
                  className="rounded-lg px-8 h-14 bg-primary hover:bg-primary/90 font-semibold w-full"
                >
                  Agregar al pedido
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