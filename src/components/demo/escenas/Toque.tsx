import { Pointer } from 'lucide-react'

/** El dedo que toca un botón: la onda se vuelve a disparar en cada vuelta (`vuelta` como `key`). */
export function Toque({ vuelta, claro = true }: { vuelta: number; claro?: boolean }) {
  return (
    <>
      <span
        key={vuelta}
        className={`e-onda pointer-events-none absolute left-1/2 top-1/2 -ml-5 -mt-5 size-10 rounded-full ${claro ? 'bg-white/70' : 'bg-brand/40'}`}
      />
      <Pointer size={22} strokeWidth={2} className="e-pop absolute -bottom-3 right-1 fill-white text-ink drop-shadow" />
    </>
  )
}
