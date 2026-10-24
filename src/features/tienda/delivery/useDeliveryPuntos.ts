import { useCallback, useEffect, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'setTelefonoCliente'
    | 'setModalPuntosOpen'
    | 'restaurante'
    | 'cartItems'
    | 'canjeEnvioGratis'
    | 'canjeDescuento'
    | 'productos'
    | 'puntosCliente'
    | 'canjeRef'
    | 'setCanjeEnvioGratis'
    | 'setCheckoutDeliveryData'
    | 'checkoutDataRef'
    | 'setCanjeDescuento'
>

export function useDeliveryPuntos({
    setTelefonoCliente,
    setModalPuntosOpen,
    restaurante,
    cartItems,
    canjeEnvioGratis,
    canjeDescuento,
    productos,
    puntosCliente,
    canjeRef,
    setCanjeEnvioGratis,
    setCheckoutDeliveryData,
    checkoutDataRef,
    setCanjeDescuento,
}: Contexto) {
    const handleLoginPuntos = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const tel = new FormData(e.currentTarget).get('telefono') as string
        if (tel) {
            localStorage.setItem('cliente_telefono', tel)
            setTelefonoCliente(tel)
            setModalPuntosOpen(false)
        }
    }

    const configPuntos = restaurante?.sistemaPuntos ? restaurante?.configuracionPuntos : null

    const tieneEnvioGratisCanje = Boolean(
        configPuntos?.permiteCanjeEnvioGratis || configPuntos?.permitirCanjeEnvioGratis
    )

    const tieneDescuentoCanje = Boolean(
        configPuntos?.permiteCanjeDescuento || configPuntos?.permitirCanjeDescuento
    )

    const costoEnvioGratis = Number(configPuntos?.puntosEnvioGratis || 0)

    const costoDescuento = Number(configPuntos?.descuentoPuntosCosto || 0)

    const puntosEnCarrito = useCallback(
        () =>
            cartItems.reduce(
                (sum, item) =>
                    sum + (item.esCanjePuntos ? Number(item.puntosNecesarios || 0) * item.cantidad : 0),
                0
            ),
        [cartItems]
    )

    const puntosGanadosCarrito = () =>
        cartItems.reduce(
            (sum, item) =>
                sum +
                (!item.esCanjePuntos && item.puntosGanados
                    ? Number(item.puntosGanados || 0) * item.cantidad
                    : 0),
            0
        )

    const puntosUsadosBeneficios =
        (canjeEnvioGratis && tieneEnvioGratisCanje ? costoEnvioGratis : 0) +
        (canjeDescuento && tieneDescuentoCanje ? costoDescuento : 0)

    const productosCanje = productos.filter((p) => Number(p.puntosNecesarios) > 0)

    const tieneOpcionesCanje = productosCanje.length > 0

    const puntosDisponibles =
        puntosCliente === null
            ? null
            : Math.max(0, puntosCliente - puntosEnCarrito() - puntosUsadosBeneficios)

    const puntosConPedido =
        puntosCliente === null
            ? null
            : Math.max(0, puntosCliente - puntosEnCarrito() - puntosUsadosBeneficios + puntosGanadosCarrito())

    const verPuntos = () => {
        if (puntosCliente === null) {
            setModalPuntosOpen(true)
            return
        }
        if (tieneOpcionesCanje && canjeRef.current) {
            const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            canjeRef.current.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'start' })
            return
        }
        const canjes = [tieneEnvioGratisCanje && 'envío gratis', tieneDescuentoCanje && 'descuentos']
            .filter(Boolean)
            .join(' y ')
        toast.info(
            canjes ? `Canjeá tus puntos por ${canjes} al confirmar tu pedido` : 'Sumás puntos con cada pedido'
        )
    }

    useEffect(() => {
        if (puntosCliente !== null) {
            const disponiblesAntes = (puntosCliente ?? 0) - puntosEnCarrito()
            if (canjeEnvioGratis && disponiblesAntes < costoEnvioGratis) {
                setCanjeEnvioGratis(false)
                setCheckoutDeliveryData((prev) => (prev ? { ...prev, canjeEnvioGratis: false } : prev))
                if (checkoutDataRef.current) checkoutDataRef.current.canjeEnvioGratis = false
            }
            const disponiblesTrasEnvio = disponiblesAntes - (canjeEnvioGratis ? costoEnvioGratis : 0)
            if (canjeDescuento && disponiblesTrasEnvio < costoDescuento) {
                setCanjeDescuento(false)
                setCheckoutDeliveryData((prev) => (prev ? { ...prev, canjeDescuento: false } : prev))
                if (checkoutDataRef.current) checkoutDataRef.current.canjeDescuento = false
            }
        }
    }, [
        puntosCliente,
        cartItems,
        canjeEnvioGratis,
        canjeDescuento,
        costoEnvioGratis,
        costoDescuento,
        puntosEnCarrito,
        setCanjeEnvioGratis,
        setCheckoutDeliveryData,
        checkoutDataRef,
        setCanjeDescuento,
    ])
    return {
        handleLoginPuntos,
        configPuntos,
        tieneEnvioGratisCanje,
        tieneDescuentoCanje,
        costoEnvioGratis,
        costoDescuento,
        puntosEnCarrito,
        puntosGanadosCarrito,
        puntosUsadosBeneficios,
        productosCanje,
        tieneOpcionesCanje,
        puntosDisponibles,
        puntosConPedido,
        verPuntos,
    }
}
