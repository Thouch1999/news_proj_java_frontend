import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import i18n from '../i18n'
import * as authService from '../services/authService'
import { setUnauthorizedHandler } from '../services/httpClient'
import * as userService from '../services/userService'
import { clearToken, getToken, setRefreshToken, setToken } from '../utils/tokenStorage'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  // while a stored token is being checked against /users/me, guards must wait
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()))

  // the API client calls this when a request with a token gets a 401
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { message: i18n.t('auth.sessionExpired') },
      })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  // load the current user on app start when a token exists
  useEffect(() => {
    if (!getToken()) {
      return undefined
    }
    let active = true
    userService
      .getMe()
      .then((me) => {
        if (active) {
          setUser(me)
        }
      })
      .catch(() => clearToken())
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  // call with the login result ({ token: { access }, user }) once a login step succeeds
  const setSession = useCallback((loginResult) => {
    setToken(loginResult.token.access)
    if (loginResult.token.refresh) {
      setRefreshToken(loginResult.token.refresh)
    }
    setUser(loginResult.user)
    setIsLoading(false)
  }, [])

  // after the profile changes: keep the user in memory in step with the server
  const updateUser = useCallback((nextUser) => setUser(nextUser), [])

  const refreshUser = useCallback(async () => {
    setUser(await userService.getMe())
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // the session is cleared locally even if the server call fails
    }
    clearToken()
    setUser(null)
    navigate(ROUTES.LOGIN, { replace: true })
  }, [navigate])

  const value = useMemo(() => {
    const roles = user ? [user.role] : []
    return {
      user,
      roles,
      emailVerified: user?.emailVerified ?? false,
      isAuthenticated: Boolean(user),
      isLoading,
      hasAnyRole: (allowed) => allowed.some((role) => roles.includes(role)),
      setSession,
      updateUser,
      refreshUser,
      logout,
    }
  }, [user, isLoading, setSession, updateUser, refreshUser, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
