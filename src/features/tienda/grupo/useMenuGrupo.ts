import { useGrupoConfirmacion } from './useGrupoConfirmacion'
import { useGrupoDatos } from './useGrupoDatos'
import { useGrupoNavegacion } from './useGrupoNavegacion'
import { useGrupoProductos } from './useGrupoProductos'
import { useGrupoState } from './useGrupoState'

export function useMenuGrupo() {
    const grupoState = useGrupoState()
    const grupoNavegacion = useGrupoNavegacion({ ...grupoState })
    const grupoDatos = useGrupoDatos({ ...grupoState })
    const grupoProductos = useGrupoProductos({ ...grupoState })
    const grupoConfirmacion = useGrupoConfirmacion({ ...grupoState, ...grupoNavegacion })
    return { ...grupoState, ...grupoNavegacion, ...grupoDatos, ...grupoProductos, ...grupoConfirmacion }
}
export type MenuGrupoModel = ReturnType<typeof useMenuGrupo>
