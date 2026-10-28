import { guardarDireccionCliente } from '@/components/CheckoutDeliveryGrupal'
import { redirectPedidoAlWhatsapp } from '@/lib/checkoutWhatsapp'
import { armarPedidoDemo } from '@/lib/demo'
import { contextoParaPedidoMarketing, registrarEventoTrackingUnaVez } from '@/lib/tracking'
import { rutaTienda } from '@/store-sites/actual'
import { useCallback } from 'react'
import { toast } from 'sonner'
import type { CheckoutIndividual, CheckoutMensaje } from '../datos'
import { checkIsOpen } from '../horarios'
import { extrasTrackingCampana } from './modelo'
import type { useDeliveryNavegacion } from './useDeliveryNavegacion'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'restaurante'
    | 'username'
    | 'demo'
    | 'setPedidoDemo'
    | 'cartItems'
    | 'setCartItems'
    | 'setCanjeEnvioGratis'
    | 'setCanjeDescuento'
    | 'isSubmittingRef'
    | 'horarios'
    | 'setSubmittingOrder'
    | 'campana'
    | 'canjeEnvioGratis'
    | 'canjeDescuento'
    | 'orderAttemptIdRef'
    | 'setTelefonoCliente'
    | 'navigate'
    | 'setEditSemaphoreLocal'
    | 'checkoutDataRef'
    | 'setCheckoutDeliveryData'
> &
    Pick<ReturnType<typeof useDeliveryNavegacion>, 'cerrarCarrito'>

