import { Clock } from 'lucide-react'
import type { ReactNode } from 'react'

export const AvisoLocal = ({ tono, children }: { tono: 'cerrado' | 'programar'; children: ReactNode }) => (
    <div
        className={
            tono === 'programar' ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background'
        }
    >
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2.5">
            <Clock className="size-4 shrink-0" />
            <p className="text-center text-[13px] font-semibold">{children}</p>
        </div>
    </div>
)
