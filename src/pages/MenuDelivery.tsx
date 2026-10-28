import { ProductDetailDrawer } from '@/components/ProductDetailDrawer'
import { CargandoTienda } from '@/features/tienda/compartido/CargandoTienda'
import { Estado } from '@/features/tienda/compartido/Estado'
import { TiendaTheme } from '@/features/tienda/compartido/TiendaTheme'
import { ACCESO_SECUNDARIO, formatoPesos, logoPara } from '@/lib/tienda'
import { BadgePercent, Loader2, Sparkles, Users } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'

import { AvisoLocal } from '@/features/tienda/compartido/AvisoLocal'
import { CampanaProductoHero } from '@/features/tienda/delivery/CampanaProducto'
import { Canjes } from '@/features/tienda/delivery/Canjes'
import { CarritoDelivery } from '@/features/tienda/delivery/CarritoDelivery'
import { CrearSalaDialog } from '@/features/tienda/delivery/CrearSalaDialog'
import { DialogosDelivery } from '@/features/tienda/delivery/DialogosDelivery'
import type { CampanaPublica } from '@/features/tienda/delivery/modelo'
import { useMenuDelivery } from '@/features/tienda/delivery/useMenuDelivery'
import { TiendaVista } from '@/features/tienda/TiendaVista'
import { slugSitio, sitioActual, usernameSitio } from '@/store-sites/actual'
import { storeSiteMeta } from '@/store-sites/meta'

const DemoTienda = lazy(() => import('@/components/demo/DemoTienda').catch(() => ({ default: () => <></> })))

/** La clave reinicia la sesión al cambiar de local o entrar/salir de la demo. */
export default function MenuDelivery({ campana = null }: { campana?: CampanaPublica | null }) {
    const { username } = useParams()
    const [params] = useSearchParams()
    return <MenuDeliveryPagina key={(username ?? usernameSitio) + ':' + params.has('demo')} campana={campana} />
}

