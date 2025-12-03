import { useState, useMemo, type FormEvent } from 'react'
import { validateEmail, validatePassword } from '../../types/auth'

interface RegisterFormProps {
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>
  onSwitchToLogin: () => void
  isLoading?: boolean
  error?: string | null
}

export function RegisterForm({ onSubmit, onSwitchToLogin, isLoading, error }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  })

  // Password validation
  const passwordValidation = useMemo(() => validatePassword(password), [password])

  // Strength indicator colors
  const strengthColors = {
    weak: 'bg-red-500',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500',
  }

  const strengthWidth = {
    weak: 'w-1/4',
    fair: 'w-2/4',
    good: 'w-3/4',
    strong: 'w-full',
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    // Validate email
    if (!email.trim()) {
      setLocalError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address')
      return
    }

    // Validate password
    if (!passwordValidation.isValid) {
      setLocalError('Please fix the password requirements')
      return
    }

    // Confirm password match
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    try {
      await onSubmit({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim() || undefined,
      })
    } catch {
      // Error is handled by parent component
    }
  }

  const displayError = localError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name Field (Optional) */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full name <span className="text-gray-400">(optional)</span>
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, name: true }))}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            placeholder="John Doe"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
              touched.email && email && !validateEmail(email) ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
        {touched.email && email && !validateEmail(email) && (
          <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, password: true }))}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Password strength</span>
              <span className={`text-xs font-medium ${
                passwordValidation.strength === 'strong' ? 'text-green-600' :
                passwordValidation.strength === 'good' ? 'text-yellow-600' :
                passwordValidation.strength === 'fair' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${strengthColors[passwordValidation.strength]} ${strengthWidth[passwordValidation.strength]} transition-all duration-300`}
              />
            </div>

            {/* Password Requirements */}
            <div className="mt-2 grid grid-cols-2 gap-1">
              {[
                { label: '8+ characters', met: password.length >= 8 },
                { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
                { label: 'Lowercase letter', met: /[a-z]/.test(password) },
                { label: 'Number', met: /[0-9]/.test(password) },
              ].map((req) => (
                <div key={req.label} className="flex items-center text-xs">
                  {req.met ? (
                    <svg className="w-3.5 h-3.5 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-gray-300 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className={req.met ? 'text-green-600' : 'text-gray-400'}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
          Confirm password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <input
            id="confirm-password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, confirmPassword: true }))}
            className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
              touched.confirmPassword && confirmPassword && password !== confirmPassword
                ? 'border-red-300'
                : 'border-gray-300'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
        {touched.confirmPassword && confirmPassword && password !== confirmPassword && (
          <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
        )}
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{displayError}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </button>

      {/* Switch to Login */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-violet-600 hover:text-violet-500 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  )
}
