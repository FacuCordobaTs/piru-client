// Contrato de checkout compartido por la compra individual, la sala y su formulario.
export interface CheckoutDeliveryData {
  tipoPedido: 'delivery' | 'takeaway'
  nombre: string
  telefono: string
  direccion: string
  lat: number | null
  lng: number | null
  notas: string
  deliveryFee: number
  zonaNombre: string | null
  itemsTotal: string
  total: string
  codigoDescuentoId?: number | null
  cuponEnvioGratis?: boolean
  montoDescuento?: number
  metodoPago?: string | null
  horarioProgramado?: string
  sucursalId?: number | null
  tipoDomicilio?: 'casa' | 'departamento' | null
  canjeEnvioGratis?: boolean
  canjeDescuento?: boolean
  descuentoPuntos?: number
  // Contexto opcional de Growth; el pedido final de sala lo atribuye best-effort.
  visitorId?: string
  sesionUuid?: string
  campaniaSlug?: string
  campanaId?: number
  recetaToken?: string
  /** Participante que guardó el checkout; sólo éste emite el purchase de sala. */
  trackingClienteId?: string
}

export interface CheckoutEditSemaphore {
  clienteId: string
  clienteNombre: string
}

