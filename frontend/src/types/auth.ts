// User roles
export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER'

// User object returned from API (without password)
export interface User {
  id: string
  email: string
  name: string | null
  role: Role
  createdAt: string
  updatedAt: string
}

// Authentication state
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Login request
export interface LoginRequest {
  email: string
  password: string
}

// Login response
export interface LoginResponse {
  message: string
  user: User
  token: string
}

// Register request
export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

// Register response
export interface RegisterResponse {
  message: string
  user: User
  token: string
}

// Update profile request
export interface UpdateProfileRequest {
  name?: string
  currentPassword?: string
  newPassword?: string
}

// Update profile response
export interface UpdateProfileResponse {
  message: string
  user: User
}

// Get me response
export interface GetMeResponse {
  user: User
}

// Error response
export interface AuthErrorResponse {
  error: string
}

// List users response (admin only)
export interface ListUsersResponse {
  users: User[]
}

// Update role request
export interface UpdateRoleRequest {
  role: Role
}

// Update role response
export interface UpdateRoleResponse {
  message: string
  user: User
}

// Password validation result
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong'
}

// Validate password on client side
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('At least 8 characters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('One number')
  }
  
  // Calculate strength
  let strength: PasswordValidation['strength'] = 'weak'
  const passedChecks = 4 - errors.length
  
  if (passedChecks >= 4 && password.length >= 12) {
    strength = 'strong'
  } else if (passedChecks >= 4) {
    strength = 'good'
  } else if (passedChecks >= 2) {
    strength = 'fair'
  }
  
  // Check for special characters for extra strength
  if (errors.length === 0 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength = 'strong'
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

// Validate email on client side
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
