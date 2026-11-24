/** `sencilla` es la del plan Inicial: el backend la impone, no se elige. */
export const PLANTILLAS = ['elegante', 'moderna', 'artesanal', 'sencilla'] as const
export type PlantillaId = (typeof PLANTILLAS)[number]

/** El backend sólo elige una clave conocida; nunca envía código o clases para ejecutar. */
export function resolverPlantilla(valor: unknown): PlantillaId {
    return PLANTILLAS.find((id) => id === valor) ?? 'artesanal'
}

export const BASES_PLANTILLA = {
    elegante: {
        fondo: '#f6f1e8',
        texto: '#17130f',
        superficie: '#fdfbf7',
        acento: '#ff5a1f',
        marca: { tinte: 0.1 },
        titulos: 'Bricolage Grotesque',
        cuerpo: 'Bricolage Grotesque',
        peso: 800,
    },
    moderna: {
        fondo: '#f5f7fa',
        texto: '#171d2b',
        superficie: '#ffffff',
        acento: '#315cfd',
        marca: { tinte: 0.16 },
        titulos: 'Unbounded',
        cuerpo: 'Manrope',
        peso: 700,
    },
    artesanal: {
        fondo: '#f4ead8',
        texto: '#392a20',
        superficie: '#fffaf1',
        acento: '#a34b34',
        marca: { tinte: 0.12 },
        titulos: 'Fraunces',
        cuerpo: 'Nunito Sans',
        peso: 700,
    },
    sencilla: {
        fondo: '#ffffff',
        texto: '#1d1d1f',
        superficie: '#ffffff',
        acento: '#1d1d1f',
        marca: { tinte: 0 },
        titulos: 'Inter',
        cuerpo: 'Inter',
        peso: 600,
    },
} satisfies Record<
    PlantillaId,
    {
        fondo: string
        texto: string
        superficie: string
        acento: string
        /** Participación del color de marca en las superficies de apoyo. */
        marca: { tinte: number }
        titulos: string
        cuerpo: string
        peso: number
    }
>
