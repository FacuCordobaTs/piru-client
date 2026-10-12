/**
 * Lo que el recorrido de la demo toma de la tienda del local: el nombre, el logo, la carta en el
 * orden en que se ve y los productos que protagonizan las escenas. Así cada ilustración habla de
 * su local y de sus productos, no de uno inventado.
 */

export interface ProductoDemo {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  imagenUrl: string | null
}

export interface CategoriaDemo {
  nombre: string
  productos: ProductoDemo[]
}

export interface DatosDemo {
  local: string
  /** El link de la tienda sin protocolo, como se ve en la barra del navegador. */
  enlace: string
  logo: { oscuro: string | null; claro: string | null }
  pedidoGrupal: boolean
  categorias: CategoriaDemo[]
  /** Los primeros de la carta, con foto si hay: siempre tres, con relleno si la carta es corta. */
  destacados: ProductoDemo[]
}

type ProductoTienda = {
  id: number
  nombre: string
  descripcion?: string | null
  precio: string | number
  imagenUrl?: string | null
  categoria?: string | null
  categoriaOrden?: number | null
  disponible?: boolean
}

type RestauranteTienda = {
  nombre: string
  imagenUrl?: string | null
  imagenLightUrl?: string | null
  orderGroupEnabled?: boolean | null
}

const RELLENO: ProductoDemo[] = [
  { id: -1, nombre: 'Tu plato estrella', descripcion: null, precio: 13500, imagenUrl: null },
  { id: -2, nombre: 'Tu acompañamiento', descripcion: null, precio: 6500, imagenUrl: null },
  { id: -3, nombre: 'Tu postre', descripcion: null, precio: 5200, imagenUrl: null },
]

export function datosDemo(restaurante: RestauranteTienda, productos: ProductoTienda[], enlace: string): DatosDemo {
  // Las categorías en el orden de la tienda (MenuDelivery): por su orden y "Sin categoría" al final.
  const orden = new Map<string, number>()
  const porCategoria = new Map<string, ProductoDemo[]>()
  for (const p of productos) {
    if (p.disponible === false) continue
    const categoria = p.categoria || 'Sin categoría'
    if (!orden.has(categoria)) orden.set(categoria, p.categoriaOrden ?? 0)
    const lista = porCategoria.get(categoria) ?? []
    lista.push({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? null,
      precio: Number(p.precio) || 0,
      imagenUrl: p.imagenUrl || null,
    })
    porCategoria.set(categoria, lista)
  }
  const categorias = [...porCategoria.entries()]
    .sort(([a], [b]) => {
      if (a === 'Sin categoría') return 1
      if (b === 'Sin categoría') return -1
      return (orden.get(a) ?? 0) - (orden.get(b) ?? 0) || a.localeCompare(b)
    })
    .map(([nombre, lista]) => ({ nombre, productos: lista }))

  const todos = categorias.flatMap((c) => c.productos).filter((p) => p.precio > 0)
  const elegidos = [...todos.filter((p) => p.imagenUrl), ...todos.filter((p) => !p.imagenUrl)].slice(0, 3)

  return {
    local: restaurante.nombre,
    enlace,
    logo: { oscuro: restaurante.imagenUrl || null, claro: restaurante.imagenLightUrl || null },
    pedidoGrupal: restaurante.orderGroupEnabled !== false,
    categorias,
    destacados: [...elegidos, ...RELLENO.slice(elegidos.length)],
  }
}

/** Las iniciales del local para cuando no tiene logo. */
export const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('')