function MenuDeliveryPagina({ campana }: { campana: CampanaPublica | null }) {
    const modelo = useMenuDelivery(campana)
    const {
        paleta,
        fuentes,
        demo,
        username,
        restaurante,
        productos,
        scrollDir,
        pedidoDemo,
        setPedidoDemo,
        estadoAbierto,
        nombreLocal,
        logoLocal,
        tienda,
        estadoLocal,
        ofrece,
        direccionLocal,
        bannerGrowth,
        verCarta,
        destacado,
        abrirDetalleProducto,
        mostrarPedidoGrupal,
        onArmarPedidoClick,
        creandoSala,
        verPuntos,
        puntosConPedido,
        loadingPuntos,
        productoCampana,
        cartItems,
        cartaRef,
        secciones,
        horarios,
        abrirCarrito,
        totalPedido,
        cartAnimation,
        selectedProduct,
        puntosCliente,
        puntosEnCarrito,
        puntosUsadosBeneficios,
        drawerOpen,
        cerrarProductoDrawer,
        agregarAlPedido,
        productosNavegables,
        setSelectedProduct,
        loading,
        restauranteCache,
    } = modelo
    const themeStyles = <TiendaTheme paleta={paleta} fuentes={fuentes} />
    const Diseno = sitioActual?.Diseno

    // En el subdominio, el HTML ya llega con el título del sitio desde el Worker; esto cubre el
    // desarrollo local y la navegación dentro de la SPA.
    useEffect(() => {
        const meta = slugSitio ? storeSiteMeta[slugSitio] : null
        if (!meta) return
        document.title = meta.title
        if (meta.themeColor) {
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', meta.themeColor)
        }
    }, [])

    if (loading) {
        return (
            <>
                {themeStyles}
                <CargandoTienda
                    nombre={restauranteCache?.nombre}
                    logo={logoPara(restauranteCache, paleta.oscuro)}
                />
            </>
        )
    }

    if (!restaurante) {
        return (
            <div className="menu-delivery flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
                {themeStyles}
                <p className="tienda-display text-4xl">Tienda no encontrada</p>
                <p className="text-sm text-muted-foreground">Revisá el link o escribile al local.</p>
            </div>
        )
    }

    return (
        <div className="menu-delivery min-h-screen overflow-x-clip bg-background text-foreground selection:bg-primary/25">
            {themeStyles}

            {demo && (
                <>
                    {/* El lugar de la isla que lleva al panel: al abrir, no tapa el logo. */}
                    <div aria-hidden className="h-16" />
                    <Suspense fallback={null}>
                        <DemoTienda
                            username={username ?? ''}
                            restaurante={restaurante}
                            productos={productos}
                            scrollDir={scrollDir}
                            pedido={pedidoDemo}
                            onCerrarPedido={() => setPedidoDemo(null)}
                        />
                    </Suspense>
                </>
            )}

            {!Diseno && (restaurante.pausadoPorSuscripcion ? (
                // Local pausado por suscripción (Tarea 8): cerrado temporalmente, no toma pedidos.
                // Tiene prioridad sobre el aviso de horario y no se puede sortear con pedidos programados.
                <AvisoLocal tono="cerrado">
                    Cerrado temporalmente. No estamos recibiendo pedidos por ahora.
                </AvisoLocal>
            ) : (
                !estadoAbierto.abierto &&
                restaurante.permitirPedidosProgramados && (
                    // Cerrado sin más: lo dice la línea de datos de la portada. Acá sólo lo que el cliente puede hacer.
                    <AvisoLocal tono="programar">
                        Estamos cerrados. Podés programar tu pedido para después.
                    </AvisoLocal>
                )
            ))}

            {Diseno ? (
                <Suspense
                    fallback={
                        <div
                            role="status"
                            aria-label="Cargando tienda"
                            style={{ minHeight: '100dvh', background: sitioActual?.loadingBackground }}
                        />
                    }
                >
                    <Diseno modelo={modelo} />
                </Suspense>
            ) : (
            <TiendaVista
                tienda={tienda}
                portada={{
                    nombre: nombreLocal,
                    logo: logoLocal,
                    frase: tienda.frase,
                    bajada: tienda.bajada,
                    datos: [
                        estadoLocal && <Estado abierto={estadoLocal.abierto} texto={estadoLocal.texto} />,
                        ofrece.join(' · '),
                        direccionLocal,
                    ],
                    aviso: bannerGrowth ? (
                        <p className="mb-6 flex max-w-md animate-in items-center gap-3 border-y-[1.5px] border-foreground py-3 text-[14px] leading-snug text-foreground fade-in duration-300">
                            <BadgePercent className="tienda-acento size-5 shrink-0" aria-hidden />
                            <span>
                                <strong className="font-bold">{bannerGrowth.titulo}</strong>{' '}
                                {bannerGrowth.detalle}
                            </span>
                        </p>
                    ) : undefined,
                    accionPrincipal: { texto: 'Ver la carta', onClick: verCarta },
                    destacado: destacado
                        ? { producto: destacado, onAbrir: () => abrirDetalleProducto(destacado) }
                        : null,
                    acciones: (
                        <>
                            {mostrarPedidoGrupal && (
                                <button
                                    type="button"
                                    onClick={onArmarPedidoClick}
                                    aria-busy={creandoSala}
                                    className={ACCESO_SECUNDARIO}
                                >
                                    {creandoSala ? (
                                        <Loader2 className="size-4 shrink-0 animate-spin" />
                                    ) : (
                                        <Users className="size-4 shrink-0" />
                                    )}
                                    <span className="truncate">
                                        {creandoSala ? 'Creando link…' : 'Pedir entre varios'}
                                    </span>
                                </button>
                            )}
                            {restaurante.sistemaPuntos && (
                                <button
                                    type="button"
                                    onClick={verPuntos}
                                    aria-label={
                                        puntosConPedido === null
                                            ? undefined
                                            : `Tus puntos: ${puntosConPedido.toLocaleString('es-AR')} pts`
                                    }
                                    className={ACCESO_SECUNDARIO}
                                >
                                    {loadingPuntos ? (
                                        <Loader2 className="size-4 shrink-0 animate-spin" />
                                    ) : (
                                        <Sparkles className="size-4 shrink-0" />
                                    )}
                                    {puntosConPedido === null ? (
                                        'Mis puntos'
                                    ) : (
                                        <span className="tabular-nums">
                                            {puntosConPedido.toLocaleString('es-AR')} pts
                                        </span>
                                    )}
                                </button>
                            )}
                        </>
                    ),
                }}
                carta={{ secciones, onAbrir: abrirDetalleProducto }}
                cartaRef={cartaRef}
                antesDeCarta={
                    <>
                        {productoCampana && campana && (
                            <div className="pt-16">
                                <CampanaProductoHero
                                    campana={campana}
                                    producto={productoCampana}
                                    onClick={() => abrirDetalleProducto(productoCampana)}
                                />
                            </div>
                        )}

                        <Canjes modelo={modelo} />
                    </>
                }
                pie={{
                    nombre: nombreLocal,
                    logo: logoLocal,
                    direccion: direccionLocal,
                    horarios,
                    instagram: tienda.instagram,
                    whatsapp: tienda.whatsapp,
                    onPedir: () => (cartItems.length > 0 ? abrirCarrito() : verCarta()),
                }}
                pedido={{
                    cantidad: cartItems.length,
                    total: formatoPesos(totalPedido),
                    visible: cartItems.length > 0,
                    onClick: abrirCarrito,
                    pulso: cartAnimation,
                }}
            />
            )}

            <CarritoDelivery modelo={modelo} />
            <DialogosDelivery modelo={modelo} />

            <ProductDetailDrawer
                product={
                    selectedProduct
                        ? {
                              ...selectedProduct,
                              categoria: selectedProduct.categoria ?? undefined,
                              puntosDisponiblesUsuario:
                                  puntosCliente !== null
                                      ? Math.max(
                                            0,
                                            (puntosCliente ?? 0) - puntosEnCarrito() - puntosUsadosBeneficios
                                        )
                                      : undefined,
                              sistemaPuntos: Boolean(restaurante?.sistemaPuntos),
                              configuracionPuntos: restaurante?.configuracionPuntos,
                          }
                        : null
                }
                sistemaPuntos={Boolean(restaurante?.sistemaPuntos)}
                configuracionPuntos={restaurante?.configuracionPuntos}
                open={drawerOpen}
                onClose={cerrarProductoDrawer}
                onAddToOrder={agregarAlPedido}
                siblings={productosNavegables.map((p) => ({ ...p, categoria: p.categoria ?? undefined }))}
                onNavigate={(p) => setSelectedProduct(p)}
            />

            <CrearSalaDialog modelo={modelo} />
        </div>
    )
}
