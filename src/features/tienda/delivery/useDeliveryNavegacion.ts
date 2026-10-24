import { useCallback, useEffect } from 'react'
import type { ProductoTienda } from '../datos'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'setCarritoAbierto'
    | 'mostrarCheckoutEnCarrito'
    | 'setExpandido'
    | 'setMostrarCheckoutEnCarrito'
    | 'setEditSemaphoreLocal'
    | 'setCheckoutDeliveryData'
    | 'checkoutDataRef'
    | 'setEsPedidoHabitual'
    | 'setDrawerOpen'
    | 'setSelectedProduct'
    | 'carritoAbierto'
    | 'drawerOpen'
>

export function useDeliveryNavegacion({
    setCarritoAbierto,
    mostrarCheckoutEnCarrito,
    setExpandido,
    setMostrarCheckoutEnCarrito,
    setEditSemaphoreLocal,
    setCheckoutDeliveryData,
    checkoutDataRef,
    setEsPedidoHabitual,
    setDrawerOpen,
    setSelectedProduct,
    carritoAbierto,
    drawerOpen,
}: Contexto) {
    const abrirCarrito = useCallback(() => {
        window.history.pushState({ drawer: 'carrito' }, '')
        setCarritoAbierto(true)
        if (!mostrarCheckoutEnCarrito) setExpandido(true)
    }, [mostrarCheckoutEnCarrito, setCarritoAbierto, setExpandido])

    const cerrarCarrito = useCallback(() => {
        setCarritoAbierto(false)
        setMostrarCheckoutEnCarrito(false)
        setExpandido(false)
        setEditSemaphoreLocal(null)
        setCheckoutDeliveryData(null)
        checkoutDataRef.current = null
        setEsPedidoHabitual(false)
        if (window.history.state?.drawer === 'carrito') {
            window.history.back()
        }
    }, [
        checkoutDataRef,
        setCarritoAbierto,
        setCheckoutDeliveryData,
        setEditSemaphoreLocal,
        setEsPedidoHabitual,
        setExpandido,
        setMostrarCheckoutEnCarrito,
    ])

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
                setMostrarCheckoutEnCarrito(false)
                setExpandido(false)
                setEditSemaphoreLocal(null)
                setCheckoutDeliveryData(null)
                checkoutDataRef.current = null
                setEsPedidoHabitual(false)
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
    }, [
        carritoAbierto,
        checkoutDataRef,
        drawerOpen,
        setCarritoAbierto,
        setCheckoutDeliveryData,
        setDrawerOpen,
        setEditSemaphoreLocal,
        setEsPedidoHabitual,
        setExpandido,
        setMostrarCheckoutEnCarrito,
        setSelectedProduct,
    ])

    const abrirDetalleProducto = (producto: ProductoTienda) => {
        setSelectedProduct(producto)
        abrirProductoDrawer()
    }
    return { abrirCarrito, cerrarCarrito, abrirProductoDrawer, cerrarProductoDrawer, abrirDetalleProducto }
}
