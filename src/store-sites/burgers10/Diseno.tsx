import { useEffect, useRef } from 'react'
import {
    ArrowDown,
    ArrowRight,
    BadgePercent,
    Clock3,
    Instagram,
    Loader2,
    MapPin,
    MessageCircle,
    Plus,
    ShoppingBag,
    Sparkles,
    Users,
} from 'lucide-react'
import { Canjes } from '@/features/tienda/delivery/Canjes'
import type { MenuDeliveryModel } from '@/features/tienda/delivery/useMenuDelivery'
import type { ProductoTienda } from '@/features/tienda/datos'
import { useNavegacionCarta } from '@/features/tienda/compartido/useNavegacionCarta'
import { fotosDeProducto } from '@/lib/fotosProducto'
import { DIAS, SEMANA, formatoPesos, logoPara, ordenVisual, precioProducto, turnosDelDia } from '@/lib/tienda'
import './burgers10.css'

const CINTA_BASE = ['Carne al fuego', 'Pan del día', 'Papas caseras', 'Pedí sin intermediarios']

/**
 * Diseño propio de Burgers 10 (`burgers10.piru.app`).
 *
 * Recibe el mismo modelo que la tienda estándar: no hace peticiones ni crea pedidos. El carrito,
 * los diálogos, el detalle de producto y el checkout siguen en `MenuDelivery`; acá sólo cambia la
 * composición visual. Para otra tienda, copiar este directorio y cambiar el diseño y los textos.
 */
