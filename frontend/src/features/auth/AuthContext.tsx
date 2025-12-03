import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, LoginRequest, RegisterRequest, UpdateProfileRequest } from '../../types/auth'
import { authApi, setOnUnauthorized } from '../../lib/api'

// Auth context type
interface AuthContextType {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  clearError: () => void
  refreshUser: () => Promise<void>
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider props
interface AuthProviderProps {
  children: ReactNode
}

// Auth Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getMe()
        setUser(response.user)
      } catch {
        // Not authenticated, that's fine
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Set up unauthorized handler
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null)
    })

    return () => {
      setOnUnauthorized(null)
    }
  }, [])

  // Login
  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.login(data)
      setUser(response.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Register
  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.register(data)
      setUser(response.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await authApi.logout()
      setUser(null)
    } catch (err) {
      // Even if logout fails on server, clear local state
      setUser(null)
      const message = err instanceof Error ? err.message : 'Logout failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update profile
  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.updateProfile(data)
      setUser(response.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe()
      setUser(response.user)
    } catch {
      setUser(null)
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Export context and type for useAuth hook
export { AuthContext }
export type { AuthContextType }
