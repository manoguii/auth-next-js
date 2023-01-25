import { AuthContext } from '@/contexts/AuthContext'
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

  if (permissions ? permissions.length > 0 : false) {
    const hasAllPermissions = permissions?.every((permission) => {
      return user?.permissions.includes(permission)
    })

    if (!hasAllPermissions) {
      return false
    }
  }

  if (roles ? roles.length > 0 : false) {
    const hasAllRoles = roles?.some((role) => {
      return user?.roles.includes(role)
    })

    if (!hasAllRoles) {
      return false
    }
  }

  return true
}
