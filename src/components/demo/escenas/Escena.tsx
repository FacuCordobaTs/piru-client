import type { CSSProperties, ReactNode } from 'react'

/**
 * El lienzo de una ilustración del recorrido: se diseña a `ancho × alto` px y se escala sólo con
 * CSS al lugar que le deja el diálogo (de ancho y de alto), sin saltos. Es decorativa (`inert`):
 * lo que muestra va en `etiqueta`.
 */
export function Escena({
  ancho = 360,
  alto = 280,
  etiqueta,
  children,
}: {
  ancho?: number
  alto?: number
  etiqueta: string
  children: ReactNode
}) {
  return (
    <div
      role="img"
      aria-label={etiqueta}
      className="escena"
      style={{ '--escala-w': ancho, '--escala-h': alto } as CSSProperties}
    >
      <div className="escena-lienzo" inert>
        {children}
      </div>
    </div>
  )
}
