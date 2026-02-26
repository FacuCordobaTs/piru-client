import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import {
    Trash2, ArrowLeft,
    Package, Receipt, UtensilsCrossed, Utensils
} from 'lucide-react'
import { ProductDetailDrawer } from '@/components/ProductDetailDrawer'
import { ThemeToggle } from '@/components/ThemeToggle'

const MenuDelivery = () => {
    const navigate = useNavigate()
    const { username } = useParams()

    const [carritoAbierto, setCarritoAbierto] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('All')

    const [restaurante, setRestaurante] = useState<any>(null)
    const [productos, setProductos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Local cart state
    const [cartItems, setCartItems] = useState<any[]>([])

    useEffect(() => {
        const fetchRestaurante = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const res = await fetch(`${url}/public/restaurante/${username}`)
                if (!res.ok) {
                    throw new Error('Restaurante no encontrado')
                }
                const data = await res.json()
                if (data.success) {
                    setRestaurante(data.data.restaurante)
                    setProductos(data.data.productos)
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error('Error al cargar restaurante')
            } finally {
                setLoading(false)
            }
        }
        if (username) {
            fetchRestaurante()
        }
    }, [username])

    const abrirCarrito = useCallback(() => {
        window.history.pushState({ drawer: 'carrito' }, '')
        setCarritoAbierto(true)
    }, [])

    const cerrarCarrito = useCallback(() => {
        setCarritoAbierto(false)
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

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (carritoAbierto) {
                setCarritoAbierto(false)
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

    const abrirDetalleProducto = (producto: any) => {
        setSelectedProduct(producto)
        abrirProductoDrawer()
    }

    const agregarAlPedido = (producto: any, cantidad: number = 1, ingredientesExcluidos?: number[]) => {
        let ingExNombres: string[] = []
        if (ingredientesExcluidos && ingredientesExcluidos.length > 0) {
            ingExNombres = producto.ingredientes
                .filter((i: any) => ingredientesExcluidos.includes(i.id))
                .map((i: any) => i.nombre)
        }

        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            productoId: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagenUrl: producto.imagenUrl,
            cantidad,
            ingredientesExcluidos: ingredientesExcluidos || [],
            ingredientesExcluidosNombres: ingExNombres
        }

        setCartItems(prev => [...prev, newItem])
        setTimeout(() => abrirCarrito(), 350)
    }

    const handleEliminarItem = (itemId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== itemId))
    }

    const confirmarPedido = () => {
        if (cartItems.length === 0) return
        // Guardar cartItems temporalmente para pasar al checkout
        sessionStorage.setItem('deliveryCart', JSON.stringify({ items: cartItems, restauranteId: restaurante.id }))
        navigate(`/${username}/checkout`)
    }

    const totalPedido = cartItems.reduce((sum, item) => sum + (parseFloat(item.precio) * item.cantidad), 0).toFixed(2)

    if (loading) {
        return <div className="min-h-screen flex justify-center items-center">Cargando...</div>
    }

    if (!restaurante) {
        return <div className="min-h-screen flex justify-center items-center">Restaurante no encontrado</div>
    }

    return (
        <div className="min-h-screen pb-32 bg-background font-sans selection:bg-primary/20">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 supports-backdrop-filter:bg-background/60">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50">
                            <span className="text-sm font-medium">{restaurante.nombre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-5 pt-4 space-y-6">
                <section className="space-y-4">
                    <div className="flex items-center gap-4">
                        {restaurante.imagenUrl && (
                            <img src={restaurante.imagenUrl} alt="logo" className="w-16 h-16 rounded-full object-cover border-2 border-border shadow-sm" />
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-0.5">Bienvenido a</p>
                            <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-orange-800 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:to-orange-200">
                                {restaurante.nombre}
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="space-y-3 py-4 px-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm font-medium">
                        Selecciona los productos y arma tu pedido para Delivery o Take Away.
                    </p>
                </section>

                {categorias.length > 1 && (
                    <section className="space-y-3 pt-2">
                        <h2 className="text-lg font-bold text-foreground px-1">Categorías</h2>
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
                                        <div className="flex gap-4 overflow-x-auto pb-3  ml-2 scrollbar-hide snap-x snap-mandatory">
                                            {productosDeCategoria.map((producto: any) => (
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-1">
                                    {productosFiltrados.map((producto: any) => (
                                        <ProductoCard
                                            key={producto.id}
                                            producto={producto}
                                            onClick={() => abrirDetalleProducto(producto)}
                                            fullWidth
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <EmptyState />
                        )
                    )}
                </section>
            </div>

            {/* FOOTER / VER PEDIDO */}
            <div className={`fixed bottom-6 left-0 right-0 flex justify-center z-40 transition-all duration-500 ${cartItems.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <button
                    onClick={abrirCarrito}
                    className={`
            group relative flex items-center gap-4 pl-5 pr-6 py-3.5 rounded-full 
            shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300
            bg-zinc-900 text-white shadow-zinc-900/20
            dark:bg-white/10 dark:text-white dark:backdrop-blur-xl 
            dark:border dark:border-white/10 dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]
          `}
                >
                    <div className="absolute -top-2 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-background z-10">
                        {cartItems.length}
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Receipt className="w-5 h-5 text-current opacity-90" />
                        <span className="font-semibold text-sm tracking-wide">Ver Pedido</span>
                    </div>
                    <div className="h-4 w-px bg-current opacity-20"></div>
                    <span className="font-bold text-base font-mono">
                        ${totalPedido}
                    </span>
                </button>
            </div>

            {/* CARRITO SHEET */}
            <Sheet open={carritoAbierto} onOpenChange={(open) => !open && cerrarCarrito()}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l-0 sm:border-l bg-background">
                    <div className="flex flex-col h-full">
                        <div className="px-5 py-4 flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
                            <Button variant="ghost" size="icon" className="rounded-full -ml-2 hover:bg-secondary" onClick={cerrarCarrito}>
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                            <div>
                                <SheetTitle className="text-xl">Tu Pedido</SheetTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">{cartItems.length} items</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
                            {cartItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                                    <div className="bg-secondary p-6 rounded-full">
                                        <UtensilsCrossed className="w-10 h-10" />
                                    </div>
                                    <p className="font-medium">El pedido está vacío.</p>
                                    <Button variant="link" onClick={cerrarCarrito}>Ir al menú</Button>
                                </div>
                            ) : (
                                cartItems.map((item) => {
                                    const imagen = item.imagenUrl;
                                    const precio = parseFloat(item.precio || 0);

                                    return (
                                        <div key={item.id} className="relative flex gap-4 p-3 rounded-2xl border transition-all bg-card border-primary/20 shadow-sm">
                                            <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-secondary">
                                                {imagen ? (
                                                    <img src={imagen} alt="img" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <Utensils className="w-6 h-6 text-orange-500" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm truncate">{item.nombre}</p>
                                                        {/* item.ingredientesExcluidosNombres */}
                                                        {item.ingredientesExcluidosNombres?.length > 0 && (
                                                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                                                                ⚠️ Sin: {item.ingredientesExcluidosNombres.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-base">${(precio * item.cantidad).toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center justify-end gap-3 mt-2">
                                                    <button onClick={() => handleEliminarItem(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="p-5 bg-background border-t border-border shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-muted-foreground text-sm">Total a pagar</span>
                                    <span className="text-2xl font-black tracking-tight">${totalPedido}</span>
                                </div>
                                <Button className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 bg-orange-500 hover:bg-orange-600" size="lg" onClick={confirmarPedido}>
                                    Continuar
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

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
        <Package className="w-10 h-10 mb-2" />
        <p className="text-sm">Sin productos disponibles.</p>
    </div>
)

const ProductoCard = ({ producto, onClick, fullWidth }: { producto: any, onClick: () => void, fullWidth?: boolean }) => (
    <div
        className={`group relative ${fullWidth ? 'w-full' : 'w-44 shrink-0'} h-52 rounded-3xl overflow-hidden cursor-pointer ${!fullWidth ? 'snap-start' : ''} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
        onClick={onClick}
    >
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
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <div className="rounded-2xl p-3 bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
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

export default MenuDelivery
