import { useContext } from 'react'
import { AuthContext, type AuthContextType } from '../features/auth/AuthContext'

/**
 * Custom hook to access authentication state and actions.
 * Must be used within an AuthProvider.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth()
 *   
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={login} />
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user?.name || user?.email}!</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Re-export types for convenience
export type { User, Role } from '../types/auth'
