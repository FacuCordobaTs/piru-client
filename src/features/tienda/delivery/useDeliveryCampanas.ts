import { guardarContextoTracking } from '@/lib/tracking'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type { ItemCarritoTienda } from '../datos'
import { avisoDescuento, parseCarritoPrearmado } from './modelo'
import type { useDeliveryNavegacion } from './useDeliveryNavegacion'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'demo'
    | 'repAplicadoRef'
    | 'productos'
    | 'searchParams'
    | 'campana'
    | 'setSearchParams'
    | 'setCartItems'
    | 'restaurante'
    | 'username'
    | 'productoAplicadoRef'
    | 'setSelectedProduct'
    | 'setDrawerOpen'
    | 'tkAplicadoRef'
    | 'loading'
    | 'setTelefonoCliente'
    | 'metodoPagoHabitualRef'
    | 'setBannerGrowth'
    | 'setDescuentoGrowthCodigo'
    | 'setProductos'
    | 'checkoutDataRef'
    | 'setCheckoutDeliveryData'
    | 'setEditSemaphoreLocal'
    | 'setMostrarCheckoutEnCarrito'
    | 'setExpandido'
    | 'setEsPedidoHabitual'
    | 'setCarritoAbierto'
    | 'cartItems'
> &
    Pick<ReturnType<typeof useDeliveryNavegacion>, 'abrirCarrito'>