export function DisenoBurgers10({ modelo }: { modelo: MenuDeliveryModel }) {
    const {
        tienda,
        secciones,
        nombreLocal,
        logoLocal,
        estadoLocal,
        ofrece,
        direccionLocal,
        bannerGrowth,
        destacado,
        productoCampana,
        campana,
        puntosConPedido,
        verPuntos,
        mostrarPedidoGrupal,
        onArmarPedidoClick,
        creandoSala,
        cartItems,
        totalPedido,
        cartAnimation,
        abrirCarrito,
        abrirDetalleProducto,
        verCarta,
        cartaRef,
        restaurante,
    } = modelo

    const { activa, seccionesRef, id, ir } = useNavegacionCarta(secciones.length)
    const navRef = useRef<HTMLDivElement | null>(null)
    const fotos = tienda.galeria ?? []
    const historia = tienda.historia?.texto
    const whatsapp = tienda.whatsapp?.replace(/\D/g, '')
    const cinta = tienda.cinta?.length ? tienda.cinta : CINTA_BASE
    // La cabecera es clara: se usa el logo pensado para fondos claros y, si no hay, el otro.
    const logo = logoPara(restaurante, false) ?? logoLocal
    const dias = SEMANA.map((dia) => ({ dia: DIAS[dia], turnos: turnosDelDia(modelo.horarios, dia) })).filter(
        (fila) => fila.turnos,
    )

    // La categoría activa siempre a la vista en la barra, sin mover la página.
    useEffect(() => {
        const barra = navRef.current
        const boton = barra?.querySelector<HTMLElement>(`[data-indice="${activa}"]`)
        if (!barra || !boton) return
        barra.scrollTo({
            left: boton.offsetLeft - barra.clientWidth / 2 + boton.clientWidth / 2,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        })
    }, [activa])

    return (
        <div className="b10-site">
            <div className="b10-cinta" aria-hidden>
                {[0, 1].map((copia) => (
                    <div className="b10-cinta-track" key={copia}>
                        {[...cinta, ...cinta, ...cinta, ...cinta].map((palabra, i) => (
                            <span className="b10-mono" key={`${copia}-${i}`}>
                                {palabra}
                            </span>
                        ))}
                    </div>
                ))}
            </div>

            <header className="b10-header">
                <div className="b10-wrap b10-header-in">
                    <a className="b10-marca" href="#carta" onClick={(e) => { e.preventDefault(); verCarta() }}>
                        {logo && <img src={logo} alt="" />}
                        <strong>{nombreLocal}</strong>
                    </a>
                    <nav className="b10-nav b10-mono" aria-label="Secciones de la tienda">
                        <a href="#carta" onClick={(e) => { e.preventDefault(); verCarta() }}>La carta</a>
                        <a href="#casa">La casa</a>
                        <a href="#contacto">Contacto</a>
                    </nav>
                    <div className="b10-header-acciones">
                        {restaurante?.sistemaPuntos && (
                            <button
                                type="button"
                                className="b10-boton b10-boton--fantasma b10-boton--chico"
                                onClick={verPuntos}
                            >
                                <Sparkles className="size-3.5" aria-hidden />
                                {puntosConPedido === null
                                    ? 'Mis puntos'
                                    : `${puntosConPedido.toLocaleString('es-AR')} pts`}
                            </button>
                        )}
                        <button
                            type="button"
                            className="b10-icono"
                            onClick={abrirCarrito}
                            aria-label={cartItems.length ? `Ver pedido: ${cartItems.length} productos` : 'Ver pedido'}
                        >
                            <ShoppingBag className="size-4" aria-hidden />
                        </button>
                    </div>
                </div>
            </header>

            <main>
                <section className="b10-hero">
                    <div className="b10-wrap b10-hero-grid">
                        <div>
                            <p className="b10-eyebrow b10-mono">
                                <span className="b10-punto" data-abierto={estadoLocal?.abierto ?? false} />
                                {estadoLocal?.texto ?? 'Pedidos online'}
                            </p>
                            <h1 className="b10-display">
                                <NombreMarca nombre={nombreLocal} />
                            </h1>
                            {tienda.frase && <p className="b10-hero-frase">{tienda.frase}</p>}
                            {tienda.bajada && <p className="b10-hero-bajada">{tienda.bajada}</p>}

                            <ul className="b10-datos">
                                {ofrece.length > 0 && (
                                    <li>
                                        <Clock3 className="size-3.5" aria-hidden />
                                        {ofrece.join(' · ')}
                                    </li>
                                )}
                                {direccionLocal && (
                                    <li>
                                        <MapPin className="size-3.5" aria-hidden />
                                        {direccionLocal}
                                    </li>
                                )}
                            </ul>

                            {bannerGrowth && (
                                <p className="b10-aviso">
                                    <BadgePercent className="mt-0.5 size-4 shrink-0" aria-hidden />
                                    <span>
                                        <strong>{bannerGrowth.titulo}</strong> {bannerGrowth.detalle}
                                    </span>
                                </p>
                            )}

                            {restaurante?.pausadoPorSuscripcion ? (
                                <p className="b10-aviso">
                                    Cerrado temporalmente. No estamos recibiendo pedidos por ahora.
                                </p>
                            ) : !estadoLocal?.abierto && restaurante?.permitirPedidosProgramados ? (
                                <p className="b10-aviso">
                                    Estamos cerrados. Podés programar tu pedido para después.
                                </p>
                            ) : null}

                            <div className="b10-hero-acciones">
                                <button type="button" className="b10-boton b10-boton--rojo" onClick={verCarta}>
                                    Ver la carta
                                    <ArrowDown className="size-4" aria-hidden />
                                </button>
                                {mostrarPedidoGrupal && (
                                    <button
                                        type="button"
                                        className="b10-boton b10-boton--fantasma"
                                        onClick={onArmarPedidoClick}
                                        aria-busy={creandoSala}
                                    >
                                        {creandoSala ? (
                                            <Loader2 className="size-4 animate-spin" aria-hidden />
                                        ) : (
                                            <Users className="size-4" aria-hidden />
                                        )}
                                        {creandoSala ? 'Creando link…' : 'Pedir entre varios'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            {destacado ? (
                                <BotonDestacado producto={destacado} onAbrir={() => abrirDetalleProducto(destacado)} />
                            ) : tienda.portadaUrl ? (
                                <div className="b10-hero-foto">
                                    <img src={tienda.portadaUrl} alt={`La casa de ${nombreLocal}`} />
                                    <span className="b10-sello">
                                        10
                                        <small>BURGERS</small>
                                    </span>
                                </div>
                            ) : (
                                <div className="b10-hero-foto" style={{ minHeight: '18rem' }}>
                                    <div
                                        className="b10-producto-foto--sin"
                                        style={{ minHeight: '17rem', color: 'var(--b10-rojo)', fontSize: '7rem' }}
                                    >
                                        10
                                    </div>
                                    <span className="b10-sello">
                                        10
                                        <small>BURGERS</small>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {productoCampana && campana && (
                        <div className="b10-wrap">
                            <button
                                type="button"
                                className="b10-campana"
                                onClick={() => abrirDetalleProducto(productoCampana)}
                            >
                                <span className="b10-mono">Oferta · {campana.nombre}</span>
                                <strong>{productoCampana.nombre}</strong>
                                <span className="b10-mono">
                                    {campana.descuentoPorcentaje > 0 ? `-${campana.descuentoPorcentaje}%` : 'Ver'}
                                </span>
                            </button>
                        </div>
                    )}
                </section>

                <section id="carta" ref={cartaRef} className="b10-seccion">
                    <div className="b10-wrap">
                        <div className="b10-titulo-seccion">
                            <h2 className="b10-display">La carta</h2>
                            <p>
                                Todo se hace en el momento. Tocá un producto para elegir variantes, extras y
                                agregarlo al pedido.
                            </p>
                        </div>

                        <Canjes modelo={modelo} />

                        {secciones.length > 1 && (
                            <nav ref={navRef} className="b10-categorias" aria-label="Categorías de la carta">
                                {secciones.map((seccion, i) => (
                                    <button
                                        type="button"
                                        key={seccion.nombre}
                                        data-indice={i}
                                        onClick={() => ir(i)}
                                        aria-controls={id(i)}
                                        aria-current={activa === i ? 'location' : undefined}
                                    >
                                        {seccion.nombre}
                                    </button>
                                ))}
                            </nav>
                        )}

                        {secciones.length === 0 && <p className="b10-vacio">Pronto vas a ver la carta acá.</p>}

                        {secciones.map((seccion, i) => (
                            <section
                                key={seccion.nombre}
                                id={id(i)}
                                ref={(el) => {
                                    seccionesRef.current[i] = el
                                }}
                                aria-label={seccion.nombre}
                                className="b10-categoria"
                            >
                                <Categoria
                                    seccion={seccion}
                                    indice={i}
                                    onAbrir={abrirDetalleProducto}
                                />
                            </section>
                        ))}
                    </div>
                </section>

                {(historia || fotos.length > 0) && (
                    <section id="casa" className="b10-seccion b10-seccion--tinta">
                        <div className="b10-wrap b10-historia-grid">
                            <div className="b10-historia-texto">
                                <div className="b10-titulo-seccion">
                                    <h2 className="b10-display">
                                        {tienda.historia?.titulo || 'La casa'}
                                    </h2>
                                </div>
                                {historia && <p>{historia}</p>}
                            </div>
                            {fotos.length > 0 && (
                                <div className="b10-galeria">
                                    {fotos.slice(0, 5).map((foto) => (
                                        <img key={foto} src={foto} alt={`${nombreLocal} en imágenes`} loading="lazy" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>

            <footer id="contacto" className="b10-pie">
                <div className="b10-wrap">
                    <p className="b10-pie-marca b10-display">{nombreLocal}</p>
                    <div className="b10-pie-grid">
                        <div>
                            <h3>Encontranos</h3>
                            {direccionLocal ? <p>{direccionLocal}</p> : <p>Pedidos online y retiro en el local.</p>}
                            <p style={{ marginTop: '0.8rem' }}>
                                <button type="button" className="b10-boton b10-boton--chico" onClick={verCarta}>
                                    Pedir ahora
                                    <ArrowRight className="size-3.5" aria-hidden />
                                </button>
                            </p>
                        </div>
                        <div>
                            <h3>Contacto</h3>
                            {whatsapp ? (
                                <p>
                                    <a
                                        href={`https://wa.me/${whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MessageCircle className="size-4" aria-hidden />
                                        WhatsApp
                                    </a>
                                </p>
                            ) : null}
                            {tienda.instagram ? (
                                <p style={{ marginTop: '0.4rem' }}>
                                    <a
                                        href={`https://instagram.com/${tienda.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Instagram className="size-4" aria-hidden />
                                        @{tienda.instagram}
                                    </a>
                                </p>
                            ) : null}
                            {!whatsapp && !tienda.instagram && (
                                <p>Escribinos por WhatsApp o acercate al local.</p>
                            )}
                        </div>
                        <div>
                            <h3>Horarios</h3>
                            {dias.length > 0 ? (
                                <ul className="b10-horarios">
                                    {dias.map((fila) => (
                                        <li key={fila.dia}>
                                            {fila.dia}
                                            <span>{fila.turnos}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Consultá horarios por WhatsApp.</p>
                            )}
                        </div>
                    </div>
                    <div className="b10-legal">
                        <span>{nombreLocal} · Tienda online</span>
                        <span>Hecho con Piru</span>
                    </div>
                </div>
            </footer>

            {cartItems.length > 0 && (
                <div className="b10-pedido">
                    <button
                        type="button"
                        onClick={abrirCarrito}
                        style={cartAnimation ? { transform: 'scale(1.025)' } : undefined}
                    >
                        <span className="b10-pedido-bolsa">
                            <ShoppingBag className="size-4" aria-hidden />
                            <span>{cartItems.length}</span>
                        </span>
                        <strong>Ver pedido</strong>
                        <span className="b10-pedido-total">{formatoPesos(totalPedido)}</span>
                        <span className="b10-pedido-flecha">
                            <ArrowRight className="size-4" aria-hidden />
                        </span>
                    </button>
                </div>
            )}
        </div>
    )
}

/** El último tramo del nombre en rojo: "Burgers 10" se lee "BURGERS" + "10". */
function NombreMarca({ nombre }: { nombre: string }) {
    const partes = nombre.trim().split(/\s+/)
    if (partes.length < 2) return <>{nombre}</>
    const ultima = partes.pop()
    return (
        <>
            {partes.join(' ')} <em>{ultima}</em>
        </>
    )
}

function BotonDestacado({ producto, onAbrir }: { producto: ProductoTienda; onAbrir: () => void }) {
    const foto = fotosDeProducto(producto)[0]
    const { original, final, descuento } = precioProducto(producto)
    return (
        <button type="button" className="b10-destacado-card" onClick={onAbrir}>
            {descuento > 0 && <span className="b10-sello">-{descuento}%<small>HOY</small></span>}
            {foto ? (
                <img src={foto} alt={producto.nombre} />
            ) : (
                <span
                    className="b10-producto-foto--sin"
                    style={{ minHeight: '17rem', color: 'var(--b10-rojo)', fontSize: '7rem' }}
                >
                    10
                </span>
            )}
            <span className="b10-mono" style={{ fontSize: '0.6rem', opacity: 0.55 }}>
                La recomendada de la casa
            </span>
            <strong>{producto.nombre}</strong>
            <span>
                <strong>{formatoPesos(final)}</strong>
                {descuento > 0 && <del style={{ opacity: 0.5, fontSize: '0.75rem' }}>{formatoPesos(original)}</del>}
            </span>
        </button>
    )
}

function Categoria({
    seccion,
    indice,
    onAbrir,
}: {
    seccion: { nombre: string; productos: ProductoTienda[] }
    indice: number
    onAbrir: (producto: ProductoTienda) => void
}) {
    const { conFoto, sinFoto } = ordenVisual(seccion.productos)
    return (
        <>
            <header className="b10-categoria-cabecera">
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <h3>{seccion.nombre}</h3>
                <em>{seccion.productos.length} opciones</em>
            </header>

            {conFoto.length > 0 && (
                <div className="b10-grilla">
                    {conFoto.map((producto, i) => (
                        <BotonProducto
                            key={producto.id}
                            producto={producto}
                            indice={i}
                            onAbrir={onAbrir}
                        />
                    ))}
                </div>
            )}

            {sinFoto.length > 0 && (
                <div className="b10-lista">
                    {sinFoto.map((producto) => (
                        <button
                            type="button"
                            key={producto.id}
                            className="b10-fila"
                            onClick={() => onAbrir(producto)}
                        >
                            <span className="b10-fila-texto">
                                <strong>{producto.nombre}</strong>
                                {producto.descripcion && (
                                    <span className="b10-fila-desc">{producto.descripcion}</span>
                                )}
                            </span>
                            <PrecioProducto producto={producto} />
                            <span className="b10-mas">
                                <Plus className="size-3.5" aria-hidden />
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </>
    )
}

function BotonProducto({
    producto,
    indice,
    onAbrir,
}: {
    producto: ProductoTienda
    indice: number
    onAbrir: (producto: ProductoTienda) => void
}) {
    const fotos = fotosDeProducto(producto)
    const { descuento } = precioProducto(producto)
    return (
        <button type="button" className="b10-producto" onClick={() => onAbrir(producto)}>
            <span className="b10-producto-foto">
                {fotos[0] ? (
                    <img src={fotos[0]} alt={producto.nombre} loading="lazy" decoding="async" />
                ) : (
                    <span className="b10-producto-foto--sin">{String(indice + 1).padStart(2, '0')}</span>
                )}
                {descuento > 0 && <span className="b10-descuento">-{descuento}%</span>}
            </span>
            <span className="b10-producto-info">
                <span className="b10-producto-nombre">{producto.nombre}</span>
                {producto.descripcion && <span className="b10-producto-desc">{producto.descripcion}</span>}
                <PrecioProducto producto={producto} />
            </span>
        </button>
    )
}

function PrecioProducto({ producto }: { producto: ProductoTienda }) {
    const { original, final, descuento } = precioProducto(producto)
    return (
        <span className="b10-producto-precio" aria-label={`Precio de ${producto.nombre}`}>
            <strong>{formatoPesos(final)}</strong>
            {descuento > 0 && <del>{formatoPesos(original)}</del>}
            {descuento > 0 && <em>-{descuento}%</em>}
        </span>
    )
}
