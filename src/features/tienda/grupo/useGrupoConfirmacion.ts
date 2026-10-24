import { redirectPedidoAlWhatsapp } from '@/lib/checkoutWhatsapp'
import { registrarEventoTrackingUnaVez } from '@/lib/tracking'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type { GrupoState } from './useGrupoState'

import type { useGrupoNavegacion } from './useGrupoNavegacion'

type Contexto = Pick<
    GrupoState,
    | 'clienteNombre'
    | 'clienteId'
    | 'restaurante'
    | 'urlQrToken'
    | 'clientes'
    | 'sendMessage'
    | 'setEnviandoSolo'
    | 'qrToken'
    | 'isHydrated'
    | 'setBienvenidaOpen'
    | 'confirmacionGrupal'
    | 'setConfirmacionGrupalOpen'
    | 'confirmacionCancelada'
    | 'clearConfirmacionCancelada'
    | 'esSala'
    | 'enviandoSolo'
    | 'checkoutDeliveryData'
> &
    Pick<ReturnType<typeof useGrupoNavegacion>, 'cerrarCarrito'>

export function useGrupoConfirmacion({
    clienteNombre,
    clienteId,
    restaurante,
    urlQrToken,
    clientes,
    sendMessage,
    cerrarCarrito,
    setEnviandoSolo,
    qrToken,
    isHydrated,
    setBienvenidaOpen,
    confirmacionGrupal,
    setConfirmacionGrupalOpen,
    confirmacionCancelada,
    clearConfirmacionCancelada,
    esSala,
    enviandoSolo,
    checkoutDeliveryData,
}: Contexto) {
    const iniciarConfirmacionPedido = () => {
        if (!clienteNombre || !clienteId) return

        if (restaurante?.avisosWhatsappClienteEnabled === false && urlQrToken) {
            sessionStorage.setItem(`salaWhatsappInitiator_${urlQrToken}`, '1')
        }

        // Si solo hay un cliente, confirmar directamente (compatibilidad)
        if (clientes.length <= 1) {
            sendMessage({ type: 'CONFIRMAR_PEDIDO', payload: {} })
            cerrarCarrito()
            // Feedback visible mientras el WS/poll procesa el pedido y redirige a éxito.
            setEnviandoSolo(true)
            return
        }

        // Iniciar confirmación grupal
        sendMessage({
            type: 'INICIAR_CONFIRMACION',
            payload: { clienteId, clienteNombre },
        })
        cerrarCarrito()
    }

    const confirmarMiParte = () => {
        if (!clienteId) return
        sendMessage({
            type: 'USUARIO_CONFIRMO',
            payload: { clienteId },
        })
    }

    const cancelarConfirmacion = () => {
        if (!clienteId || !clienteNombre) return
        sendMessage({
            type: 'USUARIO_CANCELO',
            payload: { clienteId, clienteNombre },
        })
    }

    useEffect(() => {
        const t = urlQrToken || qrToken
        if (!isHydrated || !t) return
        const key = `bienvenida_shown_${t}`
        if (!sessionStorage.getItem(key)) {
            setBienvenidaOpen(true)
            sessionStorage.setItem(key, '1')
        }
    }, [isHydrated, urlQrToken, qrToken, setBienvenidaOpen])

    useEffect(() => {
        if (confirmacionGrupal?.activa) {
            setConfirmacionGrupalOpen(true)
        } else {
            setConfirmacionGrupalOpen(false)
        }
    }, [confirmacionGrupal?.activa, setConfirmacionGrupalOpen])

    useEffect(() => {
        if (confirmacionCancelada) {
            toast.error(`${confirmacionCancelada.canceladoPor} canceló la confirmación`, {
                duration: 3000,
            })
            clearConfirmacionCancelada()
        }
    }, [confirmacionCancelada, clearConfirmacionCancelada])

    const yaConfirme =
        confirmacionGrupal?.confirmaciones.find((c) => c.clienteId === clienteId)?.confirmado ?? false

    const totalConfirmados = confirmacionGrupal?.confirmaciones.filter((c) => c.confirmado).length ?? 0

    const totalClientes = confirmacionGrupal?.confirmaciones.length ?? 0

    const todosConfirmaron = esSala && totalClientes > 0 && totalConfirmados === totalClientes

    useEffect(() => {
        if (!(todosConfirmaron || (enviandoSolo && esSala)) || !urlQrToken) return
        const token = urlQrToken
        const poll = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const res = await fetch(`${url}/public/sala/${token}/order-created`)
                const data = await res.json()
                if (data.success && data.order) {
                    if (
                        checkoutDeliveryData?.trackingClienteId === clienteId &&
                        restaurante?.id &&
                        restaurante?.username
                    ) {
                        registrarEventoTrackingUnaVez(
                            restaurante?.id,
                            restaurante?.username,
                            'purchase',
                            `pedido-${data.order.pedidoId}`,
                            {
                                pedidoUnificadoId: data.order.pedidoId,
                                valor: Number(data.order.total || 0),
                                items: data.order.items,
                                metadata: {
                                    tipoPedido: data.order.tipoPedido,
                                    cantidadItems: Array.isArray(data.order.items)
                                        ? data.order.items.length
                                        : 0,
                                    grupal: true,
                                },
                            }
                        )
                    }
                    const orderInfo = {
                        token: data.order.token,
                        pedidoId: data.order.pedidoId,
                        tipoPedido: data.order.tipoPedido,
                        total: data.order.total,
                        items: data.order.items,
                        aliasDinamico: data.order.aliasDinamico,
                        cvuDinamico: data.order.cvuDinamico,
                        deliveryFee: data.order.deliveryFee,
                        zonaNombre: data.order.zonaNombre,
                        direccion: data.order.direccion,
                        metodoPago:
                            data.order.metodoPago || checkoutDeliveryData?.metodoPago || 'transferencia',
                        montoDescuento: data.order.montoDescuento
                            ? parseFloat(data.order.montoDescuento)
                            : undefined,
                    }
                    sessionStorage.setItem('salaOrderInfo', JSON.stringify(orderInfo))
                    const debeEnviarWhatsapp =
                        restaurante?.avisosWhatsappClienteEnabled === false &&
                        sessionStorage.getItem(`salaWhatsappInitiator_${token}`) === '1'
                    if (debeEnviarWhatsapp) {
                        const redirectKey = `salaWhatsappRedirect_${data.order.pedidoId}`
                        if (sessionStorage.getItem(redirectKey) !== '1') {
                            sessionStorage.setItem(redirectKey, '1')
                            const redirected = await redirectPedidoAlWhatsapp(orderInfo, restaurante)
                            if (redirected) {
                                sessionStorage.removeItem(`salaWhatsappInitiator_${token}`)
                                return
                            }
                            sessionStorage.removeItem(redirectKey)
                        } else {
                            return
                        }
                    }
                    window.location.href = `/sala/${data.order.token}/success`
                }
            } catch {
                /* ignore */
            }
        }
        poll()
        const interval = setInterval(poll, 500)
        return () => {
            clearInterval(interval)
        }
    }, [
        todosConfirmaron,
        enviandoSolo,
        esSala,
        urlQrToken,
        restaurante,
        checkoutDeliveryData?.metodoPago,
        checkoutDeliveryData?.trackingClienteId,
        clienteId,
    ])
    return {
        iniciarConfirmacionPedido,
        confirmarMiParte,
        cancelarConfirmacion,
        yaConfirme,
        totalConfirmados,
        totalClientes,
        todosConfirmaron,
    }
}
