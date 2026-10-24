import { etiquetaVarianteMedallon } from '@/components/CheckoutDeliveryGrupal'
import { useEffect } from 'react'
import type { ItemCarritoTienda } from '../datos'
import { firmaPedido, type PedidoHistorico } from './modelo'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'restaurante'
    | 'username'
    | 'demo'
    | 'loading'
    | 'productos'
    | 'recomendacionIntentadaRef'
    | 'campana'
    | 'repAplicadoRef'
    | 'productoAplicadoRef'
    | 'searchParams'
    | 'tkAplicadoRef'
    | 'estadoAbierto'
    | 'cartItems'
    | 'sucursales'
    | 'setCartItems'
    | 'checkoutDataRef'
    | 'setCheckoutDeliveryData'
    | 'setEditSemaphoreLocal'
    | 'setMostrarCheckoutEnCarrito'
    | 'setExpandido'
    | 'setEsPedidoHabitual'
    | 'setCarritoAbierto'
>

export function usePedidoHabitual({
    restaurante,
    username,
    demo,
    loading,
    productos,
    recomendacionIntentadaRef,
    campana,
    repAplicadoRef,
    productoAplicadoRef,
    searchParams,
    tkAplicadoRef,
    estadoAbierto,
    cartItems,
    sucursales,
    setCartItems,
    checkoutDataRef,
    setCheckoutDeliveryData,
    setEditSemaphoreLocal,
    setMostrarCheckoutEnCarrito,
    setExpandido,
    setEsPedidoHabitual,
    setCarritoAbierto,
}: Contexto) {
    useEffect(() => {
        const recomendacionKey = restaurante?.id && username ? `${restaurante?.id}:${username}` : null
        if (
            demo ||
            loading ||
            !recomendacionKey ||
            productos.length === 0 ||
            recomendacionIntentadaRef.current === recomendacionKey
        )
            return
        const esCampanaLoMismo = campana?.tipo === 'lo_mismo' || campana?.slug === 'lo-mismo'
        // Un Smart Link tiene prioridad sobre recomendación histórica, excepto si es la campaña "Lo Mismo de Siempre".
        if (
            (campana && !esCampanaLoMismo) ||
            repAplicadoRef.current ||
            productoAplicadoRef.current ||
            searchParams.has('rep') ||
            searchParams.has('producto') ||
            searchParams.has('tk') ||
            searchParams.has('c') ||
            tkAplicadoRef.current
        )
            return
        if (
            !estadoAbierto.abierto ||
            restaurante?.soloPedidosProgramados ||
            restaurante?.pausadoPorSuscripcion
        )
            return
        recomendacionIntentadaRef.current = recomendacionKey

        const telefono = localStorage.getItem('cliente_telefono')?.trim()
        // En producción nunca se pisa un carrito que el cliente ya empezó.
        if (!telefono || (!import.meta.env.DEV && cartItems.length > 0)) return

        const cargarPedidoHabitual = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const res = await fetch(
                    `${url}/public/restaurante/${restaurante?.id}/mis-pedidos/${encodeURIComponent(telefono)}`
                )
                if (!res.ok) return
                const response = await res.json()
                const pedidos: PedidoHistorico[] = Array.isArray(response.data)
                    ? response.data.filter(
                          (pedido: PedidoHistorico) =>
                              pedido.estado !== 'cancelled' && pedido.items?.length > 0
                      )
                    : []
                if (pedidos.length === 0 || (!esCampanaLoMismo && !import.meta.env.DEV && pedidos.length < 2))
                    return

                const grupos = new Map<string, PedidoHistorico[]>()
                pedidos.forEach((pedido) => {
                    const firma = firmaPedido(pedido)
                    if (!firma) return
                    grupos.set(firma, [...(grupos.get(firma) || []), pedido])
                })
                const grupoHabitual = [...grupos.values()].sort((a, b) => b.length - a.length)[0]
                if (!grupoHabitual || (!import.meta.env.DEV && grupoHabitual.length < 2)) return

                const pedido = grupoHabitual[0]
                const metodosDisponibles = new Set(
                    (restaurante?.metodosPago || []).map((metodo) => metodo.id)
                )
                if (
                    !pedido.nombreCliente?.trim() ||
                    !pedido.metodoPago ||
                    !metodosDisponibles.has(pedido.metodoPago)
                )
                    return
                if (pedido.tipo === 'delivery' && restaurante?.deliveryEnabled === false) return
                if (pedido.tipo === 'takeaway' && restaurante?.takeawayEnabled === false) return

                let deliveryFee = 0
                let zonaNombre: string | null = null
                let sucursalId = pedido.sucursalId ?? null
                const lat = pedido.latitud == null ? null : Number(pedido.latitud)
                const lng = pedido.longitud == null ? null : Number(pedido.longitud)
                if (pedido.tipo === 'delivery') {
                    if (!pedido.direccion?.trim()) return
                    if (restaurante?.direccionSoloTexto === true) {
                        deliveryFee = Number(restaurante?.deliveryFee || 0)
                    } else {
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
                        const zonaRes = await fetch(
                            `${url}/public/restaurante/${restaurante?.id}/check-zona?lat=${lat}&lng=${lng}`
                        )
                        const zona = await zonaRes.json()
                        if (!zonaRes.ok || !zona.success || zona.code === 'FUERA_DE_ZONA') return
                        deliveryFee = Number(zona.deliveryFee || 0)
                        zonaNombre = zona.zonaNombre || null
                        sucursalId = zona.sucursalId ?? null
                    }
                } else if (sucursales.length > 0) {
                    const sucursal =
                        sucursales.find((s) => s.id === pedido.sucursalId) ||
                        (sucursales.length === 1 ? sucursales[0] : null)
                    if (!sucursal) return
                    sucursalId = sucursal.id
                }

                const itemsReconstruidos = pedido.items.map((item, index) => {
                    const producto = productos.find((productoActual) => productoActual.id === item.productoId)
                    if (!producto || item.esCanjePuntos) return null
                    const variante = item.varianteId
                        ? producto.variantes?.find((opcion) => opcion.id === item.varianteId)
                        : null
                    const varianteSecundaria = item.varianteSecundariaId
                        ? producto.variantesSecundarias?.find(
                              (opcion) => opcion.id === item.varianteSecundariaId
                          )
                        : null
                    if (
                        (producto.variantes?.length && !variante) ||
                        (producto.variantesSecundarias?.length && !varianteSecundaria)
                    )
                        return null

                    const idsAgregados = Array.isArray(item.agregados)
                        ? item.agregados.map((agregado) => Number(agregado?.id))
                        : []
                    const agregados = idsAgregados
                        .map((id) => producto.agregados?.find((agregado) => agregado.id === id))
                        .filter((valor): valor is NonNullable<typeof valor> => valor != null)
                    if (agregados.length !== idsAgregados.length) return null
                    const excluidos = Array.isArray(item.ingredientesExcluidos)
                        ? item.ingredientesExcluidos.map(Number)
                        : []
                    const ingredientesExcluidosNombres = excluidos
                        .map(
                            (id) =>
                                producto.ingredientes?.find((ingrediente) => ingrediente.id === id)?.nombre
                        )
                        .filter((valor): valor is NonNullable<typeof valor> => valor != null)
                    if (ingredientesExcluidosNombres.length !== excluidos.length) return null

                    let precio = variante ? Number(variante.precio) : Number(producto.precio)
                    precio += varianteSecundaria ? Number(varianteSecundaria.precio) : 0
                    if (Number(producto.descuento || 0) > 0)
                        precio *= 1 - Number(producto.descuento || 0) / 100
                    precio += agregados.reduce(
                        (suma: number, agregado) => suma + Number(agregado.precio || 0),
                        0
                    )
                    const variantesNombre = [variante?.nombre, varianteSecundaria?.nombre]
                        .filter((valor): valor is NonNullable<typeof valor> => valor != null)
                        .join(' · ')
                    return {
                        id: `habitual-${pedido.id}-${index}`,
                        productoId: producto.id,
                        categoria: producto.categoria,
                        productoNombre: producto.nombre,
                        tieneSelectorMedallon:
                            producto.agregados?.some(
                                (agregado) => etiquetaVarianteMedallon(agregado.nombre) !== null
                            ) ?? false,
                        nombre: variantesNombre ? `${producto.nombre} - ${variantesNombre}` : producto.nombre,
                        precio: precio.toFixed(2),
                        precioOriginal: variante?.precio || producto.precio,
                        descuento: producto.descuento || 0,
                        imagenUrl: producto.imagenUrl,
                        cantidad: item.cantidad ?? 1,
                        varianteId: variante?.id,
                        varianteNombre: variante?.nombre,
                        varianteSecundariaId: varianteSecundaria?.id,
                        varianteSecundariaNombre: varianteSecundaria?.nombre,
                        ingredientesExcluidos: excluidos,
                        ingredientesExcluidosNombres,
                        agregados,
                        nota: item.nota?.trim() || undefined,
                        esCanjePuntos: false,
                        puntosNecesarios: 0,
                        puntosGanados: producto.puntosGanados,
                    }
                })
                if (itemsReconstruidos.some(Boolean) && itemsReconstruidos.some((item) => item === null))
                    return
                const items = itemsReconstruidos.filter(
                    (valor): valor is NonNullable<typeof valor> => valor != null
                ) as ItemCarritoTienda[]
                if (items.length === 0) return

                const itemsTotal = items.reduce((suma, item) => suma + Number(item.precio) * item.cantidad, 0)
                const checkout = {
                    tipoPedido: pedido.tipo,
                    nombre: pedido.nombreCliente.trim(),
                    telefono,
                    direccion: pedido.tipo === 'delivery' ? pedido.direccion!.trim() : '',
                    lat: pedido.tipo === 'delivery' && Number.isFinite(lat) ? lat : null,
                    lng: pedido.tipo === 'delivery' && Number.isFinite(lng) ? lng : null,
                    notas: '',
                    tipoDomicilio: null,
                    deliveryFee,
                    zonaNombre,
                    itemsTotal: itemsTotal.toFixed(2),
                    total: (itemsTotal + deliveryFee).toFixed(2),
                    codigoDescuentoId: null,
                    montoDescuento: 0,
                    metodoPago: pedido.metodoPago,
                    horarioProgramado: '',
                    sucursalId,
                }
                setCartItems(items)
                checkoutDataRef.current = checkout
                setCheckoutDeliveryData(checkout)
                setEditSemaphoreLocal(null)
                setMostrarCheckoutEnCarrito(true)
                setExpandido(false)
                setEsPedidoHabitual(true)
                window.history.pushState({ drawer: 'carrito' }, '')
                setCarritoAbierto(true)
            } catch (error) {
                console.error('Error preparando el pedido habitual:', error)
            }
        }

        cargarPedidoHabitual()
    }, [
        demo,
        loading,
        restaurante,
        productos,
        sucursales,
        cartItems.length,
        estadoAbierto.abierto,
        campana,
        searchParams,
        username,
        recomendacionIntentadaRef,
        repAplicadoRef,
        productoAplicadoRef,
        tkAplicadoRef,
        setCartItems,
        checkoutDataRef,
        setCheckoutDeliveryData,
        setEditSemaphoreLocal,
        setMostrarCheckoutEnCarrito,
        setExpandido,
        setEsPedidoHabitual,
        setCarritoAbierto,
    ])
}
