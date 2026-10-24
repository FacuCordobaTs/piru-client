import { CheckoutDeliveryGrupal } from '@/components/CheckoutDeliveryGrupal'
import { Button } from '@/components/ui/button'
import { formatoPesos } from '@/lib/tienda'
import { contextoParaPedidoMarketing, registrarEventoPixelUnaVez } from '@/lib/tracking'
import { ArrowRight, UtensilsCrossed } from 'lucide-react'
import { LineaPedido } from '../compartido/LineaPedido'
import { PedidoDrawer } from '../compartido/PedidoDrawer'
import type { MenuGrupoModel } from './useMenuGrupo'

export function CarritoGrupo({ modelo }: { modelo: MenuGrupoModel }) {
    const {
        carritoAbierto,
        cerrarCarrito,
        mostrarCheckoutEnCarrito,
        expandido,
        alturaCarrito,
        tituloCheckout,
        setExpandido,
        esSala,
        setMostrarCheckoutEnCarrito,
        restaurante,
        totalPedido,
        todosLosItems,
        iniciarConfirmacionPedido,
        sendMessage,
        clienteId,
        clienteNombre,
        checkoutDeliveryData,
        checkoutEditSemaphore,
        setTituloCheckout,
        localCerrado,
        permitirProgramados,
        productos,
        handleEliminarItem,
    } = modelo
    const renderItem = (item: (typeof todosLosItems)[number]) => {
        const esMio = item.clienteNombre === clienteNombre
        const producto = productos.find((p) => p.id === item.productoId)
        return (
            <LineaPedido
                key={item.id}
                nombre={item.nombreProducto || item.nombre || 'Producto'}
                imagen={item.imagenUrl || producto?.imagenUrl}
                cantidad={item.cantidad}
                total={formatoPesos(Number(item.precioUnitario ?? item.precio ?? 0) * item.cantidad)}
                autor={esMio ? 'Vos' : item.clienteNombre}
                propio={esMio}
                detalles={{
                    excluidos: item.ingredientesExcluidosNombres,
                    agregados: item.agregados?.map((ag: { nombre?: string }) => ag.nombre || 'Extra'),
                    nota: item.nota,
                }}
                onQuitar={esMio ? () => handleEliminarItem(item.id) : undefined}
            />
        )
    }

    return (
        <PedidoDrawer
            abierto={carritoAbierto}
            onCerrar={cerrarCarrito}
            titulo={mostrarCheckoutEnCarrito ? tituloCheckout : 'El pedido'}
            checkout={mostrarCheckoutEnCarrito}
            expandido={expandido}
            onExpandir={() => setExpandido((e) => !e)}
            altura={alturaCarrito}
        >
            {mostrarCheckoutEnCarrito && esSala ? (
                <CheckoutDeliveryGrupal
                    modo={expandido ? 'completo' : 'pasos'}
                    onVolverCarrito={() => {
                        setMostrarCheckoutEnCarrito(false)
                        setExpandido(true)
                    }}
                    restauranteId={restaurante?.id ?? 0}
                    restauranteUsername={restaurante?.username ?? null}
                    itemsTotal={totalPedido}
                    totalItems={todosLosItems.length}
                    onConfirmarClick={iniciarConfirmacionPedido}
                    sendMessage={sendMessage}
                    clienteId={clienteId ?? ''}
                    clienteNombre={clienteNombre ?? ''}
                    checkoutData={checkoutDeliveryData}
                    editSemaphore={checkoutEditSemaphore}
                    restauranteDireccion={restaurante?.direccion ?? undefined}
                    direccionSoloTexto={restaurante?.direccionSoloTexto === true}
                    onTituloChange={setTituloCheckout}
                    enviarPedidoWhatsapp={restaurante?.avisosWhatsappClienteEnabled === false}
                    localCerrado={localCerrado}
                    contextoMarketing={
                        restaurante?.username ? contextoParaPedidoMarketing(restaurante.username) : undefined
                    }
                />
            ) : todosLosItems.length === 0 ? (
                <div
                    className={`flex flex-col items-center justify-center gap-4 px-5 text-center ${expandido ? 'flex-1' : 'py-12'}`}
                >
                    <div className="grid size-20 place-items-center rounded-full bg-secondary text-muted-foreground">
                        <UtensilsCrossed className="size-8" />
                    </div>
                    <p className="font-medium text-muted-foreground">Todavía no hay nada en el pedido.</p>
                    <Button variant="link" onClick={cerrarCarrito}>
                        Ver la carta
                    </Button>
                </div>
            ) : (
                <>
                    <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
                        {todosLosItems.map((item) => renderItem(item))}
                    </div>

                    <div className="shrink-0 border-t border-dashed border-border bg-background px-4 pb-5 pt-4">
                        <div className="mb-4 flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">Total del grupo</span>
                            <span className="tienda-display text-[32px] leading-none tabular-nums">
                                {formatoPesos(totalPedido)}
                            </span>
                        </div>
                        <Button
                            className="h-14 w-full rounded-full text-base font-semibold shadow-md"
                            disabled={localCerrado && !permitirProgramados}
                            onClick={() => {
                                if (localCerrado && !permitirProgramados) return
                                // Meta cuenta el inicio de checkout una vez por sesión: ir y
                                // volver del carrito no puede inflar el paso del embudo.
                                registrarEventoPixelUnaVez('InitiateCheckout', 'checkout', {
                                    items: todosLosItems,
                                    valor: Number(totalPedido),
                                })
                                if (esSala) {
                                    setMostrarCheckoutEnCarrito(true)
                                    setExpandido(false)
                                } else {
                                    iniciarConfirmacionPedido()
                                }
                            }}
                        >
                            {localCerrado && !permitirProgramados ? (
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