export function useDeliveryCheckout({
    restaurante,
    username,
    demo,
    setPedidoDemo,
    cartItems,
    setCartItems,
    setCanjeEnvioGratis,
    setCanjeDescuento,
    cerrarCarrito,
    isSubmittingRef,
    horarios,
    setSubmittingOrder,
    campana,
    canjeEnvioGratis,
    canjeDescuento,
    orderAttemptIdRef,
    setTelefonoCliente,
    navigate,
    setEditSemaphoreLocal,
    checkoutDataRef,
    setCheckoutDeliveryData,
}: Contexto) {
    const submitOrder = useCallback(
        async (data: CheckoutIndividual | null) => {
            if (!data || !restaurante || !username) return

            // La demo no crea el pedido: muestra el mensaje que le llegaría al local.
            if (demo) {
                setPedidoDemo(armarPedidoDemo(data, cartItems, restaurante))
                setCartItems([])
                setCanjeEnvioGratis(false)
                setCanjeDescuento(false)
                cerrarCarrito()
                isSubmittingRef.current = false
                return
            }

            // Local pausado por suscripción (Tarea 8): cerrado temporalmente, no toma pedidos nuevos.
            if (restaurante?.pausadoPorSuscripcion) {
                toast.error('El local está cerrado temporalmente', {
                    description: 'No está recibiendo pedidos en este momento.',
                    duration: 5000,
                })
                isSubmittingRef.current = false
                return
            }

            const estadoActual = checkIsOpen(horarios)
            if (!estadoActual.abierto && !restaurante?.permitirPedidosProgramados) {
                toast.error('El restaurante está cerrado', {
                    description: estadoActual.proximaApertura
                        ? `Abre ${estadoActual.proximaApertura}`
                        : 'El restaurante no está disponible en este momento.',
                    duration: 5000,
                })
                isSubmittingRef.current = false
                return
            }

            setSubmittingOrder(true)
            let pedidoCreado = false
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const tipoPedido = data.tipoPedido as 'delivery' | 'takeaway'
                const endpoint =
                    tipoPedido === 'delivery' ? '/public/delivery/create' : '/public/takeaway/create'
                const payload: Record<string, unknown> = {
                    restauranteId: restaurante?.id,
                    nombreCliente: data.nombre,
                    telefono: data.telefono,
                    notas: data.notas || '',
                    items: cartItems.map((i) => ({
                        productoId: i.productoId,
                        varianteId: i.varianteId,
                        varianteSecundariaId: i.varianteSecundariaId,
                        cantidad: i.cantidad,
                        ingredientesExcluidos: i.ingredientesExcluidos,
                        agregados: i.agregados || [],
                        nota: i.nota,
                        esCanjePuntos: i.esCanjePuntos || false,
                    })),
                    // Se omite cuando no hay medio elegido: el backend resuelve el
                    // default del local con el campo ausente, pero rechaza `null`.
                    ...(data.metodoPago ? { metodoPago: data.metodoPago } : {}),
                    ...contextoParaPedidoMarketing(username),
                    // CheckoutDeliveryGrupal capturó el contexto cuando se abrió.
                    // Se prioriza esa copia y finalmente la landing actual, para
                    // que storage bloqueado/limpiado no convierta la venta en orgánica.
                    ...(data.visitorId ? { visitorId: data.visitorId } : {}),
                    ...(data.sesionUuid ? { sesionUuid: data.sesionUuid } : {}),
                    ...(data.campaniaSlug ? { campaniaSlug: data.campaniaSlug } : {}),
                    ...(data.campanaId ? { campanaId: data.campanaId } : {}),
                    ...(data.recetaToken ? { recetaToken: data.recetaToken } : {}),
                    ...(campana ? { campaniaSlug: campana.slug, campanaId: campana.campanaId } : {}),
                }
                if (data.codigoDescuentoId) payload.codigoDescuentoId = data.codigoDescuentoId
                const aplicarCanjeEnvio =
                    data?.canjeEnvioGratis !== undefined ? Boolean(data.canjeEnvioGratis) : canjeEnvioGratis
                const aplicarCanjeDescuento =
                    data?.canjeDescuento !== undefined ? Boolean(data.canjeDescuento) : canjeDescuento
                if (aplicarCanjeEnvio) payload.canjeEnvioGratis = true
                if (aplicarCanjeDescuento) payload.canjeDescuento = true
                if (tipoPedido === 'delivery') {
                    payload.direccion = data.direccion
                    if (data.lat != null) payload.lat = data.lat
                    if (data.lng != null) payload.lng = data.lng
                    if (data.sucursalId) payload.sucursalId = data.sucursalId
                }
                if (tipoPedido === 'takeaway' && data.sucursalId) payload.sucursalId = data.sucursalId
                if (data.horarioProgramado) payload.horarioProgramado = data.horarioProgramado
                const res = await fetch(`${url}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Idempotency-Key':
                            (orderAttemptIdRef.current ??= `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`),
                    },
                    body: JSON.stringify(payload),
                })
                const result = await res.json()
                if (result.success) {
                    pedidoCreado = true
                    registrarEventoTrackingUnaVez(
                        restaurante?.id,
                        username,
                        'purchase',
                        `pedido-${result.data.id}`,
                        {
                            pedidoUnificadoId: result.data.id,
                            valor: result.data.total
                                ? parseFloat(result.data.total)
                                : parseFloat(data.total || '0'),
                            items: cartItems,
                            ...extrasTrackingCampana(campana, {
                                tipoPedido,
                                cantidadItems: cartItems.length,
                            }),
                        }
                    )
                    localStorage.setItem('cliente_nombre', data.nombre)
                    localStorage.setItem('cliente_telefono', data.telefono)
                    setTelefonoCliente(data.telefono)
                    if (tipoPedido === 'delivery') {
                        localStorage.setItem('cliente_direccion', data.direccion || '')
                        if (data.lat != null) localStorage.setItem('cliente_lat', String(data.lat))
                        if (data.lng != null) localStorage.setItem('cliente_lng', String(data.lng))
                        guardarDireccionCliente(
                            restaurante?.id,
                            data.telefono,
                            data.direccion || '',
                            data.lat ?? null,
                            data.lng ?? null
                        )
                    }
                    localStorage.removeItem(`deliveryCart_${username}`)
                    const orderInfo = {
                        pedidoId: result.data.id,
                        tipoPedido,
                        total: result.data.total
                            ? parseFloat(result.data.total)
                            : parseFloat(data.total || '0'),
                        items: cartItems,
                        metodoPago: data.metodoPago,
                        nombreCliente: data.nombre,
                        aliasDinamico: result.data.aliasDinamico,
                        cvuDinamico: result.data.cvuDinamico,
                        deliveryFee: result.data.deliveryFee,
                        zonaNombre: result.data.zonaNombre,
                        direccion: tipoPedido === 'delivery' ? data.direccion : null,
                        montoDescuento: (data.montoDescuento ?? 0) > 0 ? data.montoDescuento : undefined,
                        horarioProgramado: data.horarioProgramado || undefined,
                        notas: data.notas || undefined,
                        puntosGanados: result.data.puntosGanados ?? 0,
                        puntosUsados: result.data.puntosUsados ?? 0,
                        puntosCanjeTipo: result.data.puntosCanjeTipo ?? null,
                    }
                    sessionStorage.setItem('deliveryOrderInfo', JSON.stringify(orderInfo))
                    if (restaurante?.avisosWhatsappClienteEnabled === false) {
                        const redirected = await redirectPedidoAlWhatsapp(
                            orderInfo,
                            restaurante,
                            result.data.whatsappDestino,
                            result.data.transferenciaAliasDestino
                        )
                        if (!redirected) {
                            toast.error('No pudimos abrir WhatsApp', {
                                description: 'Podés continuar desde el resumen de tu pedido.',
                            })
                            navigate(rutaTienda(username, 'success'))
                        }
                    } else {
                        navigate(rutaTienda(username, 'success'))
                    }
                } else {
                    if (result.code === 'FUERA_DE_ZONA') {
                        toast.error('Fuera de zona', {
                            description:
                                'Tu dirección está fuera del área de delivery. Probá con otra dirección o elegí Take Away.',
                            duration: 6000,
                        })
                    } else {
                        toast.error(result.message || 'Error al crear el pedido')
                    }
                }
            } catch {
                toast.error('Ocurrió un error al enviar el pedido')
            } finally {
                // Si el servidor ya creó el pedido, el bloqueo se mantiene hasta que
                // la navegación (o la apertura de WhatsApp) desmonte esta pantalla.
                // Liberarlo antes permitía confirmar nuevamente el mismo carrito.
                if (!pedidoCreado) {
                    setSubmittingOrder(false)
                    isSubmittingRef.current = false
                }
            }
        },
        [
            restaurante,
            username,
            demo,
            horarios,
            setSubmittingOrder,
            setPedidoDemo,
            cartItems,
            setCartItems,
            setCanjeEnvioGratis,
            setCanjeDescuento,
            cerrarCarrito,
            isSubmittingRef,
            campana,
            canjeEnvioGratis,
            canjeDescuento,
            orderAttemptIdRef,
            setTelefonoCliente,
            navigate,
        ]
    )

    const handleCheckoutMessage = useCallback(
        (msg: CheckoutMensaje) => {
            if (msg.type === 'INICIAR_EDICION_CHECKOUT') {
                setEditSemaphoreLocal({ clienteId: 'solo', clienteNombre: msg.payload.clienteNombre })
            } else if (msg.type === 'CANCELAR_EDICION_CHECKOUT') {
                setEditSemaphoreLocal(null)
            } else if (msg.type === 'MODIFICAR_CHECKOUT') {
                orderAttemptIdRef.current = null
                checkoutDataRef.current = msg.payload.updates
                setCheckoutDeliveryData(msg.payload.updates)
                if (msg.payload?.updates?.canjeEnvioGratis !== undefined) {
                    setCanjeEnvioGratis(Boolean(msg.payload.updates.canjeEnvioGratis))
                }
                if (msg.payload?.updates?.canjeDescuento !== undefined) {
                    setCanjeDescuento(Boolean(msg.payload.updates.canjeDescuento))
                }
            } else if (msg.type === 'ACEPTAR_EDICION_CHECKOUT') {
                if (isSubmittingRef.current) return
                isSubmittingRef.current = true
                submitOrder(checkoutDataRef.current)
            }
        },
        [
            checkoutDataRef,
            isSubmittingRef,
            orderAttemptIdRef,
            setCanjeDescuento,
            setCanjeEnvioGratis,
            setCheckoutDeliveryData,
            setEditSemaphoreLocal,
            submitOrder,
        ]
    )
    return { submitOrder, handleCheckoutMessage }
}
