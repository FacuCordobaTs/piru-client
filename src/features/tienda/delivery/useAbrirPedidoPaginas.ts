import { useEffect, useRef } from 'react'
import type { DeliveryState } from './useDeliveryState'

/**
 * Llegada desde un sitio de Páginas (`CheckoutPaginas` deja el carrito y navega con `?pedir=1`):
 * apenas carga la tienda se abre el pedido, como si el comprador hubiera tocado "Ver pedido".
 */
export function useAbrirPedidoPaginas({
    searchParams,
    setSearchParams,
    loading,
    cartItems,
    abrirCarrito,
}: Pick<DeliveryState, 'searchParams' | 'setSearchParams' | 'loading' | 'cartItems'> & { abrirCarrito: () => void }) {
    const hecho = useRef(false)
    useEffect(() => {
        if (hecho.current || loading || searchParams.get('pedir') !== '1') return
        hecho.current = true
        const siguiente = new URLSearchParams(searchParams)
        siguiente.delete('pedir')
        setSearchParams(siguiente, { replace: true })
        if (cartItems.length > 0) abrirCarrito()
    }, [loading, searchParams, setSearchParams, cartItems.length, abrirCarrito])
}