export function useDeliveryCampanas({
    demo,
    repAplicadoRef,
    productos,
    searchParams,
    campana,
    setSearchParams,
    setCartItems,
    abrirCarrito,
    restaurante,
    username,
    productoAplicadoRef,
    setSelectedProduct,
    setDrawerOpen,
    tkAplicadoRef,
    loading,
    setTelefonoCliente,
    metodoPagoHabitualRef,
    setBannerGrowth,
    setDescuentoGrowthCodigo,
    setProductos,
    checkoutDataRef,
    setCheckoutDeliveryData,
    setEditSemaphoreLocal,
    setMostrarCheckoutEnCarrito,
    setExpandido,
    setEsPedidoHabitual,
    setCarritoAbierto,
    cartItems,
}: Contexto) {
    useEffect(() => {
        if (repAplicadoRef.current) return
        if (productos.length === 0) return
        const rep = searchParams.get('rep') || campana?.carritoRep
        if (!rep) return
        repAplicadoRef.current = true

        const pares = parseCarritoPrearmado(rep)

        const nuevos: ItemCarritoTienda[] = []
        for (const par of pares) {
            const producto = productos.find((p) => p.id === par.productoId)
            if (!producto) continue
            if (producto.disponible === false) continue
            if (Number(producto.puntosNecesarios || 0) > 0) continue // el canje por puntos no se precarga
            const variante =
                par.varianteId == null
                    ? undefined
                    : producto.variantes?.find((item) => item.id === par.varianteId)
            const varianteSecundaria =
                par.varianteSecundariaId == null
                    ? undefined
                    : producto.variantesSecundarias?.find((item) => item.id === par.varianteSecundariaId)
            // Una campaña v2 siempre guarda las variantes requeridas. Si el menú
            // cambió, omitimos sólo ese item antes que crear una orden inválida.
            if (
                rep.startsWith('v2:') &&
                ((producto.variantes?.length && !variante) ||
                    (producto.variantesSecundarias?.length && !varianteSecundaria))
            )
                continue
            const agregados = (producto.agregados ?? []).filter((item) => par.agregadoIds.includes(item.id))
            const basePrecio = variante ? parseFloat(variante.precio) : Number(producto.precio)
            const baseConSecundaria =
                basePrecio + (varianteSecundaria ? parseFloat(varianteSecundaria.precio) : 0)
            const precioConDescuento =
                producto.descuento && producto.descuento > 0
                    ? baseConSecundaria * (1 - producto.descuento / 100)
                    : baseConSecundaria
            const precioFinal =
                precioConDescuento +
                agregados.reduce((total: number, agregado) => total + Number(agregado.precio || 0), 0)
            const variantesNombre = [variante?.nombre, varianteSecundaria?.nombre].filter(Boolean).join(' · ')
            nuevos.push({
                id: Math.random().toString(36).substr(2, 9),
                productoId: producto.id,
                categoria: producto.categoria,
                nombre: variantesNombre ? `${producto.nombre} - ${variantesNombre}` : producto.nombre,
                precio: precioFinal.toFixed(2),
                precioOriginal: variante ? variante.precio : producto.precio,
                descuento: producto.descuento || 0,
                imagenUrl: producto.imagenUrl,
                cantidad: par.cantidad,
                varianteId: variante?.id,
                varianteNombre: variante?.nombre,
                varianteSecundariaId: varianteSecundaria?.id,
                varianteSecundariaNombre: varianteSecundaria?.nombre,
                ingredientesExcluidos: [],
                ingredientesExcluidosNombres: [],
                agregados,
                esCanjePuntos: false,
                puntosNecesarios: 0,
                puntosGanados: producto.puntosGanados,
            })
        }

        // Limpiamos el query param para que no se reaplique al navegar / recargar.
        if (searchParams.has('rep')) {
            const nuevosParams = new URLSearchParams(searchParams)
            nuevosParams.delete('rep')
            setSearchParams(nuevosParams, { replace: true })
        }

        if (nuevos.length > 0) {
            setCartItems(nuevos)
            toast.success('Te dejamos el carrito listo 🛒')
            setTimeout(() => abrirCarrito(), 500)
        }
    }, [
        productos,
        restaurante?.id,
        username,
        searchParams,
        setSearchParams,
        abrirCarrito,
        campana,
        repAplicadoRef,
        setCartItems,
    ])

    useEffect(() => {
        if (productoAplicadoRef.current || productos.length === 0) return
        const productoId = Number(searchParams.get('producto'))
        if (!Number.isInteger(productoId) || productoId <= 0) return
        productoAplicadoRef.current = true
        const producto = productos.find(
            (item) => item.id === productoId && item.disponible !== false && !item.soloCanjePuntos
        )
        const nuevosParams = new URLSearchParams(searchParams)
        nuevosParams.delete('producto')
        setSearchParams(nuevosParams, { replace: true })
        if (producto) {
            setSelectedProduct(producto)
            setDrawerOpen(true)
        }
    }, [productoAplicadoRef, productos, searchParams, setDrawerOpen, setSearchParams, setSelectedProduct])

    useEffect(() => {
        if (demo) return
        const tk = searchParams.get('tk') || searchParams.get('c')
        if (!tk || tkAplicadoRef.current === tk || !username) return
        if (loading || !restaurante || productos.length === 0) return

        tkAplicadoRef.current = tk

        const resolverToken = async () => {
            try {
                const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
                const res = await fetch(`${url}/public/growth/resolver-enlace`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tk, restauranteSlug: username }),
                })

                if (res.status === 410) {
                    toast.info(
                        'Este beneficio exclusivo ha expirado, pero podés disfrutar de toda nuestra carta.'
                    )
                    return
                }

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null)
                    console.error('Error resolviendo growth token:', res.status, errorData)
                    toast.error(errorData?.message || 'El enlace no es válido o ha expirado.')
                    return
                }

                const response = await res.json()
                if (!response.success || !response.data) return
                const data = response.data

                // Sincronizar datos de cliente en localStorage
                if (data.cliente?.nombre) localStorage.setItem('cliente_nombre', data.cliente.nombre)
                if (data.cliente?.telefono) {
                    localStorage.setItem('cliente_telefono', data.cliente.telefono)
                    setTelefonoCliente(data.cliente.telefono)
                }
                if (data.cliente?.direccionHabitual?.direccion) {
                    localStorage.setItem('cliente_direccion', data.cliente.direccionHabitual.direccion)
                    if (data.cliente.direccionHabitual.lat != null)
                        localStorage.setItem('cliente_lat', String(data.cliente.direccionHabitual.lat))
                    if (data.cliente.direccionHabitual.lng != null)
                        localStorage.setItem('cliente_lng', String(data.cliente.direccionHabitual.lng))
                }
                if (data.cliente?.direccionHabitual?.metodoPago) {
                    metodoPagoHabitualRef.current = data.cliente.direccionHabitual.metodoPago
                }

                // Registrar contexto atribuible en la sesión para el checkout
                guardarContextoTracking({
                    username,
                    campaniaSlug: data.campanaSlug,
                    campanaId: data.campanaId ?? undefined,
                    recetaToken: tk,
                    codigoPromocional: data.descuento?.codigoCupon ?? undefined,
                })

                // Configurar beneficio de descuento si está presente
                if (data.puntos?.activo && data.puntos.cantidad > 0) {
                    setDescuentoGrowthCodigo(null)
                    const desde = Number(data.puntos.montoMinimo) > 0
                        ? ` en un pedido desde $${Number(data.puntos.montoMinimo).toLocaleString('es-AR')}`
                        : ''
                    setBannerGrowth({
                        titulo: 'Sumás puntos extra',
                        detalle: `${Number(data.puntos.cantidad).toLocaleString('es-AR')} puntos${desde}. Se acreditan cuando se cobra el pedido.`,
                    })
                    toast.success(`Sumás ${Number(data.puntos.cantidad).toLocaleString('es-AR')} puntos extra al cobrar 🎁`)
                }
                if (data.descuento?.activo && data.descuento?.porcentaje > 0) {
                    const pct = data.descuento.porcentaje
                    const exp = data.descuento.expiraAt
                        ? new Date(data.descuento.expiraAt).toISOString()
                        : null

                    setBannerGrowth(avisoDescuento(pct, pct >= 20))
                    if (data.descuento.codigoCupon) {
                        setDescuentoGrowthCodigo(data.descuento.codigoCupon)
                    }

                    // Reflejar el porcentaje de descuento en todos los productos de la carta
                    setProductos((prev) =>
                        prev.map((prod) => {
                            const descActual = Number(prod.descuento || 0)
                            return {
                                ...prod,
                                descuento: Math.max(descActual, pct),
                                descuentoFechaFin:
                                    pct >= descActual
                                        ? exp || prod.descuentoFechaFin
                                        : prod.descuentoFechaFin,
                            }
                        })
                    )

                    // Actualizar selectedProduct si el drawer de producto está abierto
                    setSelectedProduct((prev) => {
                        if (!prev) return null
                        const descActual = Number(prev.descuento || 0)
                        return {
                            ...prev,
                            descuento: Math.max(descActual, pct),
                            descuentoFechaFin:
                                pct >= descActual ? exp || prev.descuentoFechaFin : prev.descuentoFechaFin,
                        }
                    })
                }

                // Caso 1: Campaña "¿Lo Mismo de Siempre?" (Drawer 1-Click Buy)
                if (data.modalidad === 'drawer_habitual') {
                    const items: ItemCarritoTienda[] = Array.isArray(data.carrito) ? data.carrito : []
                    if (items.length > 0) {
                        const dir = data.cliente?.direccionHabitual
                        const tipoPedido =
                            dir?.tipoPedido === 'delivery' || dir?.tipoPedido === 'takeaway'
                                ? dir.tipoPedido
                                : restaurante?.deliveryEnabled !== false
                                  ? 'delivery'
                                  : 'takeaway'

                        const fee =
                            dir?.deliveryFee != null
                                ? Number(dir.deliveryFee)
                                : tipoPedido === 'delivery'
                                  ? Number(restaurante?.deliveryFee || 0)
                                  : 0
                        const itemsTotalNum = items.reduce(
                            (sum: number, it) => sum + parseFloat(it.precio) * it.cantidad,
                            0
                        )

                        const metodosDisponibles = new Set((restaurante?.metodosPago || []).map((m) => m.id))
                        const metodoPago =
                            dir?.metodoPago && metodosDisponibles.has(dir.metodoPago)
                                ? dir.metodoPago
                                : restaurante?.metodosPago?.[0]?.id || 'efectivo'

                        const checkout = {
                            tipoPedido,
                            nombre: data.cliente?.nombre || '',
                            telefono: data.cliente?.telefono || '',
                            direccion: tipoPedido === 'delivery' ? dir?.direccion || '' : '',
                            lat: dir?.lat ?? null,
                            lng: dir?.lng ?? null,
                            notas: '',
                            tipoDomicilio: null,
                            deliveryFee: fee,
                            zonaNombre: null,
                            itemsTotal: itemsTotalNum.toFixed(2),
                            total: (itemsTotalNum + fee).toFixed(2),
                            codigoDescuentoId: data.descuento?.codigoDescuentoId ?? null,
                            montoDescuento: 0,
                            metodoPago,
                            horarioProgramado: '',
                            sucursalId: dir?.sucursalId ?? null,
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
                    }
                } else if (data.modalidad === 'descuento_banner') {
                    // Caso 2: Campaña "Reactivación con Descuento"
                    const items: ItemCarritoTienda[] = Array.isArray(data.carrito) ? data.carrito : []
                    const pct = data.descuento?.porcentaje ?? 0
                    if (items.length > 0 && cartItems.length === 0) {
                        const itemsConDescuento = items.map((it) => {
                            const descActual = Number(it.descuento || 0)
                            const nuevoDesc = Math.max(descActual, pct)
                            const precioOrig = Number(it.precioOriginal || it.precio || 0)
                            return {
                                ...it,
                                descuento: nuevoDesc,
                                precioOriginal: (it.precioOriginal || it.precio).toString(),
                                precio:
                                    nuevoDesc > 0
                                        ? (precioOrig * (1 - nuevoDesc / 100)).toFixed(2)
                                        : it.precio,
                            }
                        })
                        setCartItems(itemsConDescuento)
                        // El toast promete lo que el resolver pudo verificar: si el cupón del toque ya
                        // se usó o venció, el carrito se arma igual pero sin descuento que anunciar.
                        if (data.descuento?.activo && pct > 0) {
                            toast.success('Te dejamos tu pedido listo con descuento 🛒')
                        } else {
                            toast.success('Te dejamos tu pedido listo 🛒')
                        }
                    } else if (data.descuento?.activo) {
                        toast.success(`Beneficio aplicado: ${data.descuento.porcentaje}% OFF 🎉`)
                    }
                }
            } catch (err) {
                console.error('Error resolviendo token de micro-campaña:', err)
            }
        }

        void resolverToken()
    }, [
        searchParams,
        username,
        loading,
        restaurante,
        productos.length,
        tkAplicadoRef,
        setTelefonoCliente,
        metodoPagoHabitualRef,
        setBannerGrowth,
        setProductos,
        setSelectedProduct,
        setDescuentoGrowthCodigo,
        setCartItems,
        checkoutDataRef,
        setCheckoutDeliveryData,
        setEditSemaphoreLocal,
        setMostrarCheckoutEnCarrito,
        setExpandido,
        setEsPedidoHabitual,
        setCarritoAbierto,
        cartItems.length,
        demo,
    ])

    useEffect(() => {
        if (!campana || searchParams.has('tk') || searchParams.has('c') || tkAplicadoRef.current) return

        if (campana.beneficioTipo === 'puntos' && (campana.puntosBeneficio ?? 0) > 0) {
            setDescuentoGrowthCodigo(null)
            const desde = Number(campana.puntosMontoMinimo ?? 0) > 0
                ? ` en un pedido desde $${Number(campana.puntosMontoMinimo).toLocaleString('es-AR')}`
                : ''
            setBannerGrowth({
                titulo: 'Sumás puntos extra',
                detalle: `${Number(campana.puntosBeneficio).toLocaleString('es-AR')} puntos${desde}. Se acreditan cuando se cobra el pedido.`,
            })
            return
        }

        if (campana.tipo === 'reactivacion' || campana.slug === 'reactivacion') {
            const pct = campana.descuentoPorcentaje > 0 ? campana.descuentoPorcentaje : 10
            setBannerGrowth(avisoDescuento(pct))
            setProductos((prev) =>
                prev.map((prod) => {
                    const descActual = Number(prod.descuento || 0)
                    return {
                        ...prod,
                        descuento: Math.max(descActual, pct),
                        descuentoFechaFin: prod.descuentoFechaFin || null,
                    }
                })
            )
        }
    }, [campana, searchParams, setBannerGrowth, setProductos, tkAplicadoRef])
}
