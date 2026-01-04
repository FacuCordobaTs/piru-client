import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMesaStore } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Package } from 'lucide-react'
import { ProductDetailDrawer } from '@/components/ProductDetailDrawer'

const AgregarProducto = () => {
  const navigate = useNavigate()
  const { productos, clienteNombre, qrToken } = useMesaStore()
  const { sendMessage } = useClienteWebSocket()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedProduct, setSelectedProduct] = useState<typeof productos[0] | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!clienteNombre || !qrToken) {
      navigate('/pedido-confirmado')
    }
  }, [clienteNombre, qrToken])

  const categorias = ['All', ...Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)))]
  const productosFiltrados = selectedCategory === 'All' 
    ? productos 
    : productos.filter(p => p.categoria === selectedCategory)

  const agregarAlPedido = (producto: typeof productos[0] | any, cantidad: number = 1) => {
    if (!clienteNombre) return
    sendMessage({
      type: 'AGREGAR_ITEM',
      payload: {
        productoId: producto.id,
        clienteNombre,
        cantidad,
        precioUnitario: String(producto.precio),
        imagenUrl: producto.imagenUrl
      },
    })
    toast.success('Agregado a la orden', { description: `${producto.nombre}`, duration: 1500 })
  }

  const abrirDetalleProducto = (producto: typeof productos[0]) => {
    setSelectedProduct(producto)
    setDrawerOpen(true)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => navigate('/pedido-confirmado')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Agregar Producto</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-4 space-y-6">
        {/* Categorías */}
        {categorias.length > 1 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold px-1">Categorías</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide snap-x">
              {categorias.map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category || 'All')}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className={`rounded-full px-5 h-9 text-xs font-medium whitespace-nowrap snap-start transition-all ${
                    selectedCategory === category 
                      ? "shadow-md" 
                      : "bg-secondary/50 hover:bg-secondary border border-transparent"
                  }`}
                >
                  {category === 'All' ? 'Todas' : category}
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* Productos */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold px-1">Productos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {productosFiltrados.map((producto) => (
              <Card 
                key={producto.id} 
                className="group border-0 bg-card/50 hover:bg-card transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden cursor-pointer rounded-2xl ring-1 ring-border/50"
                onClick={() => abrirDetalleProducto(producto)}
              >
                <div className="flex p-3 gap-4">
                  <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-secondary relative">
                    {producto.imagenUrl ? (
                      <img 
                        src={producto.imagenUrl} 
                        alt={producto.nombre} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1 justify-between py-0.5 min-w-0">
                    <div>
                      <h3 className="font-bold text-foreground text-sm leading-tight truncate pr-2">
                        {producto.nombre}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {producto.descripcion || 'Sin descripción disponible.'}
                      </p>
                    </div>
                    
                    <div className="flex items-end justify-between mt-2">
                      <span className="font-bold text-base text-foreground">
                        ${parseFloat(producto.precio).toFixed(2)}
                      </span>
                      <Button 
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-sm bg-primary text-primary-foreground hover:scale-105 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation()
                          agregarAlPedido(producto)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {productosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">Sin productos.</p>
            </div>
          )}
        </section>
      </div>

      <ProductDetailDrawer
        product={selectedProduct ? { ...selectedProduct, categoria: selectedProduct.categoria ?? undefined } : null}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setTimeout(() => setSelectedProduct(null), 300)
        }}
        onAddToOrder={agregarAlPedido}
      />
    </div>
  )
}

export default AgregarProducto

