import type { Turno } from '@/lib/tienda'

export function checkIsOpen(
    horarios: Turno[],
    now = new Date()
): { abierto: boolean; proximaApertura: string | null } {
    if (!horarios || horarios.length === 0) return { abierto: true, proximaApertura: null }

    const diaHoy = now.getDay() // 0=Dom
    const diaAyer = (diaHoy + 6) % 7
    const hhmm = now.getHours() * 60 + now.getMinutes()

    for (const h of horarios) {
        const apertura = parseInt(h.horaApertura.split(':')[0]) * 60 + parseInt(h.horaApertura.split(':')[1])
        const cierre = parseInt(h.horaCierre.split(':')[0]) * 60 + parseInt(h.horaCierre.split(':')[1])

        if (cierre > apertura) {
            if (h.diaSemana === diaHoy && hhmm >= apertura && hhmm < cierre) {
                return { abierto: true, proximaApertura: null }
            }
        } else {
            // Cruza medianoche: ej 20:00-02:00
            // Parte nocturna (mismo día del turno, después de apertura)
            if (h.diaSemana === diaHoy && hhmm >= apertura) {
                return { abierto: true, proximaApertura: null }
            }
            // Parte madrugada (día siguiente al turno, antes de cierre)
            if (h.diaSemana === diaAyer && hhmm < cierre) {
                return { abierto: true, proximaApertura: null }
            }
        }
    }

    // Encontrar la próxima apertura
    const DIAS_NOMBRE = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    let mejor: { minutos: number; texto: string } | null = null

    for (const h of horarios) {
        const apertura = parseInt(h.horaApertura.split(':')[0]) * 60 + parseInt(h.horaApertura.split(':')[1])
        const diasHasta = (h.diaSemana - diaHoy + 7) % 7
        let minutosHasta = diasHasta * 1440 + (apertura - hhmm)
        if (minutosHasta <= 0) minutosHasta += 7 * 1440

        if (!mejor || minutosHasta < mejor.minutos) {
            const esHoy = diasHasta === 0 && apertura > hhmm
            mejor = {
                minutos: minutosHasta,
                texto: esHoy
                    ? `hoy a las ${h.horaApertura.slice(0, 5)}`
                    : `${DIAS_NOMBRE[h.diaSemana]} ${h.horaApertura.slice(0, 5)}`,
            }
        }
    }

    return { abierto: false, proximaApertura: mejor?.texto || null }
}
