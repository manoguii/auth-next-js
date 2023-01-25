interface User {
  permissions: string[]
  roles: string[]
}

interface ValidadeUserPermissionsParams {
  user: User | undefined
  permissions?: string[]
  roles?: string[]
}

export function validadeUserPermissions({
  user,
  permissions,
  roles,
}: ValidadeUserPermissionsParams) {
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
