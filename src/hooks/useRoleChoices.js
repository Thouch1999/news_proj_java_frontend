import { useEffect, useState } from 'react'
import { ROLE_ORDER } from '../constants/roles'
import * as roleService from '../services/roleService'

// The roles an admin can give to a new account: the ones of the roles endpoint, in the order of ROLE_ORDER (Admin, Editor,
// Author, Reader). The four known roles show at once and stay if the request fails or answers with none of them.
export function useRoleChoices() {
  const [roles, setRoles] = useState(ROLE_ORDER)

  useEffect(() => {
    let current = true
    roleService
      .listRoles()
      .then((list) => {
        const names = new Set((list ?? []).map((role) => role.name))
        const known = ROLE_ORDER.filter((role) => names.has(role))
        if (current && known.length > 0) setRoles(known)
      })
      .catch(() => {
        // the four known roles stay
      })
    return () => {
      current = false
    }
  }, [])

  return roles
}
