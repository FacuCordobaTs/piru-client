import type { Fuentes, Paleta } from '@/lib/tienda'
import { useEffect } from 'react'

export function TiendaTheme({ paleta, fuentes }: { paleta: Paleta; fuentes: Fuentes }) {
    const hojas = fuentes.hojas.join('|')
    useEffect(() => {
        const links = hojas
            .split('|')
            .filter(Boolean)
            .map((href) => {
                const existente = document.head.querySelector<HTMLLinkElement>(
                    `link[data-tienda-fuente="${CSS.escape(href)}"]`
                )
                if (existente) return null
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = href
                link.dataset.tiendaFuente = href
                document.head.appendChild(link)
                return link
            })
        return () => links.forEach((l) => l?.remove())
    }, [hojas])

    // ThemeProvider aplica su clase al montar (sus efectos corren después de los de la página): la de
    // la tienda se aplica en el cuadro siguiente para quedar por encima.
    useEffect(() => {
        const root = document.documentElement
        const teniaOscuro = root.classList.contains('dark')
        const aplicar = () => {
            root.classList.toggle('dark', paleta.oscuro)
            root.classList.toggle('light', !paleta.oscuro)
        }
        aplicar()
        const frame = requestAnimationFrame(aplicar)
        const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        const metaAntes = meta?.content
        if (meta) meta.content = paleta.fondo
        return () => {
            cancelAnimationFrame(frame)
            root.classList.toggle('dark', teniaOscuro)
            root.classList.toggle('light', !teniaOscuro)
            if (meta && metaAntes) meta.content = metaAntes
        }
    }, [paleta.oscuro, paleta.fondo])

    return (
        <style>{`
            :root, .dark {
                --background: ${paleta.fondo};
                --foreground: ${paleta.texto};
                --card: ${paleta.superficie};
                --card-foreground: ${paleta.texto};
                --popover: ${paleta.superficie};
                --popover-foreground: ${paleta.texto};
                --primary: ${paleta.acento};
                --primary-foreground: ${paleta.acentoTexto};
                --secondary: ${paleta.suave};
                --secondary-foreground: ${paleta.texto};
                --muted: ${paleta.suave};
                --muted-foreground: ${paleta.apagado};
                --accent: ${paleta.suave};
                --accent-foreground: ${paleta.texto};
                --border: ${paleta.linea};
                --input: ${paleta.linea};
                --ring: ${paleta.acento};
                --tienda-acento-legible: ${paleta.acentoLegible};
                --tienda-marca: ${paleta.marca};
                --tienda-marca-texto: ${paleta.marcaTexto};
                --tienda-complemento: ${paleta.complemento};
                --tienda-complemento-texto: ${paleta.complementoTexto};
                --tienda-titulos: ${fuentes.titulos};
                --tienda-cuerpo: ${fuentes.cuerpo};
                --tienda-peso-titulos: ${fuentes.pesoTitulos};
            }
            html, body { background-color: ${paleta.fondo}; }
            body, .menu-delivery { font-family: var(--tienda-cuerpo); }
            .tienda-display { font-family: var(--tienda-titulos); font-weight: var(--tienda-peso-titulos); letter-spacing: -0.02em; }
            .tienda-acento { color: var(--tienda-acento-legible); }
            .tienda-fondo-marca { background-color: var(--tienda-marca); color: var(--tienda-marca-texto); }
            .tienda-fondo-complemento {
                background-color: var(--tienda-complemento);
                color: var(--tienda-complemento-texto);
                --muted-foreground: var(--tienda-complemento-texto);
            }
            .tienda-sin-barra { scrollbar-width: none; }
            .tienda-sin-barra::-webkit-scrollbar { display: none; }
            @keyframes tienda-progreso { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        `}</style>
    )
}
