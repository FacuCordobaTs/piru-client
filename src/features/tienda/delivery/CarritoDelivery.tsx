import { CheckoutDeliveryGrupal } from '@/components/CheckoutDeliveryGrupal'
import { Button } from '@/components/ui/button'
import { CLIENTA_DEMO } from '@/lib/demo'
import { formatoPesos } from '@/lib/tienda'
import { codigoPromocionalMarketing, contextoParaPedidoMarketing } from '@/lib/tracking'
import { ArrowRight, Loader2, UtensilsCrossed } from 'lucide-react'
import { LineaPedido } from '../compartido/LineaPedido'
import { PedidoDrawer } from '../compartido/PedidoDrawer'
import type { ItemCarritoTienda } from '../datos'
import { nombreMetodoPago } from './modelo'
import type { MenuDeliveryModel } from './useMenuDelivery'

export function CarritoDelivery({ modelo }: { modelo: MenuDeliveryModel }) {
    const {
        iniciarCheckout,
        carritoAbierto,
        cerrarCarrito,
        mostrarCheckoutEnCarrito,
        expandido,
        alturaCarrito,
        submittingOrder,
        esPedidoHabitual,
        tituloCheckout,
        setExpandido,
        setEsPedidoHabitual,
        setMostrarCheckoutEnCarrito,
        setCheckoutDeliveryData,
        checkoutDataRef,
        setEditSemaphoreLocal,
        restaurante,
        username,
        itemsTotalCheckout,
        cartItems,
        handleCheckoutMessage,
        demo,
        checkoutDeliveryData,
        editSemaphoreLocal,
        setTituloCheckout,
        estadoAbierto,
        campana,
        descuentoGrowthCodigo,
        direccionClienta,
        puntosCliente,
        isSubmittingRef,
        submitOrder,
        handleEliminarItem,
        totalPedido,
        checkoutCerrado,
    } = modelo
    return (
        <PedidoDrawer
            abierto={carritoAbierto}
            onCerrar={cerrarCarrito}
            titulo={mostrarCheckoutEnCarrito ? tituloCheckout : 'Tu pedido'}
            checkout={mostrarCheckoutEnCarrito}
            expandido={expandido}
            onExpandir={esPedidoHabitual ? undefined : () => setExpandido((e) => !e)}
            altura={alturaCarrito}
            ocupado={submittingOrder}
        >
            {submittingOrder && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-t-[32px] bg-background/80 backdrop-blur-sm">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Enviando pedido...</p>
                </div>
            )}
            {mostrarCheckoutEnCarrito ? (
                <CheckoutDeliveryGrupal
                    modo={expandido ? 'completo' : 'pasos'}
                    onVolverCarrito={() => {
                        if (esPedidoHabitual) {
                            setEsPedidoHabitual(false)
                            setMostrarCheckoutEnCarrito(false)
                            cerrarCarrito()
                            return
                        }
                        setMostrarCheckoutEnCarrito(false)
                        setExpandido(true)
                        setCheckoutDeliveryData(null)
                        checkoutDataRef.current = null
                        setEditSemaphoreLocal(null)
                    }}
                    restauranteId={restaurante?.id ?? 0}
                    restauranteUsername={username ?? null}
                    itemsTotal={itemsTotalCheckout}
                    totalItems={cartItems.length}
                    sendMessage={handleCheckoutMessage}
                    clienteId="solo"
                    clienteNombre={demo ? CLIENTA_DEMO.nombre : localStorage.getItem('cliente_nombre') || ''}
                    checkoutData={checkoutDeliveryData}
                    editSemaphore={editSemaphoreLocal}
                    restauranteDireccion={restaurante?.direccionTexto ?? restaurante?.direccion ?? undefined}
                    direccionSoloTexto={restaurante?.direccionSoloTexto === true}
                    onTituloChange={setTituloCheckout}
                    labelGuardar={
                        restaurante?.avisosWhatsappClienteEnabled === false
                            ? 'Enviar pedido al WhatsApp'
                            : 'Confirmar y pedir'
                    }
                    labelConfirmar={
                        esPedidoHabitual && checkoutDeliveryData?.metodoPago
                            ? `Pedir y pagar con ${nombreMetodoPago(checkoutDeliveryData.metodoPago)}`
                            : undefined
                    }
                    itemsResumen={esPedidoHabitual ? cartItems : undefined}
                    pedidoHabitual={esPedidoHabitual}
                    enviarPedidoWhatsapp={restaurante?.avisosWhatsappClienteEnabled === false}
                    submittingOrder={submittingOrder}
                    localCerrado={!estadoAbierto.abierto || !!restaurante?.pausadoPorSuscripcion}
                    contextoMarketing={
                        username && !demo
                            ? {
                                  ...contextoParaPedidoMarketing(username),
                                  ...(campana
                                      ? { campaniaSlug: campana.slug, campanaId: campana.campanaId }
                                      : {}),
                              }
                            : undefined
                    }
                    codigoPromocionalInicial={
                        demo
                            ? null
                            : descuentoGrowthCodigo ||
                              (username ? codigoPromocionalMarketing(username) : null)
                    }
                    canjesPuntosEnRevision
                    demo={
                        direccionClienta
                            ? {
                                  puntos: puntosCliente ?? CLIENTA_DEMO.puntos,
                                  configuracionPuntos: restaurante?.configuracionPuntos,
                                  direccion: direccionClienta,
                              }
                            : undefined
                    }
                    onConfirmarClick={() => {
                        if (isSubmittingRef.current || !checkoutDataRef.current) return
                        isSubmittingRef.current = true
                        submitOrder(checkoutDataRef.current)
                    }}
                />
            ) : cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 px-5 py-12 text-center">
                    <div className="grid size-20 place-items-center rounded-full bg-secondary text-muted-foreground">
                        <UtensilsCrossed className="size-8" />
                    </div>
                    <p className="font-medium text-muted-foreground">Todavía no agregaste nada.</p>
                    <Button variant="link" onClick={cerrarCarrito}>
                        Ver la carta
                    </Button>
                </div>
            ) : (
                <>
                    <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
                        {cartItems.map((item) => (
                            <ItemCarrito
                                key={item.id}
                                item={item}
                                onQuitar={() => handleEliminarItem(item.id)}
                            />
                        ))}
                    </div>
                    <div className="shrink-0 border-t border-dashed border-border bg-background px-4 pb-5 pt-4">
                        <div className="mb-4 flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">Total</span>
                            <span className="tienda-display text-[32px] leading-none tabular-nums">
                                {formatoPesos(totalPedido)}
                            </span>
                        </div>
                        <Button
                            className="h-14 w-full rounded-full text-base font-semibold shadow-md"
                            disabled={checkoutCerrado}
                            onClick={iniciarCheckout}
                        >
                            {restaurante?.pausadoPorSuscripcion ? (
                                'Cerrado temporalmente'
                            ) : checkoutCerrado ? (
                                'Cerrado'
                            ) : (
                                <>
                                    Continuar <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}
        </PedidoDrawer>
    )
}

/** Un producto del carrito: foto, lo elegido y su precio; se quita con el tachito. */
const ItemCarrito = ({ item, onQuitar }: { item: ItemCarritoTienda; onQuitar: () => void }) => {
    return (
        <LineaPedido
            nombre={item.nombre}
            imagen={item.imagenUrl}
            cantidad={item.cantidad}
            total={
                item.esCanjePuntos
                    ? `${Number(item.puntosNecesarios || 0) * item.cantidad} pts`
                    : formatoPesos(Number(item.precio) * item.cantidad)
            }
            original={
                Number(item.descuento || 0) > 0 && !item.esCanjePuntos
                    ? formatoPesos(Number(item.precioOriginal) * item.cantidad)
                    : undefined
            }
            detalles={{
                excluidos: item.ingredientesExcluidosNombres,
                agregados: item.agregados?.map((ag: { nombre: string }) => ag.nombre),
                nota: item.nota,
            }}
            onQuitar={onQuitar}
        />
    )
}
