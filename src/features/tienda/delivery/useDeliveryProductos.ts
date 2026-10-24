import { etiquetaVarianteMedallon } from '@/components/CheckoutDeliveryGrupal'
import type { ProductoTienda } from '../datos'
import type { Agregado, Variante } from '../producto'

import {
    codigoPromocionalMarketing,
    registrarEventoPixel,
    registrarEventoPixelUnaVez,
    registrarEventoTrackingUnaVez,
} from '@/lib/tracking'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { extrasTrackingCampana } from './modelo'

import { productosDeSecciones, seccionesDeProductos } from '../catalogo'
import type { useDeliveryPuntos } from './useDeliveryPuntos'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'productos'
    | 'campana'
    | 'restaurante'
    | 'demo'
    | 'drawerOpen'
    | 'selectedProduct'
    | 'username'
    | 'puntosCliente'
    | 'setModalPuntosOpen'
    | 'setCartItems'
    | 'setCartAnimation'
    | 'cartItems'
    | 'descuentoGrowthCodigo'
> &
    Pick<ReturnType<typeof useDeliveryPuntos>, 'puntosEnCarrito' | 'puntosUsadosBeneficios'>

export function useDeliveryProductos({
    productos,
    campana,
    restaurante,
    demo,
    drawerOpen,
    selectedProduct,
    username,
    puntosCliente,
    setModalPuntosOpen,
    puntosEnCarrito,
    puntosUsadosBeneficios,
    setCartItems,
    setCartAnimation,
    cartItems,
    descuentoGrowthCodigo,
}: Contexto) {
    const productosVenta = productos.filter((p) => !p.soloCanjePuntos)

    const secciones = seccionesDeProductos(productosVenta)

    const productoCampana =
        campana?.productoId != null
            ? (productosVenta.find((producto) => producto.id === campana.productoId) ?? null)
            : null

    const mostrarPedidoGrupal = !(productoCampana && campana) && restaurante?.orderGroupEnabled !== false

    useEffect(() => {
        if (demo || !drawerOpen || !selectedProduct?.id || !restaurante?.id || !username) return
        registrarEventoTrackingUnaVez(
            restaurante?.id,
            username,
            'product_view',
            `producto-${selectedProduct?.id}`,
            {
                productoId: selectedProduct?.id,
                nombreProducto: selectedProduct?.nombre,
                valor: selectedProduct?.precio,
                ...extrasTrackingCampana(campana),
            }
        )
        // Meta mide el mismo producto visto: `valor` unitario y un solo content_id.
        registrarEventoPixelUnaVez('ViewContent', `producto-${selectedProduct?.id}`, {
            productoId: selectedProduct?.id,
            nombreProducto: selectedProduct?.nombre,
            valor: selectedProduct?.precio,
        })
    }, [
        demo,
        drawerOpen,
        restaurante?.id,
        selectedProduct?.id,
        selectedProduct?.precio,
        username,
        campana,
        selectedProduct?.nombre,
    ])

    const productosNavegables = selectedProduct?.intentandoCanjear ? [] : productosDeSecciones(secciones)

    const agregarAlPedido = (
        producto: ProductoTienda,
        cantidad: number = 1,
        ingredientesExcluidos?: number[],
        agregados?: Agregado[],
        varianteSeleccionada?: Variante,
        varianteSecundariaSeleccionada?: Variante,
        nota?: string
    ) => {
        let ingExNombres: string[] = []
        if (ingredientesExcluidos && ingredientesExcluidos.length > 0) {
            ingExNombres = (producto.ingredientes ?? [])
                .filter((i) => ingredientesExcluidos.includes(i.id))
                .map((i) => i.nombre)
        }

        const esCanje = !!producto.intentandoCanjear
        if (producto.soloCanjePuntos && !esCanje) {
            toast.error('Este producto sólo se puede canjear por puntos.')
            return false
        }
        if (esCanje) {
            if (puntosCliente === null) {
                setModalPuntosOpen(true)
                toast.info('Identifícate con tu WhatsApp para canjear tus puntos')
                return
            }
            const puntosRestantes =
                (puntosCliente || 0) -
                puntosEnCarrito() -
                puntosUsadosBeneficios -
                Number(producto.puntosNecesarios || 0) * cantidad
            if (puntosRestantes < 0) {
                toast.error('No tienes suficientes puntos para agregar este producto.')
                return
            }
        }

        // Calculate discounted price
        let basePrecio = varianteSeleccionada
            ? parseFloat(varianteSeleccionada.precio)
            : Number(producto.precio)
        basePrecio += varianteSecundariaSeleccionada ? parseFloat(varianteSecundariaSeleccionada.precio) : 0
        let precioFinal = basePrecio
        if (!esCanje && producto.descuento && producto.descuento > 0) {
            precioFinal = basePrecio * (1 - producto.descuento / 100)
        }

        const precioAgregados = agregados
            ? agregados.reduce((sum: number, ag) => sum + Number(ag.precio || 0), 0)
            : 0
        const precioFinalNumber = esCanje ? 0 : precioFinal + precioAgregados

        const nombresVariantes = [varianteSeleccionada?.nombre, varianteSecundariaSeleccionada?.nombre]
            .filter(Boolean)
            .join(' · ')
        const baseNombre = nombresVariantes ? `${producto.nombre} - ${nombresVariantes}` : producto.nombre
        const nombreFinal = esCanje ? `${baseNombre} (Canje)` : baseNombre

        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            productoId: producto.id,
            categoria: producto.categoria,
            productoNombre: producto.nombre,
            tieneSelectorMedallon:
                producto.agregados?.some((agregado) => etiquetaVarianteMedallon(agregado.nombre) !== null) ??
                false,
            nombre: nombreFinal,
            precio: precioFinalNumber.toFixed(2),
            precioOriginal: varianteSeleccionada ? varianteSeleccionada.precio : producto.precio,
            descuento: producto.descuento || 0,
            imagenUrl: producto.imagenUrl,
            cantidad,
            varianteId: varianteSeleccionada?.id,
            varianteNombre: varianteSeleccionada?.nombre,
            varianteSecundariaId: varianteSecundariaSeleccionada?.id,
            varianteSecundariaNombre: varianteSecundariaSeleccionada?.nombre,
            ingredientesExcluidos: ingredientesExcluidos || [],
            ingredientesExcluidosNombres: ingExNombres,
            agregados: agregados || [],
            nota: nota?.trim() || undefined,
            esCanjePuntos: esCanje,
            puntosNecesarios: esCanje ? Number(producto.puntosNecesarios) : 0,
            puntosGanados: esCanje ? 0 : producto.puntosGanados,
        }

        setCartItems((prev) => [...prev, newItem])

        // Meta mide el agregado al carrito con el total de la línea y las unidades.
        if (!demo)
            registrarEventoPixel('AddToCart', {
                productoId: producto.id,
                nombreProducto: newItem.nombre,
                valor: (precioFinalNumber * cantidad).toFixed(2),
                cantidad,
            })

        const bumpCart = () => {
            setTimeout(() => {
                setCartAnimation(true)
                setTimeout(() => setCartAnimation(false), 300)
            }, 850)
        }

        bumpCart()
    }

    const handleEliminarItem = (itemId: string) => {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId))
    }

    const totalPedido = cartItems
        .reduce((sum, item) => sum + parseFloat(item.precio) * item.cantidad, 0)
        .toFixed(2)

    const tieneCodigoCampana =
        !demo && Boolean(descuentoGrowthCodigo || (username && codigoPromocionalMarketing(username)))

    const subtotalBaseOriginal = cartItems
        .reduce((sum, item) => sum + Number(item.precioOriginal || item.precio || 0) * item.cantidad, 0)
        .toFixed(2)

    const itemsTotalCheckout = tieneCodigoCampana ? subtotalBaseOriginal : totalPedido

    const alturaCarrito = (() => {
        const n = cartItems.length
        if (n >= 4) return '85vh'
        return ['28vh', '42vh', '57vh', '71vh'][n]
    })()
    return {
        productosVenta,
        secciones,
        productoCampana,
        mostrarPedidoGrupal,
        productosNavegables,
        agregarAlPedido,
        handleEliminarItem,
        totalPedido,
        tieneCodigoCampana,
        subtotalBaseOriginal,
        itemsTotalCheckout,
        alturaCarrito,
    }
}
