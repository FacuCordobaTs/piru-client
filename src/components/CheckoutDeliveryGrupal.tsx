import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { MapPin, Store, Truck, AlertTriangle, Loader2, Pencil, Check, X } from 'lucide-react'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import type { CheckoutDeliveryData, CheckoutEditSemaphore } from '@/store/mesaStore'

interface CheckoutDeliveryGrupalProps {
  restauranteId: number
  itemsTotal: string
  totalItems: number
  onConfirmarClick: () => void
  sendMessage: (msg: any) => void
  clienteId: string
  clienteNombre: string
  checkoutData: CheckoutDeliveryData | null
  editSemaphore: CheckoutEditSemaphore | null
  restauranteDireccion?: string
}

export function CheckoutDeliveryGrupal({
  restauranteId,
  itemsTotal,
  totalItems,
  onConfirmarClick,
  sendMessage,
  clienteId,
  clienteNombre,
  checkoutData,
  editSemaphore,
  restauranteDireccion
}: CheckoutDeliveryGrupalProps) {
  const [tipoPedido, setTipoPedido] = useState<'delivery' | 'takeaway'>(checkoutData?.tipoPedido || 'delivery')
  const [nombre, setNombre] = useState(checkoutData?.nombre || '')
  const [telefono, setTelefono] = useState(checkoutData?.telefono || '')
  const [direccion, setDireccion] = useState(checkoutData?.direccion || '')
  const [lat, setLat] = useState<number | null>(checkoutData?.lat ?? null)
  const [lng, setLng] = useState<number | null>(checkoutData?.lng ?? null)
  const [notas, setNotas] = useState(checkoutData?.notas || '')

  const [zonaDeliveryFee, setZonaDeliveryFee] = useState<number | null>(checkoutData ? checkoutData.deliveryFee : null)
  const [zonaNombre, setZonaNombre] = useState<string | null>(checkoutData?.zonaNombre ?? null)
  const [isCheckingZona, setIsCheckingZona] = useState(false)
  const [fueraDeZona, setFueraDeZona] = useState(false)

  const estoyEditando = editSemaphore?.clienteId === clienteId
  const alguienEditando = editSemaphore && !estoyEditando

  const deliveryFee = zonaDeliveryFee !== null ? zonaDeliveryFee : 0
  const itemsTotalNum = parseFloat(itemsTotal)
  const total = tipoPedido === 'delivery' ? itemsTotalNum + deliveryFee : itemsTotalNum

  useEffect(() => {
    if (checkoutData) {
      setTipoPedido(checkoutData.tipoPedido)
      setNombre(checkoutData.nombre)
      setTelefono(checkoutData.telefono)
      setDireccion(checkoutData.direccion)
      setLat(checkoutData.lat)
      setLng(checkoutData.lng)
      setNotas(checkoutData.notas)
      setZonaDeliveryFee(checkoutData.deliveryFee)
      setZonaNombre(checkoutData.zonaNombre)
    }
  }, [checkoutData?.nombre, checkoutData?.telefono, checkoutData?.direccion, checkoutData?.tipoPedido, checkoutData?.notas, checkoutData?.deliveryFee, checkoutData?.zonaNombre])

  useEffect(() => {
    if (lat === null || lng === null || !restauranteId) {
      if (!checkoutData?.deliveryFee) {
        setZonaDeliveryFee(null)
        setZonaNombre(null)
      }
      setFueraDeZona(false)
      return
    }

    const checkZona = async () => {
      setIsCheckingZona(true)
      setFueraDeZona(false)
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
        const res = await fetch(`${url}/public/restaurante/${restauranteId}/check-zona?lat=${lat}&lng=${lng}`)
        const data = await res.json()

        if (data.code === 'FUERA_DE_ZONA') {
          setFueraDeZona(true)
          setZonaDeliveryFee(null)
          setZonaNombre(null)
        } else if (data.success) {
          setFueraDeZona(false)
          setZonaDeliveryFee(parseFloat(data.deliveryFee))
          setZonaNombre(data.zonaNombre || null)
        }
      } catch {
        setZonaDeliveryFee(null)
        setZonaNombre(null)
      } finally {
        setIsCheckingZona(false)
      }
    }

    checkZona()
  }, [lat, lng, restauranteId])

  const handleAddressChange = useCallback((address: string, newLat: number | null, newLng: number | null) => {
    setDireccion(address)
    setLat(newLat)
    setLng(newLng)
    if (newLat === null || newLng === null) {
      setZonaDeliveryFee(null)
      setZonaNombre(null)
      setFueraDeZona(false)
    }
  }, [])

  const handleIniciarEdicion = () => {
    sendMessage({
      type: 'INICIAR_EDICION_CHECKOUT',
      payload: { clienteId, clienteNombre }
    })
  }

  const handleCancelarEdicion = () => {
    sendMessage({
      type: 'CANCELAR_EDICION_CHECKOUT',
      payload: { clienteId, clienteNombre }
    })
  }

  const handleGuardarEdicion = () => {
    if (tipoPedido === 'delivery' && (!nombre.trim() || !telefono.trim() || !direccion.trim())) {
      toast.error('Completa nombre, celular y dirección')
      return
    }
    if (tipoPedido === 'takeaway' && (!nombre.trim() || !telefono.trim())) {
      toast.error('Completa nombre y celular')
      return
    }
    if (tipoPedido === 'delivery' && (lat === null || lng === null)) {
      toast.error('Selecciona una dirección de las sugerencias')
      return
    }
    if (tipoPedido === 'delivery' && fueraDeZona) {
      toast.error('La dirección está fuera del área de delivery')
      return
    }

    sendMessage({
      type: 'MODIFICAR_CHECKOUT',
      payload: {
        clienteId,
        updates: {
          tipoPedido,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          lat,
          lng,
          notas: notas.trim(),
          deliveryFee,
          zonaNombre,
          itemsTotal,
          total: total.toFixed(2)
        }
      }
    })

    sendMessage({
      type: 'ACEPTAR_EDICION_CHECKOUT',
      payload: { clienteId, clienteNombre }
    })
  }

  const handleConfirmarPedido = () => {
    if (!checkoutData) {
      toast.error('Completa los datos de envío antes de confirmar')
      return
    }
    if (!checkoutData.nombre?.trim() || !checkoutData.telefono?.trim()) {
      toast.error('Faltan nombre o celular')
      return
    }
    if (checkoutData.tipoPedido === 'delivery' && !checkoutData.direccion?.trim()) {
      toast.error('Falta la dirección de entrega')
      return
    }
    onConfirmarClick()
  }

  const datosCompletos = checkoutData &&
    checkoutData.nombre?.trim() &&
    checkoutData.telefono?.trim() &&
    (checkoutData.tipoPedido === 'takeaway' || (checkoutData.direccion?.trim() && checkoutData.lat != null && checkoutData.lng != null))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-base">Datos de envío</h3>
        <p className="text-xs text-muted-foreground">Completa la información para el pedido grupal</p>
      </div>

      {alguienEditando && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/30">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {editSemaphore?.clienteNombre} está editando esta información
          </span>
        </div>
      )}

      {(!checkoutData || estoyEditando) && !alguienEditando && (
        <>
          {!estoyEditando && !checkoutData && (
            <Button variant="outline" className="w-full rounded-xl" onClick={handleIniciarEdicion}>
              <Pencil className="w-4 h-4 mr-2" />
              Completar datos de envío
            </Button>
          )}
          {(estoyEditando || checkoutData) && (
          <>
          <section className="space-y-3">
            <Label className="text-sm">¿Cómo van a recibir el pedido?</Label>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${tipoPedido === 'delivery' ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => setTipoPedido('delivery')}
              >
                <MapPin className={`w-6 h-6 mb-1 ${tipoPedido === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label className="cursor-pointer text-sm font-medium">Delivery</Label>
              </div>
              <div
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${tipoPedido === 'takeaway' ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => setTipoPedido('takeaway')}
              >
                <Store className={`w-6 h-6 mb-1 ${tipoPedido === 'takeaway' ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label className="cursor-pointer text-sm font-medium">Take Away</Label>
              </div>
            </div>
          </section>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre-grupal">Nombre de quien recibe</Label>
              <Input id="nombre-grupal" placeholder="Ej: Juan Perez" className="h-11 rounded-xl" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono-grupal">Celular (WhatsApp)</Label>
              <Input id="telefono-grupal" type="tel" placeholder="Ej: +54 9 11 1234-5678" className="h-11 rounded-xl" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>

            {tipoPedido === 'delivery' && (
              <div className="space-y-2">
                <Label htmlFor="direccion-grupal">Dirección de entrega</Label>
                <AddressAutocomplete value={direccion} onChange={handleAddressChange} placeholder="Ej: Espora 811, Santa Fe" />
                {lat !== null && lng !== null && direccion && (
                  <div className="mt-2">
                    {isCheckingZona ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Verificando zona...</span>
                      </div>
                    ) : fueraDeZona ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-xl border border-destructive/30">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                        <span className="text-xs text-destructive font-medium">Fuera del área de delivery</span>
                      </div>
                    ) : zonaDeliveryFee !== null ? (
                      <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Envío</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {deliveryFee === 0 ? 'GRATIS' : `$${deliveryFee.toFixed(0)}`}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {tipoPedido === 'takeaway' && restauranteDireccion && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/20 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">Retira en {restauranteDireccion}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notas-grupal">Notas adicionales (opcional)</Label>
              <Textarea id="notas-grupal" placeholder="Ej: El timbre no anda..." className="min-h-[80px] rounded-xl resize-none text-sm" value={notas} onChange={(e: any) => setNotas(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCancelarEdicion} className="flex-1 rounded-xl">
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleGuardarEdicion} className="flex-1 rounded-xl" disabled={tipoPedido === 'delivery' && (isCheckingZona || fueraDeZona)}>
              <Check className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </div>
          </>
          )}
        </>
      )}

      {checkoutData && !estoyEditando && !alguienEditando && (
        <div className="bg-secondary/40 p-4 rounded-2xl border border-border space-y-3">
          <Button variant="outline" size="sm" onClick={handleIniciarEdicion} className="text-xs h-8">
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">¿Cómo reciben?</p>
            <p className="font-semibold text-sm">{checkoutData.tipoPedido === 'delivery' ? 'Delivery' : 'Take Away'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Nombre</p>
            <p className="font-semibold text-sm">{checkoutData.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Celular</p>
            <p className="font-semibold text-sm">{checkoutData.telefono}</p>
          </div>
          {checkoutData.tipoPedido === 'delivery' && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Dirección</p>
              <p className="font-semibold text-sm">{checkoutData.direccion}</p>
              {checkoutData.deliveryFee > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Envío: ${checkoutData.deliveryFee.toFixed(0)} {checkoutData.zonaNombre ? `(${checkoutData.zonaNombre})` : ''}
                </p>
              )}
            </div>
          )}
          {checkoutData.notas && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Notas</p>
              <p className="font-medium text-sm">{checkoutData.notas}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
          <span className="font-medium">${itemsTotal}</span>
        </div>
        {checkoutData?.tipoPedido === 'delivery' && checkoutData.deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="font-medium">${checkoutData.deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-border/50">
          <span>Total</span>
          <span>${checkoutData?.total || total.toFixed(2)}</span>
        </div>
      </div>

      {datosCompletos ? (
        <Button className="w-full h-12 font-bold rounded-xl" size="lg" onClick={handleConfirmarPedido}>
          Confirmar Pedido
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          {!checkoutData ? 'Completa los datos de envío para continuar' : 'Esperando que se completen los datos...'}
        </p>
      )}
    </div>
  )
}
