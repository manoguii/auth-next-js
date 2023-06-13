import { AuthContext } from '@/contexts/AuthContext'
import { validadeUserPermissions } from '@/utils/validadeUserPermissions'
import { useContext } from 'react'

interface UseCanParams {
  permissions?: string[]
  roles?: string[]
}

export function useCan({ roles, permissions }: UseCanParams) {
  const { isAuthenticated, user } = useContext(AuthContext)

  if (!isAuthenticated) {
    return false
  }

  const userHasValidatePermissions = validadeUserPermissions({
    user,
    permissions,
    roles,
  })

  return userHasValidatePermissions
}
