// Placeholder for auth module
// This module will handle authentication and authorization

export interface User {
  id: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: Date
  updatedAt: Date
}
