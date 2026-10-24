import type { PlantillaId } from '@/lib/plantillas'
import { CartaArtesanal } from './artesanal/Carta'
import { HistoriaArtesanal } from './artesanal/Historia'
import { PedidoArtesanal } from './artesanal/Pedido'
import { PieArtesanal } from './artesanal/Pie'
import { PortadaArtesanal } from './artesanal/Portada'
import { CartaElegante } from './elegante/Carta'
import { HistoriaElegante } from './elegante/Historia'
import { SelloElegante } from './elegante/Pedido'
import { PieElegante } from './elegante/Pie'
import { PortadaElegante } from './elegante/Portada'
import { CartaModerna } from './moderna/Carta'
import { HistoriaModerna } from './moderna/Historia'
import { PedidoModerna } from './moderna/Pedido'
import { PieModerna } from './moderna/Pie'
import { PortadaModerna } from './moderna/Portada'
import type { Plantilla } from './tipos'

export const plantillas = {
    elegante: {
        Portada: PortadaElegante,
        Carta: CartaElegante,
        Historia: HistoriaElegante,
        Pie: PieElegante,
        Pedido: SelloElegante,
    },
    moderna: {
        Portada: PortadaModerna,
        Carta: CartaModerna,
        Historia: HistoriaModerna,
        Pie: PieModerna,
        Pedido: PedidoModerna,
    },
    artesanal: {
        Portada: PortadaArtesanal,
        Carta: CartaArtesanal,
        Historia: HistoriaArtesanal,
        Pie: PieArtesanal,
        Pedido: PedidoArtesanal,
    },
} satisfies Record<PlantillaId, Plantilla>
