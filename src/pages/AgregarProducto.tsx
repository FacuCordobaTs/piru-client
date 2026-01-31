import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useMesaStore } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import { toast } from 'sonner'
import { ArrowLeft, Package, Utensils } from 'lucide-react'
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

  const productosPorCategoria = productos.reduce((acc, producto) => {
    const categoria = producto.categoria || 'Sin categoría'
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(producto)
    return acc
  }, {} as Record<string, typeof productos>)

  const productosFiltrados = selectedCategory === 'All'
    ? productos
    : productos.filter(p => p.categoria === selectedCategory)

  const categoriasOrdenadas = Object.keys(productosPorCategoria).sort((a, b) => {
    if (a === 'Sin categoría') return 1
    if (b === 'Sin categoría') return -1
    return a.localeCompare(b)
  })

  const agregarAlPedido = (producto: typeof productos[0] | any, cantidad: number = 1, ingredientesExcluidos?: number[]) => {
    if (!clienteNombre) return
    sendMessage({
      type: 'AGREGAR_ITEM',
      payload: {
        productoId: producto.id,
        clienteNombre,
        cantidad,
        precioUnitario: String(producto.precio),
        imagenUrl: producto.imagenUrl,
        ingredientesExcluidos
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
            <div className="flex gap-2 overflow-x-auto pb-2 mx-2 scrollbar-hide snap-x">
              {categorias.map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category || 'All')}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className={`rounded-lg px-5 h-10 text-xs font-medium whitespace-nowrap snap-start transition-all ${selectedCategory === category
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
        <section className="space-y-8 min-h-[50vh]">
          {selectedCategory === 'All' ? (
            categoriasOrdenadas.length > 0 ? (
              categoriasOrdenadas.map((categoriaNombre) => {
                const productosDeCategoria = productosPorCategoria[categoriaNombre]
                if (!productosDeCategoria || productosDeCategoria.length === 0) return null

                return (
                  <div key={categoriaNombre} className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      {categoriaNombre}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-3 ml-2 scrollbar-hide snap-x snap-mandatory">
                      {productosDeCategoria.map((producto) => (
                        <ProductoCard
                          key={producto.id}
                          producto={producto}
                          onClick={() => abrirDetalleProducto(producto)}
                        />
                      ))}
                      <div className="min-w-1 shrink-0" />
                    </div>
                  </div>
                )
              })
            ) : (
              <EmptyState />
            )
          ) : (
            productosFiltrados.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {selectedCategory}
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-3 ml-2 scrollbar-hide snap-x snap-mandatory">
                  {productosFiltrados.map((producto) => (
                    <ProductoCard
                      key={producto.id}
                      producto={producto}
                      onClick={() => abrirDetalleProducto(producto)}
                    />
                  ))}
                  <div className="min-w-1 shrink-0" />
                </div>
              </div>
            ) : (
              <EmptyState />
            )
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

// Componentes auxiliares
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
    <Package className="w-10 h-10 mb-2" />
    <p className="text-sm">Sin productos disponibles.</p>
  </div>
)

const ProductoCard = ({ producto, onClick }: { producto: any, onClick: () => void }) => (
  <div
    className="group relative w-44 h-52 shrink-0 rounded-3xl overflow-hidden cursor-pointer snap-start shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
    onClick={onClick}
  >
    {/* Background Image */}
    <div className="absolute inset-0 bg-zinc-900">
      {producto.imagenUrl ? (
        <img
          src={producto.imagenUrl}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-900">
          <Utensils className="w-12 h-12 text-orange-500" />
        </div>
      )}
    </div>

    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

    {/* Glassmorphism overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-3.5">
      <div
        className="
          rounded-2xl p-3 
          bg-white/70 dark:bg-white/10
          backdrop-blur-md backdrop-saturate-150
          border border-white/30 dark:border-white/10
          shadow-[0_4px_30px_rgba(0,0,0,0.1)]
        "
      >
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white truncate leading-tight">
          {producto.nombre}
        </h3>
        <span className="font-bold text-lg text-zinc-800 dark:text-white/90 mt-0.5 block">
          ${parseFloat(producto.precio).toFixed(2)}
        </span>
      </div>
    </div>
  </div>
)

export default AgregarProducto

