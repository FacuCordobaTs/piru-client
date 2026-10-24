/** Firma gráfica con los colores originales. En modo de un color, ambas áreas usan el primario. */
export function FirmaMarca({ className = '' }: { className?: string }) {
    return (
        <div aria-hidden className={`flex overflow-hidden ${className}`}>
            <span data-color-marca="primario" className="tienda-fondo-marca flex-[2]" />
            <span data-color-marca="secundario" className="tienda-fondo-complemento flex-1" />
        </div>
    )
}
