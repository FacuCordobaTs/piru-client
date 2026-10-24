import { direccionDemo } from '@/lib/demo'
import { fotosDeProducto } from '@/lib/fotosProducto'
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
    | 'semillaDestacado'
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
    semillaDestacado,
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

    const conFoto = productosVenta.filter((p) => fotosDeProducto(p).length > 0)

    const enOferta = conFoto.filter((p) => Number(p.descuento) > 0)

    const candidatos = enOferta.length > 0 ? enOferta : conFoto.length > 0 ? conFoto : productosVenta

    const destacado = productoCampana
        ? null
        : (candidatos[Math.floor(semillaDestacado * candidatos.length)] ?? null)

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
        conFoto,
        enOferta,
        candidatos,
        destacado,
        verCarta,
    }
}
