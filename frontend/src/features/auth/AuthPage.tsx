import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { useAuth } from '../../hooks/useAuth'
import { Logo } from '../../components/Logo'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const { login, register, isAuthenticated, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the redirect path from location state or default to home
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Clear error when switching modes
  useEffect(() => {
    clearError()
  }, [mode, clearError])

  const handleLogin = async (data: { email: string; password: string }) => {
    await login(data)
    // Navigation is handled by the useEffect above
  }

  const handleRegister = async (data: { email: string; password: string; name?: string }) => {
    await register(data)
    // Navigation is handled by the useEffect above
  }

  // If checking auth status, show loading
  if (isLoading && !error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-violet-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'login'
              ? 'Sign in to access your KPI dashboard'
              : 'Start tracking your business metrics today'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-violet-50/50 dark:bg-violet-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-violet-50/50 dark:bg-violet-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Container */}
          <div className="p-8">
            {mode === 'login' ? (
              <LoginForm
                onSubmit={handleLogin}
                onSwitchToRegister={() => setMode('register')}
                isLoading={isLoading}
                error={error}
              />
            ) : (
              <RegisterForm
                onSubmit={handleRegister}
                onSwitchToLogin={() => setMode('login')}
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-violet-100 dark:border-violet-800">
          <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200 mb-3">What you get with Checkin:</h3>
          <ul className="space-y-2">
            {[
              'Real-time KPI tracking and monitoring',
              'Custom dashboards with drag-and-drop widgets',
              'Integration with your favorite tools',
              'Team sharing and collaboration',
            ].map((feature) => (
              <li key={feature} className="flex items-start text-sm text-violet-700 dark:text-violet-300">
                <svg className="h-5 w-5 text-violet-500 dark:text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
