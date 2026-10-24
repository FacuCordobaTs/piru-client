import { toast } from 'sonner'
import type { DeliveryState } from './useDeliveryState'

type Contexto = Pick<
    DeliveryState,
    | 'restaurante'
    | 'setCreandoSala'
    | 'setModalSalaOpen'
    | 'navigate'
    | 'telefonoSala'
    | 'nombreSala'
    | 'creandoSala'
    | 'setNombreSala'
    | 'setTelefonoSala'
>

export function useCrearSala({
    restaurante,
    setCreandoSala,
    setModalSalaOpen,
    navigate,
    telefonoSala,
    nombreSala,
    creandoSala,
    setNombreSala,
    setTelefonoSala,
}: Contexto) {
    const crearSala = async (nombreParaSala: string, telefonoParaSala?: string) => {
        if (!nombreParaSala.trim() || !restaurante?.id) return
        setCreandoSala(true)
        try {
            const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
            const res = await fetch(`${url}/public/sala/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restauranteId: restaurante?.id,
                    nombreCliente: nombreParaSala.trim(),
                    telefono: telefonoParaSala?.trim() || undefined,
                }),
            })
            const data = await res.json()
            if (data.success && data.data?.token) {
                localStorage.setItem('cliente_nombre', nombreParaSala.trim())
                if (telefonoParaSala?.trim()) {
                    localStorage.setItem('cliente_telefono', telefonoParaSala.trim())
                }
                setModalSalaOpen(false)
                navigate(`/sala/${data.data.token}/nombre`)
            } else {
                toast.error('Error al crear el pedido entre amigos')
            }
        } catch {
            toast.error('Error al conectar con el servidor')
        } finally {
            setCreandoSala(false)
        }
    }

    const handleCrearSala = async (e: React.FormEvent) => {
        e.preventDefault()
        const digits = (telefonoSala || '').replace(/\D/g, '')
        if (digits.length < 8) {
            toast.error('Ingresá un número de WhatsApp válido (mínimo 8 dígitos)')
            return
        }
        await crearSala(nombreSala, telefonoSala)
    }

    const onArmarPedidoClick = () => {
        if (creandoSala) return
        const storedName = localStorage.getItem('cliente_nombre')
        const storedTel =
            localStorage.getItem('cliente_telefono') || localStorage.getItem('piru_cliente_telefono') || ''
        const digits = (storedTel || '').replace(/\D/g, '')
        if (storedName && digits.length >= 8) {
            crearSala(storedName, storedTel)
        } else {
            if (storedName) setNombreSala(storedName)
            if (storedTel) setTelefonoSala(storedTel)
            setModalSalaOpen(true)
        }
    }
    return { crearSala, handleCrearSala, onArmarPedidoClick }
}
