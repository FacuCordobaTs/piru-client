import { TiendaTheme } from '@/features/tienda/compartido/TiendaTheme'
import { Estado } from '@/features/tienda/compartido/Estado'
import { TiendaVista } from '@/features/tienda/TiendaVista'
import type { ProductoCarta, SeccionCarta } from '@/features/tienda/tipos'
import { ACCESO_SECUNDARIO, formatoPesos, logoPara, precioProducto, useTienda } from '@/lib/tienda'
import { PLANTILLAS, type PlantillaId } from '@/lib/plantillas'
import { Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

// Sólo en desarrollo (`/_ejemplo`): una tienda inventada para mirar las plantillas con fotos reales, sin
// backend ni datos de ningún local. Tocar un plato lo suma al pedido de mentira.

const foto = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&q=70&auto=format&fit=crop`

type Producto = ProductoCarta & { categoria: string; foto?: string }

const CARTA: Producto[] = [
    { id: 1, categoria: 'Para empezar', nombre: 'Burrata de la huerta', descripcion: 'Tomates de estación, albahaca fresca y pan de masa madre.', precio: 12500, foto: '1540189549336-e6e99c3679fe' },
    { id: 2, categoria: 'Para empezar', nombre: 'Croquetas de hongos', descripcion: 'Doradas por fuera, cremosas por dentro. Alioli de limón.', precio: 8500, descuento: 10, foto: '1504674900247-0877df9cc836' },
    { id: 3, categoria: 'Para empezar', nombre: 'Brochetas a la parrilla', descripcion: 'Vegetales asados y chimichurri de la casa.', precio: 9800, foto: '1555939594-58d7cb561ad1' },
    { id: 4, categoria: 'Para empezar', nombre: 'Pan de campo', descripcion: 'Horneado cada mañana, con aceite de oliva.', precio: 3500 },
    { id: 5, categoria: 'Para empezar', nombre: 'Aceitunas marinadas', descripcion: 'Con naranja, ajo y romero.', precio: 4200 },
    { id: 6, categoria: 'Los principales', nombre: 'Ravioles de calabaza', descripcion: 'Pasta hecha a mano, manteca de hierbas y queso estacionado.', precio: 16000, foto: '1621996346565-e3dbc646d9a9' },
    { id: 7, categoria: 'Los principales', nombre: 'Ojo de bife', descripcion: 'A la parrilla, con papas rústicas y ensalada verde.', precio: 24500, foto: '1600891964092-4316c288032e' },
    { id: 8, categoria: 'Los principales', nombre: 'Pizza margherita', descripcion: 'Masa de 48 horas, tomate San Marzano y mozzarella.', precio: 14800, foto: '1513104890138-7c749659a591' },
    { id: 9, categoria: 'Los principales', nombre: 'Hamburguesa Oliva', descripcion: 'Doble medallón, cheddar, cebolla caramelizada.', precio: 15200, descuento: 15, foto: '1568901346375-23c9450c58cd' },
    { id: 10, categoria: 'Los principales', nombre: 'Bowl de estación', descripcion: 'Quinoa, palta, garbanzos crocantes y verdes.', precio: 13200, foto: '1546069901-ba9599a7e63c' },
    { id: 11, categoria: 'Los principales', nombre: 'Tallarines al pesto', descripcion: 'Albahaca, piñones y parmesano.', precio: 13900, foto: '1473093295043-cdd812d0e601' },
    { id: 12, categoria: 'Postres', nombre: 'Panqueques con dulce de leche', descripcion: 'Como los de la abuela.', precio: 6500, foto: '1551024506-0bccd828d307' },
    { id: 13, categoria: 'Postres', nombre: 'Flan casero', descripcion: 'Con crema o dulce de leche.', precio: 5200 },
    { id: 14, categoria: 'Para tomar', nombre: 'Limonada de la casa', descripcion: 'Limón, menta y jengibre.', precio: 4500 },
    { id: 15, categoria: 'Para tomar', nombre: 'Vermut de la casa', descripcion: 'Con soda y rodaja de naranja.', precio: 5800 },
    { id: 16, categoria: 'Para tomar', nombre: 'Agua con o sin gas', precio: 2200 },
]

const COLORES = {
    'Oliva y terracota': { colorPrimario: '#5b6b2f', colorSecundario: '#c4532c' },
    'Rojo y azul': { colorPrimario: '#ff0000', colorSecundario: '#0000ff' },
    'Negro y amarillo': { colorPrimario: '#111111', colorSecundario: '#ffd400' },
    'Sin colores': { colorPrimario: null, colorSecundario: null },
} as const

export default function EjemploTienda() {
    const [plantilla, setPlantilla] = useState<PlantillaId>(
        () => (new URLSearchParams(location.search).get('plantilla') as PlantillaId) || 'moderna'
    )
    const [colores, setColores] = useState<keyof typeof COLORES>('Oliva y terracota')
    const [conFotos, setConFotos] = useState(true)
    const [pedido, setPedido] = useState<Producto[]>([])

    const productos = useMemo(
        () => CARTA.map((p) => ({ ...p, imagenUrl: conFotos && p.foto ? foto(p.foto) : null })),
        [conFotos]
    )
    const restaurante = useMemo(
        () => ({
            nombre: 'Casa Oliva',
            ...COLORES[colores],
            usarColorUnico: false,
            tienda: {
                plantilla,
                productoDestacadoId: 6,
                frase: 'El placer de comer bien.',
                bajada: 'Cocina de estación, buenos ingredientes y tiempo para disfrutar. Tu mesa está donde estés.',
                cinta: ['Pasta hecha a mano', 'Masa de 48 horas', 'Parrilla a leña'],
                portadaUrl: conFotos ? foto('1414235077428-338989a2e8c0') : undefined,
                galeria: conFotos ? [foto('1517248135467-4c7edcad34c4'), foto('1559339352-11d035aa65de')] : [],
                historia: {
                    titulo: 'Una cocina con raíces',
                    texto: 'Nos gusta cocinar como nos enseñaron: con las manos, con paciencia y con lo mejor de cada estación.\nDesde nuestra cocina en Palermo, llevamos ese espíritu a cada mesa.',
                },
                instagram: 'casaoliva',
                whatsapp: '5491112345678',
            },
        }),
        [plantilla, colores, conFotos]
    )
    const { tienda, paleta, fuentes } = useTienda(restaurante)
    const secciones: SeccionCarta<Producto>[] = [...new Set(productos.map((p) => p.categoria))].map((nombre) => ({
        nombre,
        productos: productos.filter((p) => p.categoria === nombre),
    }))
    const destacado = productos.find((p) => p.id === tienda.productoDestacadoId) ?? null
    const total = pedido.reduce((s, p) => s + precioProducto(p).final, 0)
    const verCarta = () => document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' })

    return (
        <div className="menu-delivery min-h-screen overflow-x-clip bg-background text-foreground">
            <TiendaTheme paleta={paleta} fuentes={fuentes} />
            <TiendaVista
                key={plantilla}
                tienda={tienda}
                portada={{
                    nombre: 'Casa Oliva',
                    logo: logoPara(null, paleta.oscuro),
                    frase: tienda.frase,
                    bajada: tienda.bajada,
                    datos: [
                        <Estado abierto texto="Abierto · hasta las 23:30" />,
                        'Delivery · Take away',
                        'Gorriti 4820, Palermo',
                    ],
                    accionPrincipal: { texto: 'Ver la carta', onClick: verCarta },
                    destacado: destacado ? { producto: destacado, onAbrir: () => setPedido((p) => [...p, destacado]) } : null,
                    acciones: (
                        <>
                            <button type="button" className={ACCESO_SECUNDARIO}>
                                <Users className="size-4 shrink-0" /> Pedir entre varios
                            </button>
                            <button type="button" className={ACCESO_SECUNDARIO}>
                                <Sparkles className="size-4 shrink-0" /> 740 pts
                            </button>
                        </>
                    ),
                }}
                carta={{ secciones, onAbrir: (p) => setPedido((actual) => [...actual, p]) }}
                pie={{
                    nombre: 'Casa Oliva',
                    logo: null,
                    direccion: 'Gorriti 4820, Palermo',
                    horarios: [1, 2, 3, 4, 5, 6].map((diaSemana) => ({ diaSemana, horaApertura: '19:30', horaCierre: '23:30' })),
                    instagram: tienda.instagram,
                    whatsapp: tienda.whatsapp,
                    onPedir: verCarta,
                }}
                pedido={{
                    cantidad: pedido.length,
                    total: formatoPesos(total),
                    visible: pedido.length > 0,
                    onClick: () => setPedido([]),
                }}
            />

            <aside className="fixed bottom-24 right-3 z-50 flex max-w-[calc(100vw-24px)] flex-wrap items-center gap-1.5 rounded-2xl bg-black/85 p-1.5 font-sans text-[12px] text-white shadow-2xl">
                {PLANTILLAS.map((id) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setPlantilla(id)}
                        className={`rounded-xl px-3 py-1.5 capitalize ${plantilla === id ? 'bg-white text-black' : 'hover:bg-white/15'}`}
                    >
                        {id}
                    </button>
                ))}
                <select
                    value={colores}
                    onChange={(e) => setColores(e.target.value as keyof typeof COLORES)}
                    className="rounded-xl bg-white/15 px-2 py-1.5 text-white [&>option]:text-black"
                >
                    {Object.keys(COLORES).map((c) => (
                        <option key={c}>{c}</option>
                    ))}
                </select>
                <label className="flex items-center gap-1.5 px-2">
                    <input type="checkbox" checked={conFotos} onChange={(e) => setConFotos(e.target.checked)} />
                    Fotos
                </label>
            </aside>
        </div>
    )
}
