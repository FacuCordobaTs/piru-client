import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { GrupoState } from './useGrupoState'

type Contexto = Pick<
    GrupoState,
    | 'restaurante'
    | 'setCarritoAbierto'
    | 'mostrarCheckoutEnCarrito'
    | 'setExpandido'
    | 'setDrawerOpen'
    | 'setSelectedProduct'
    | 'carritoAbierto'
    | 'drawerOpen'
>

export function useGrupoNavegacion({
    restaurante,
    setCarritoAbierto,
    mostrarCheckoutEnCarrito,
    setExpandido,
    setDrawerOpen,
    setSelectedProduct,
    carritoAbierto,
    drawerOpen,
}: Contexto) {
    const compartirLink = useCallback(() => {
        const mensaje = `Armemos un pedido juntos en ${restaurante?.nombre || 'el restaurante'} 🍽️`
        const url = window.location.href
        if (navigator.share) {
            navigator.share({ title: mensaje, text: mensaje, url }).catch(() => {})
        } else {
            navigator.clipboard.writeText(`${mensaje}\n${url}`)
            toast.success('¡Link copiado al portapapeles!')
        }
    }, [restaurante?.nombre])

    const abrirCarrito = useCallback(() => {
        window.history.pushState({ drawer: 'carrito' }, '')
        setCarritoAbierto(true)
        if (!mostrarCheckoutEnCarrito) setExpandido(true)
    }, [mostrarCheckoutEnCarrito, setCarritoAbierto, setExpandido])

    const cerrarCarrito = useCallback(() => {
        setCarritoAbierto(false)
        if (window.history.state?.drawer === 'carrito') {
            window.history.back()
        }
    }, [setCarritoAbierto])

    const abrirProductoDrawer = useCallback(() => {
        window.history.pushState({ drawer: 'producto' }, '')
        setDrawerOpen(true)
    }, [setDrawerOpen])

    const cerrarProductoDrawer = useCallback(() => {
        setDrawerOpen(false)
        setTimeout(() => setSelectedProduct(null), 300)
        if (window.history.state?.drawer === 'producto') {
            window.history.back()
        }
    }, [setDrawerOpen, setSelectedProduct])

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (carritoAbierto) {
                setCarritoAbierto(false)
                setExpandido(false)
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
    }, [carritoAbierto, drawerOpen, setCarritoAbierto, setDrawerOpen, setExpandido, setSelectedProduct])

    const abrirDetalleProducto = (producto: GrupoState['productos'][number]) => {
        setSelectedProduct(producto)
        abrirProductoDrawer()
    }
    return {
        compartirLink,
        abrirCarrito,
        cerrarCarrito,
        abrirProductoDrawer,
        cerrarProductoDrawer,
        abrirDetalleProducto,
    }
}
