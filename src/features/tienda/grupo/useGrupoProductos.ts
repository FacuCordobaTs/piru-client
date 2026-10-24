import {
    registrarEventoPixel,
    registrarEventoPixelUnaVez,
    registrarEventoTrackingUnaVez,
} from '@/lib/tracking'
import { useEffect } from 'react'
import { productosDeSecciones, seccionesDeProductos } from '../catalogo'
import type { Agregado, Product, Variante } from '../producto'

import type { GrupoState } from './useGrupoState'

type Contexto = Pick<
    GrupoState,
    | 'productos'
    | 'esSala'
    | 'drawerOpen'
    | 'selectedProduct'
    | 'restaurante'
    | 'token'
    | 'clienteNombre'
    | 'clienteTelefono'
    | 'sendMessage'
    | 'wsState'
    | 'setMostrarCheckoutEnCarrito'
>

export function useGrupoProductos({
    productos,
    esSala,
    drawerOpen,
    selectedProduct,
    restaurante,
    token,
    clienteNombre,
    clienteTelefono,
    sendMessage,
    wsState,
    setMostrarCheckoutEnCarrito,
}: Contexto) {
    const secciones = seccionesDeProductos(productos)

    useEffect(() => {
        if (!esSala || !drawerOpen || !selectedProduct?.id || !restaurante?.id || !restaurante?.username)
            return
        registrarEventoTrackingUnaVez(
            restaurante?.id,
            restaurante?.username,
            'product_view',
            `sala-${token ?? 'sin-token'}-producto-${selectedProduct?.id}`,
            {
                productoId: selectedProduct?.id,
                nombreProducto: selectedProduct?.nombre,
                valor: selectedProduct?.precio,
            }
        )
        // Meta mide el mismo producto visto: `valor` unitario y un solo content_id.
        registrarEventoPixelUnaVez(
            'ViewContent',
            `sala-${token ?? 'sin-token'}-producto-${selectedProduct?.id}`,
            {
                productoId: selectedProduct?.id,
                nombreProducto: selectedProduct?.nombre,
                valor: selectedProduct?.precio,
            }
        )
    }, [
        drawerOpen,
        esSala,
        restaurante?.id,
        restaurante?.username,
        selectedProduct?.id,
        selectedProduct?.nombre,
        selectedProduct?.precio,
        token,
    ])

    const productosNavegables = productosDeSecciones(secciones)

    const agregarAlPedido = (
        producto: Product,
        cantidad: number = 1,
        ingredientesExcluidos?: number[],
        agregados?: Agregado[],
        varianteSeleccionada?: Variante,
        varianteSecundariaSeleccionada?: Variante,
        nota?: string
    ) => {
        if (!clienteNombre) return
        let precioBase = varianteSeleccionada
            ? parseFloat(String(varianteSeleccionada.precio))
            : parseFloat(String(producto.precio))
        precioBase += varianteSecundariaSeleccionada
            ? parseFloat(String(varianteSecundariaSeleccionada.precio))
            : 0
        if (producto.descuento && producto.descuento > 0) {
            precioBase = precioBase * (1 - producto.descuento / 100)
        }
        const precioAgregados = (agregados || []).reduce(
            (sum: number, ag: Agregado) => sum + parseFloat(ag.precio || '0'),
            0
        )
        const precioUnitario = (precioBase + precioAgregados).toFixed(2)
        const tel = clienteTelefono || localStorage.getItem('cliente_telefono') || undefined
        sendMessage({
            type: 'AGREGAR_ITEM',
            payload: {
                productoId: producto.id,
                clienteNombre,
                clienteTelefono: tel,
                cantidad,
                precioUnitario,
                imagenUrl: producto.imagenUrl,
                ingredientesExcluidos: ingredientesExcluidos || [],
                agregados: agregados || [],
                varianteId: varianteSeleccionada?.id,
                varianteNombre: varianteSeleccionada?.nombre,
                varianteSecundariaId: varianteSecundariaSeleccionada?.id,
                varianteSecundariaNombre: varianteSecundariaSeleccionada?.nombre,
                nota: nota?.trim() || undefined,
            },
        })
        // Meta mide el agregado al carrito con el total de la línea y las unidades.
        registrarEventoPixel('AddToCart', {
            productoId: producto.id,
            nombreProducto: producto.nombre,
            valor: (Number(precioUnitario) * cantidad).toFixed(2),
            cantidad,
        })
    }

    const handleEliminarItem = (itemPedidoId: number) => {
        sendMessage({ type: 'ELIMINAR_ITEM', payload: { itemId: itemPedidoId } })
    }

    const todosLosItems = wsState?.items || []

    useEffect(() => {
        if (todosLosItems.length === 0) setMostrarCheckoutEnCarrito(false)
    }, [setMostrarCheckoutEnCarrito, todosLosItems.length])

    const alturaCarrito = (() => {
        const n = todosLosItems.length
        if (n >= 4) return '85vh'
        return ['28vh', '42vh', '57vh', '71vh'][n]
    })()

    const totalPedido = todosLosItems
        .reduce((sum, item) => {
            const precio = parseFloat(item.precioUnitario || String(item.precio || 0))
            return sum + precio * item.cantidad
        }, 0)
        .toFixed(2)
    return {
        secciones,
        productosNavegables,
        agregarAlPedido,
        handleEliminarItem,
        todosLosItems,
        alturaCarrito,
        totalPedido,
    }
}
