/**
 * Metadatos que el Worker de subdominios escribe en el HTML de cada tienda propia: título, vista
 * previa al compartir el link (WhatsApp, Instagram, etc.) e ícono. Los crawlers no ejecutan JS, por
 * eso esto no vive en el componente React. Sólo datos: lo importa el Worker de `web/cloudflare/`.
 * Las rutas son de `web/public/`.
 */
export interface StoreSiteMeta {
    title: string
    description: string
    /** Imagen 1200×630 para la vista previa del link. */
    image: string
    icon: string
    appleTouchIcon?: string
    themeColor?: string
}

export const storeSiteMeta: Record<string, StoreSiteMeta> = {
    burgers10: {
        title: 'Burgers 10 · Hamburguesas a la parrilla',
        description:
            'Carne al fuego, pan del día y papas hechas en casa. Pedí online y retirá o recibí en tu puerta.',
        image: '/sites/burgers10/og.jpg',
        icon: '/sites/burgers10/icon.png',
        appleTouchIcon: '/sites/burgers10/apple-touch-icon.png',
        themeColor: '#161310',
    },
}
