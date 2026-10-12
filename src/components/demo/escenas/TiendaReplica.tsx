import { Plus, Share2, User } from 'lucide-react'
import { iniciales, type DatosDemo, type ProductoDemo } from './datos'

/**
 * La parte de arriba de la tienda del local (pages/MenuDelivery.tsx), con sus datos y su tema,
 * para el celular del primer paso del recorrido. Usa las mismas clases que la tienda, así que toma
 * los colores del local y el modo oscuro igual que ella. Cambios deliberados, como la réplica de la
 * landing (landing/src/components/replicas/tienda/TiendaMenu.astro), para que en el celular se vean
 * productos sin scrollear: el logo mide 112 px en vez de 192, las categorías van en una sola fila
 * y, si el local no tiene logo, en su lugar va su nombre.
 */
export function TiendaReplica({ datos }: { datos: DatosDemo }) {
  const { logo, categorias } = datos
  const enGrilla = categorias.length >= 1 && categorias.length <= 3
  return (
    <div className="relative h-full w-full overflow-hidden bg-background text-foreground">
      <div className="space-y-6 px-5 pt-[66px]">
        <div className="flex justify-center">
          {logo.oscuro || logo.claro ? (
            <>
              {logo.oscuro && (
                <img
                  src={logo.oscuro}
                  alt=""
                  className={`size-28 rounded-md object-cover ${logo.claro ? 'hidden dark:block' : ''}`}
                />
              )}
              {logo.claro && <img src={logo.claro} alt="" className="block size-28 rounded-md object-cover dark:hidden" />}
            </>
          ) : (
            <div className="grid size-28 place-items-center rounded-2xl bg-primary px-2 text-center text-primary-foreground">
              <span className="text-[34px] font-black leading-none tracking-tight">{iniciales(datos.local)}</span>
            </div>
          )}
        </div>

        {datos.pedidoGrupal && (
          <div className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-4">
            <div className="flex shrink-0 -space-x-2.5">
              <span className="z-[2] flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                <User className="size-4" />
              </span>
              <span className="z-[1] flex size-8 items-center justify-center rounded-full bg-primary/25 text-primary ring-2 ring-background">
                <User className="size-4" />
              </span>
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-background text-primary/60">
                <Plus className="size-4" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-foreground">¿Piden entre varios?</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">Compartí un link y cada uno agrega lo suyo</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground shadow-sm">
              <Share2 className="size-3.5" />
              Crear link
            </span>
          </div>
        )}

        {categorias.length > 0 && (
          <div className="space-y-3 pt-1">
            <p className="px-1 text-lg font-bold text-foreground">Categorías</p>
            <div className="-mr-5 flex gap-2 overflow-hidden pl-1">
              {['Todas', ...categorias.map((c) => c.nombre)].map((nombre, i) => (
                <span
                  key={nombre}
                  className={`flex h-10 shrink-0 items-center rounded-lg border border-transparent px-5 text-xs font-medium ${
                    i === 0 ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary/50 text-secondary-foreground'
                  }`}
                >
                  {nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {categorias.slice(0, 2).map((categoria) => (
            <div key={categoria.nombre} className="space-y-4">
              <p className="px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{categoria.nombre}</p>
              <div className={enGrilla ? 'grid grid-cols-2 gap-4 px-1' : '-mr-5 ml-2 flex gap-4 overflow-hidden pb-3'}>
                {categoria.productos.slice(0, enGrilla ? 4 : 3).map((producto) => (
                  <Tarjeta key={producto.id} producto={producto} ancho={enGrilla ? 'w-full' : null} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** `ProductoCard` de la tienda: con foto o sólo texto. */
function Tarjeta({ producto, ancho }: { producto: ProductoDemo; ancho: string | null }) {
  const largo = producto.nombre.trim().length
  const nombreClass = largo > 70 ? 'text-[11px]' : largo > 48 ? 'text-xs' : largo > 30 ? 'text-[13px]' : 'text-[15px]'
  const precio = `$${producto.precio.toFixed(0)}`
  if (!producto.imagenUrl) {
    return (
      <div className={`flex min-h-[140px] flex-col justify-between rounded-[24px] border border-border/50 bg-card p-[18px] shadow-sm ${ancho ?? 'w-44 shrink-0'}`}>
        <div className="flex-1">
          <p className={`mb-2 break-words font-bold leading-snug text-foreground ${nombreClass}`}>{producto.nombre}</p>
          {producto.descripcion && (
            <p className="line-clamp-3 text-xs font-medium leading-relaxed text-muted-foreground">{producto.descripcion}</p>
          )}
        </div>
        <span className="mt-4 text-[18px] font-black text-primary">{precio}</span>
      </div>
    )
  }
  return (
    <div className={`flex min-h-[260px] flex-col overflow-hidden rounded-[24px] border border-border/50 bg-card shadow-md ${ancho ?? 'w-48 shrink-0'}`}>
      <div className="relative h-[130px] w-full shrink-0 bg-zinc-900">
        <img src={producto.imagenUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col bg-card p-3.5">
        <div className="flex-1">
          <p className={`break-words font-bold leading-tight text-foreground ${nombreClass}`}>{producto.nombre}</p>
          {producto.descripcion && (
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-muted-foreground">{producto.descripcion}</p>
          )}
        </div>
        <span className="mt-2 text-[17px] font-black text-primary">{precio}</span>
      </div>
    </div>
  )
}
