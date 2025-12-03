# Proposal: Authentication System

## Context
User authentication and authorization are required to secure the KPI Dashboard application and control access to dashboards and data.

## Problem Statement
The application needs a secure authentication system with:
- User registration and login
- JWT-based session management
- Role-based access control (RBAC)
- Password security
- Profile management
- Admin user management

## Proposed Solution

### Authentication Flow
1. Users register with email and password
2. Passwords are hashed using bcrypt with 12 salt rounds
3. JWT tokens issued on login (7-day expiration)
4. Tokens stored in HTTP-only cookies for security
5. Token also returned in response for header-based authentication
6. Middleware validates tokens on protected routes

### Role-Based Access Control
Three role levels with hierarchical permissions:
- **VIEWER** (level 1): Read-only access to assigned dashboards
- **EDITOR** (level 2): Create and edit KPIs, dashboards, integrations
- **ADMIN** (level 3): Full access + user management

### Security Features
- Password requirements: min 8 chars, uppercase, lowercase, number
- Email validation
- Passwords hashed with bcrypt (12 rounds)
- HTTP-only cookies prevent XSS attacks
- Generic error messages prevent user enumeration
- JWT tokens with configurable secret and expiration

## API Endpoints

### Public Endpoints
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - Clear session

### Protected Endpoints
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile (name, password)

### Admin-Only Endpoints
- `GET /api/auth/users` - List all users
- `PATCH /api/auth/users/:id/role` - Update user role

## Data Model

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  role         Role     @default(VIEWER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  dashboards   Dashboard[]
  shareLinks   ShareLink[]
}

enum Role {
  ADMIN
  EDITOR
  VIEWER
}
```

## Technical Implementation

### Backend Components

**Services** (`backend/src/services/auth.service.ts`):
- `hashPassword()` - Hash password with bcrypt
- `verifyPassword()` - Verify password against hash
- `generateToken()` - Create JWT with user payload
- `verifyToken()` - Validate and decode JWT
- `hasMinimumRole()` - Check role hierarchy
- `validatePassword()` - Enforce password requirements
- `validateEmail()` - Validate email format
- `toSafeUser()` - Remove sensitive fields

**Middleware** (`backend/src/middleware/auth.middleware.ts`):
- `requireAuth()` - Require valid authentication
- `requireRole()` - Require minimum role level
- `optionalAuth()` - Attach user if authenticated (optional)

**Router** (`backend/src/modules/auth/auth.router.ts`):
- Implements all auth endpoints
- Cookie management
- Input validation
- Error handling

### Frontend Components

**Context** (`frontend/src/features/auth/AuthContext.tsx`):
- Global auth state management
- Login, register, logout actions
- Profile update functionality
- Auto-load user on mount
- Handle unauthorized responses

**Components**:
- `AuthPage.tsx` - Auth page container
- `LoginForm.tsx` - Login form component
- `RegisterForm.tsx` - Registration form component
- `UserMenu.tsx` - User dropdown menu
- `ProfilePage.tsx` - User profile editor
- `AdminUsersPage.tsx` - Admin user management
- `ProtectedRoute.tsx` - Route guard component

**Hook** (`frontend/src/hooks/useAuth.ts`):
- Convenient access to auth context
- Type-safe auth state and actions

## Environment Configuration

Required environment variables:
```env
JWT_SECRET=your-secret-key-change-in-production
ENCRYPTION_KEY=hex-encoded-32-byte-key
```

## Security Considerations

1. **Password Storage**: Bcrypt with 12 salt rounds (OWASP recommended)
2. **Session Management**: HTTP-only cookies prevent XSS
3. **Token Expiration**: 7-day expiration with configurable duration
4. **HTTPS Required**: Cookies marked secure in production
5. **User Enumeration Prevention**: Generic error messages
6. **Role Self-Modification Prevention**: Admins cannot change own role

## Future Enhancements
- Password reset via email
- Two-factor authentication (2FA)
- Session management (view/revoke active sessions)
- OAuth integration (Google, GitHub)
- Account lockout after failed attempts
- Password strength meter in UI
- Remember me functionality

## Dependencies
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/validation
- `cookie-parser` - Cookie handling middleware

## Migration Path
N/A - Initial implementation (already completed)

## Success Criteria
- [x] Users can register and login
- [x] JWT tokens issued and validated
- [x] Role-based access control enforced
- [x] Password security requirements met
- [x] Profile management functional
- [x] Admin user management operational
- [x] Frontend auth flow complete
- [x] Protected routes working
