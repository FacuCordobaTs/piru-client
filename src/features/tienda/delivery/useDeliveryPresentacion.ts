import { direccionDemo } from '@/lib/demo'
import { elegirProductoDestacado } from '../catalogo'
import { logoPara, textoEstado } from '@/lib/tienda'
import { useMemo } from 'react'
import type { useDeliveryProductos } from './useDeliveryProductos'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'demo'
    | 'restaurante'
    | 'sucursales'
    | 'username'
    | 'paleta'
    | 'horarios'
    | 'estadoAbierto'
    | 'tienda'
    | 'cartaRef'
> &
    Pick<ReturnType<typeof useDeliveryProductos>, 'productosVenta' | 'productoCampana'>

export function useDeliveryPresentacion({
    demo,
    restaurante,
    sucursales,
    username,
    paleta,
    horarios,
    estadoAbierto,
    productosVenta,
    productoCampana,
    tienda,
    cartaRef,
}: Contexto) {
    const direccionClienta = useMemo(
        () => (demo && restaurante ? direccionDemo(restaurante, sucursales) : null),
        [demo, restaurante, sucursales]
    )

    const nombreLocal: string = restaurante?.nombre || username || 'Tienda'

    const logoLocal = logoPara(restaurante, paleta.oscuro)

    const ofrece = [
        restaurante?.deliveryEnabled !== false && 'Delivery',
        restaurante?.takeawayEnabled !== false && 'Take away',
    ].filter((x): x is string => Boolean(x))

    const direccionLocal: string | null = restaurante?.direccionTexto ?? restaurante?.direccion ?? null

    const estadoLocal = restaurante?.pausadoPorSuscripcion
        ? { abierto: false, texto: 'Cerrado temporalmente' }
        : horarios.length > 0
          ? { abierto: estadoAbierto.abierto, texto: textoEstado(horarios, estadoAbierto) }
          : null

    const checkoutCerrado =
        !!restaurante?.pausadoPorSuscripcion ||
        (!estadoAbierto.abierto && !restaurante?.permitirPedidosProgramados)

    const destacado = productoCampana
        ? null
        : elegirProductoDestacado(productosVenta, tienda.productoDestacadoId)

    const verCarta = () => {
        const el = cartaRef.current
        if (!el) return
        const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - 16,
            behavior: sinMovimiento ? 'auto' : 'smooth',
        })
    }
    return {
        direccionClienta,
        nombreLocal,
        logoLocal,
        ofrece,
        direccionLocal,
        estadoLocal,
        checkoutCerrado,
        destacado,
        verCarta,
    }
}
