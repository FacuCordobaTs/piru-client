import { useId } from 'react'

/** Un texto que corre alrededor de un círculo, para sellos y etiquetas. Siempre ocupa la vuelta entera. */
export function TextoCircular({ texto, className = '' }: { texto: string; className?: string }) {
    const id = useId()
    return (
        <svg aria-hidden viewBox="0 0 100 100" className={className}>
            <defs>
                <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
            </defs>
            <text fill="currentColor" style={{ fontSize: 9, fontWeight: 700 }}>
                <textPath href={`#${id}`} textLength={236} lengthAdjust="spacing">
                    {texto}
                </textPath>
            </text>
        </svg>
    )
}
