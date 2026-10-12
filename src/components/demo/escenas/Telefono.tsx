import type { ReactNode } from 'react'

/**
 * El marco de celular de la landing (landing/src/components/marcos/Telefono.astro): un lienzo de
 * 412 × 866 con una pantalla de 390 × 844, el tamaño de un iPhone de 6,1". La barra de estado toma
 * el color del texto de la tienda que muestra.
 */
export function Telefono({ children }: { children: ReactNode }) {
  return (
    <div className="telefono">
      <span className="telefono-boton telefono-boton--accion" />
      <span className="telefono-boton telefono-boton--vol1" />
      <span className="telefono-boton telefono-boton--vol2" />
      <span className="telefono-boton telefono-boton--power" />
      <div className="telefono-pantalla">
        {children}
        <div className="telefono-estado">
          <span className="telefono-hora">21:04</span>
          <span className="telefono-iconos">
            <svg viewBox="0 0 18 12" className="h-[11px]" aria-hidden>
              <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
              <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" />
              <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
              <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 16 12" className="h-[11px]" aria-hidden>
              <path
                d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0L8 11.5Zm-4-4.1L2.3 5.7a8.1 8.1 0 0 1 11.4 0L12 7.4a5.7 5.7 0 0 0-8 0ZM.6 4 0 3.4a11.3 11.3 0 0 1 16 0l-.6.6-1 1a9.9 9.9 0 0 0-12.8 0L.6 4Z"
                fill="currentColor"
              />
            </svg>
            <svg viewBox="0 0 27 13" className="h-[12px]" aria-hidden>
              <rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity=".4" />
              <rect x="2" y="2" width="17" height="9" rx="2.4" fill="currentColor" />
              <path d="M25 4.5v4a2.2 2.2 0 0 0 0-4Z" fill="currentColor" opacity=".45" />
            </svg>
          </span>
        </div>
        <span className="telefono-isla" />
      </div>
    </div>
  )
}
