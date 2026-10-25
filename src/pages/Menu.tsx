import { elegirProductoDestacado } from '@/features/tienda/catalogo'
import { ProductDetailDrawer } from '@/components/ProductDetailDrawer'
import { CargandoTienda } from '@/features/tienda/compartido/CargandoTienda'
import { TiendaTheme } from '@/features/tienda/compartido/TiendaTheme'
import { BienvenidaGrupo } from '@/features/tienda/grupo/BienvenidaGrupo'
import { CarritoGrupo } from '@/features/tienda/grupo/CarritoGrupo'
import { ConfirmacionGrupo } from '@/features/tienda/grupo/ConfirmacionGrupo'
import { ParticipantesGrupo } from '@/features/tienda/grupo/ParticipantesGrupo'
import { useMenuGrupo } from '@/features/tienda/grupo/useMenuGrupo'
import { TiendaVista } from '@/features/tienda/TiendaVista'
import { ACCESO_SECUNDARIO, formatoPesos, logoPara } from '@/lib/tienda'
import { Clock, Share2, Wifi, WifiOff } from 'lucide-react'
import { useRef } from 'react'
import { useParams } from 'react-router'

export default function Menu() {
    const { qrToken } = useParams()
    return <MenuGrupoPagina key={qrToken} />
}

function MenuGrupoPagina() {
    const modelo = useMenuGrupo()
    const {
        paleta,
        fuentes,
        localCerrado,
        permitirProgramados,
        estadoAbierto,
        nombreLocal,
        identidad,
        isConnected,
        esSala,
        mesa,
        clienteNombre,
        compartirLink,
        todosLosItems,
        totalPedido,
        abrirCarrito,
        horarios,
        tienda,
        selectedProduct,
        restaurante,
        drawerOpen,
        cerrarProductoDrawer,
        agregarAlPedido,
        productosNavegables,
        setSelectedProduct,
    } = modelo
    const cartaRef = useRef<HTMLDivElement>(null)
    const verCarta = () =>
        cartaRef.current?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        })
    const logo = logoPara(identidad, paleta.oscuro)
    const destacado = elegirProductoDestacado(productosNavegables, tienda.productoDestacadoId)
    if (!modelo.isHydrated || (esSala && modelo.urlQrToken !== modelo.qrToken)) {
        return <CargandoTienda />
    }
    return (
        <div className="menu-delivery min-h-screen overflow-x-clip bg-background text-foreground">
            <TiendaTheme paleta={paleta} fuentes={fuentes} />
            {localCerrado && (
                <div
                    className={
                        permitirProgramados
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-foreground text-background'
                    }
                >
                    <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2.5">
                        <Clock className="size-4 shrink-0" />
                        <p className="text-center text-[13px] font-semibold">
                            {permitirProgramados
                                ? 'Estamos cerrados. Podés programar tu pedido para después.'
                                : `Estamos cerrados${estadoAbierto.proximaApertura ? `. Abrimos ${estadoAbierto.proximaApertura}` : ''}`}
                        </p>
                    </div>
                </div>
            )}

            <TiendaVista
                tienda={tienda}
                portada={{
                    nombre: nombreLocal,
                    logo,
                    destacado: destacado ? { producto: destacado, onAbrir: () => modelo.abrirDetalleProducto(destacado) } : null,
                    frase: 'Hola, ' + clienteNombre,
                    bajada: esSala
                        ? 'Cada uno elige lo suyo desde su celu y al final confirman juntos.'
                        : 'Elegí lo que quieras: el pedido llega a tu mesa.',
                    datos: [
                        <span className="inline-flex items-center gap-2">
                            {isConnected ? (
                                <Wifi className="size-3.5 text-emerald-600" />
                            ) : (
                                <WifiOff className="size-3.5 text-destructive" />
                            )}
                            {isConnected ? 'En vivo' : 'Reconectando…'}
                        </span>,
                        esSala ? 'Pedido en grupo' : mesa?.nombre,
                        esSala ? mesa?.nombre : null,
                    ],
                    contenido: <ParticipantesGrupo modelo={modelo} />,
                    accionPrincipal: { texto: 'Ver la carta', onClick: verCarta },
                    acciones: esSala && (
                        <button type="button" onClick={compartirLink} className={ACCESO_SECUNDARIO}>
                            <Share2 className="size-4" />
                            Invitá a tus amigos
                        </button>
                    ),
                }}
                carta={{ secciones: modelo.secciones, onAbrir: modelo.abrirDetalleProducto }}
                cartaRef={cartaRef}
                pie={{
                    nombre: nombreLocal,
                    logo,
                    horarios,
                    direccion: identidad?.direccionTexto ?? identidad?.direccion,
                    instagram: tienda.instagram,
                    whatsapp: tienda.whatsapp,
                    onPedir: () => (todosLosItems.length ? abrirCarrito() : verCarta()),
                }}
                pedido={{
                    cantidad: todosLosItems.length,
                    total: formatoPesos(totalPedido),
                    visible: todosLosItems.length > 0,
                    onClick: abrirCarrito,
                    texto: 'Ver el pedido',
                }}
            />
            <CarritoGrupo modelo={modelo} />
            <ConfirmacionGrupo modelo={modelo} />
            <BienvenidaGrupo modelo={modelo} />
            <ProductDetailDrawer
                product={
                    selectedProduct
                        ? {
                              ...selectedProduct,
                              categoria: selectedProduct.categoria ?? undefined,
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
                onNavigate={(p) => setSelectedProduct({ ...p, precio: String(p.precio), categoriaId: null })}
            />
        </div>
    )
}
