import { createContext } from 'react'

// Shape: { user, roles, emailVerified, isAuthenticated, isLoading, hasAnyRole, setSession, updateUser, refreshUser, logout }
export const AuthContext = createContext(null)
