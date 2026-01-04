import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '@/components/ui/card' // Eliminé CardContent que no usaremos
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useMesaStore } from '@/store/mesaStore'
import { useClienteWebSocket } from '@/hooks/useClienteWebSocket'
import { toast } from 'sonner'
import { 
  Plus, Minus, Trash2, ArrowLeft, 
  Wifi, WifiOff, Package, ChefHat, UtensilsCrossed, Receipt 
} from 'lucide-react'
import { ProductDetailDrawer } from '@/components/ProductDetailDrawer'
import { ThemeToggle } from '@/components/ThemeToggle'

const Menu = () => {
  const navigate = useNavigate()
  const { mesa, productos, clientes, clienteNombre, qrToken, isHydrated, sessionEnded } = useMesaStore()
  const { state: wsState, isConnected, sendMessage } = useClienteWebSocket()
  
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<typeof productos[0] | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Funciones para abrir/cerrar drawers con soporte para botón "atrás"
  const abrirCarrito = useCallback(() => {
    // Agregar estado al historial para que "atrás" cierre el drawer
    window.history.pushState({ drawer: 'carrito' }, '')
    setCarritoAbierto(true)
  }, [])

  const cerrarCarrito = useCallback(() => {
    setCarritoAbierto(false)
    // Si el estado actual es del drawer, volver atrás para limpiarlo
    if (window.history.state?.drawer === 'carrito') {
      window.history.back()
    }
  }, [])

  const abrirProductoDrawer = useCallback(() => {
    window.history.pushState({ drawer: 'producto' }, '')
    setDrawerOpen(true)
  }, [])

  const cerrarProductoDrawer = useCallback(() => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedProduct(null), 300)
    if (window.history.state?.drawer === 'producto') {
      window.history.back()
    }
  }, [])

  // Escuchar el evento popstate (botón "atrás" del navegador)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Si hay un drawer abierto, cerrarlo
      if (carritoAbierto) {
        setCarritoAbierto(false)
        // Prevenir navegación
        event.preventDefault()
        return
      }
      if (drawerOpen) {
        setDrawerOpen(false)
        setTimeout(() => setSelectedProduct(null), 300)
        event.preventDefault()
        return
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [carritoAbierto, drawerOpen])

  // Verificar nombre y redirigir según estado del pedido
  useEffect(() => {
    // Esperar a que el store se hidrate
    if (!isHydrated) return
    
    // Si la sesión terminó, no hacer nada
    if (sessionEnded) return
    
    if (!clienteNombre || !qrToken) {
      toast.error('Debes ingresar tu nombre primero')
      navigate(`/mesa/${qrToken || 'invalid'}`)
      return
    }
    
    // Redirigir según el estado del pedido
    if (wsState?.estado) {
      if (wsState.estado === 'preparing') {
        navigate('/pedido-confirmado')
      } else if (wsState.estado === 'closed') {
        navigate('/pedido-cerrado')
      }
    }
  }, [clienteNombre, qrToken, wsState?.estado, navigate, isHydrated, sessionEnded])

  // Categorías y filtrado
  const categorias = ['All', ...Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)))]
  
  // Agrupar productos por categoría
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
  
  // Orden de categorías: primero las que tienen productos, luego "Sin categoría"
  const categoriasOrdenadas = Object.keys(productosPorCategoria).sort((a, b) => {
    if (a === 'Sin categoría') return 1
    if (b === 'Sin categoría') return -1
    return a.localeCompare(b)
  })

  const abrirDetalleProducto = (producto: typeof productos[0]) => {
    setSelectedProduct(producto)
    abrirProductoDrawer()
  }

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

  const handleAumentarCantidad = (itemPedidoId: number) => {
    const item = todosLosItems.find(i => i.id === itemPedidoId)
    if (!item) return
    sendMessage({ type: 'ACTUALIZAR_CANTIDAD', payload: { itemId: itemPedidoId, cantidad: item.cantidad + 1 }, })
  }

  const handleDisminuirCantidad = (itemPedidoId: number) => {
    const item = todosLosItems.find(i => i.id === itemPedidoId)
    if (!item || item.cantidad <= 1) return
    sendMessage({ type: 'ACTUALIZAR_CANTIDAD', payload: { itemId: itemPedidoId, cantidad: item.cantidad - 1 }, })
  }

  const handleEliminarItem = (itemPedidoId: number) => {
    sendMessage({ type: 'ELIMINAR_ITEM', payload: { itemId: itemPedidoId }, })
    toast.success('Producto eliminado')
  }

  const confirmarPedido = () => {
    sendMessage({ type: 'CONFIRMAR_PEDIDO', payload: {}, })
    toast.success('¡Pedido enviado a cocina!', { icon: <ChefHat className="w-5 h-5" /> })
    cerrarCarrito()
  }

  const todosLosItems = wsState?.items || []
  const totalPedido = wsState?.total || '0.00'
  // const misItems = todosLosItems.filter(item => item.clienteNombre === clienteNombre)

  return (
    <div className="min-h-screen pb-32 bg-background font-sans selection:bg-primary/20">
      
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 supports-backdrop-filter:bg-background/60">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50">
               {isConnected ? <Wifi className="w-3.5 h-3.5 text-green-500" /> : <WifiOff className="w-3.5 h-3.5 text-destructive" />}
               <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">{mesa?.nombre}</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-4 space-y-6">
        
        {/* --- SECCIÓN BIENVENIDA & USUARIOS (MINIMALISTA) --- */}
        <section className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-0.5">Bienvenido,</p>
              {/* Gradiente sutil solo en el texto */}
              <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-orange-800 to-orange-400 bg-clip-text text-transparent">
                {clienteNombre}
              </h1>
            </div>
            {/* Indicador sutil de mesa */}
            <div className="text-right">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Mesa</span>
              <span className="text-sm font-medium">{mesa?.nombre}</span>
            </div>
          </div>

          {/* Lista de Usuarios - Scroll Horizontal Limpio */}
          <div>
             <div className="flex items-center gap-2 mb-2 px-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  En la mesa:
                </p>
             </div>
             
             <div className="flex -mx-5 pl-5 overflow-x-auto scrollbar-hide py-2 gap-4 snap-x">
                {/* Usuario actual */}
                <div className="flex flex-col items-center gap-1.5 min-w-[56px] snap-start">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 shadow-sm ring-2 ring-background">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">YO</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs font-medium truncate max-w-[60px] text-center">Tú</span>
                </div>

                {/* Otros usuarios */}
                {clientes.filter(c => c.nombre !== clienteNombre).map((cliente) => (
                  <div key={cliente.id} className="flex flex-col items-center gap-1.5 min-w-[56px] snap-start opacity-80 hover:opacity-100 transition-opacity">
                    <Avatar className="w-12 h-12 border border-border shadow-xs">
                      <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                        {cliente.nombre.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[60px] text-center">
                      {cliente.nombre}
                    </span>
                  </div>
                ))}
                
                {clientes.length === 1 && (
                  <div className="flex items-center justify-center pl-2">
                    <p className="text-xs text-muted-foreground italic">Esperando...</p>
                  </div>
                )}
                
                {/* Espaciador final para respetar el padding */}
                <div className="min-w-5 shrink-0"></div>
             </div>
          </div>
        </section>


        {/* --- CATEGORÍAS (Diseño Clean) --- */}
        {categorias.length > 1 && (
          <section className="space-y-3 pt-2">
            <h2 className="text-lg font-bold text-foreground px-1">Categorías</h2>
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

        {/* --- PRODUCTOS --- */}
        <section className="space-y-6 min-h-[50vh]">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-lg font-bold text-foreground">Menú</h2>
          </div>

          {selectedCategory === 'All' ? (
            // Mostrar productos agrupados por categoría
            categoriasOrdenadas.length > 0 ? (
              categoriasOrdenadas.map((categoriaNombre) => {
                const productosDeCategoria = productosPorCategoria[categoriaNombre]
                if (!productosDeCategoria || productosDeCategoria.length === 0) return null
                
                return (
                  <div key={categoriaNombre} className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground px-1 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                      {categoriaNombre}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {productosDeCategoria.map((producto) => (
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
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                <Package className="w-10 h-10 mb-2" />
                <p className="text-sm">Sin productos.</p>
              </div>
            )
          ) : (
            // Mostrar productos filtrados por categoría seleccionada
            productosFiltrados.length > 0 ? (
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
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                <Package className="w-10 h-10 mb-2" />
                <p className="text-sm">Sin productos en esta categoría.</p>
              </div>
            )
          )}
        </section>
      </div>

      {/* --- BOTÓN FLOTANTE (DARK MODE FIXED) --- */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 transition-all duration-500 translate-y-0 opacity-100">
        <button
          onClick={abrirCarrito}
          className={`
            group relative flex items-center gap-4 pl-5 pr-6 py-3.5 rounded-full 
            shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300
            
            /* LIGHT MODE: Sólido, oscuro y elegante */
            bg-zinc-900 text-white shadow-zinc-900/20

            /* DARK MODE: Glassmorphism translúcido (Blanco Frost) */
            dark:bg-white/10 dark:text-white dark:backdrop-blur-xl 
            dark:border dark:border-white/10 dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]
          `}
        >
          {/* Badge */}
          <div className="absolute -top-2 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-background z-10">
            {todosLosItems.length}
          </div>

          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-current opacity-90" />
            <span className="font-semibold text-sm tracking-wide">Ver Pedido</span>
          </div>
          
          {/* Separador adaptativo */}
          <div className="h-4 w-px bg-current opacity-20"></div>
          
          <span className="font-bold text-base font-mono">
            ${totalPedido}
          </span>
        </button>
      </div>

      {/* --- DRAWER DEL PEDIDO (FULL SCREEN DESDE DERECHA) --- */}
      <Sheet open={carritoAbierto} onOpenChange={(open) => !open && cerrarCarrito()}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0 border-l-0 sm:border-l bg-background" 
        >
          <div className="flex flex-col h-full">
            
            {/* Header Drawer */}
            <div className="px-5 py-4 flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full -ml-2 hover:bg-secondary"
                onClick={cerrarCarrito}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div>
                <SheetTitle className="text-xl">Tu Pedido</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mesa {mesa?.nombre} • {todosLosItems.length} items
                </p>
              </div>
            </div>

            {/* Lista Items */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              {todosLosItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                  <div className="bg-secondary p-6 rounded-full">
                    <UtensilsCrossed className="w-10 h-10" />
                  </div>
                  <p className="font-medium">El pedido está vacío.</p>
                  <Button variant="link" onClick={cerrarCarrito}>Ir al menú</Button>
                </div>
              ) : (
                todosLosItems.map((item) => {
                  const esMio = item.clienteNombre === clienteNombre;
                  const prodOriginal = productos.find(p => p.id === (item.productoId || item.id)); 
                  const imagen = item.imagenUrl || prodOriginal?.imagenUrl;
                  const precio = parseFloat(item.precioUnitario || String(item.precio || 0));

                  return (
                    <div 
                      key={item.id} 
                      className={`relative flex gap-4 p-3 rounded-2xl border transition-all ${
                        esMio ? 'bg-card border-primary/20 shadow-sm' : 'bg-secondary/30 border-transparent opacity-90 grayscale-[0.3]'
                      }`}
                    >
                      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-secondary">
                        {imagen ? (
                          <img src={imagen} alt="img" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{item.nombreProducto || item.nombre}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                               <Badge variant="secondary" className={`h-5 text-[10px] px-1.5 font-normal rounded-md ${esMio ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : ''}`}>
                                  {esMio ? 'Tú' : item.clienteNombre}
                               </Badge>
                            </div>
                          </div>
                          <p className="font-bold text-base">
                            ${(precio * item.cantidad).toFixed(2)}
                          </p>
                        </div>

                        {esMio ? (
                          <div className="flex items-center justify-end gap-3 mt-2">
                             {item.cantidad === 1 ? (
                               <button 
                                 onClick={() => handleEliminarItem(item.id)}
                                 className="w-8 h-8 flex items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             ) : (
                               <button 
                                 onClick={() => handleDisminuirCantidad(item.id)}
                                 className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                               >
                                 <Minus className="w-3.5 h-3.5" />
                               </button>
                             )}
                             <span className="w-4 text-center text-sm font-semibold tabular-nums">{item.cantidad}</span>
                             <button 
                               onClick={() => handleAumentarCantidad(item.id)}
                               className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                             >
                               <Plus className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        ) : (
                           <div className="flex justify-end mt-2">
                             <span className="text-xs text-muted-foreground">x{item.cantidad} unidades</span>
                           </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer Drawer */}
            {todosLosItems.length > 0 && (
              <div className="p-5 bg-background border-t border-border shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground text-sm">Total a pagar</span>
                    <span className="text-2xl font-black tracking-tight">${totalPedido}</span>
                 </div>
                 <Button 
                   className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20" 
                   size="lg"
                   onClick={confirmarPedido}
                 >
                   Confirmar Pedido
                   <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                 </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ProductDetailDrawer
        product={selectedProduct ? { ...selectedProduct, categoria: selectedProduct.categoria ?? undefined } : null}
        open={drawerOpen}
        onClose={cerrarProductoDrawer}
        onAddToOrder={agregarAlPedido}
      />
    </div>
  )
}

export default Menu