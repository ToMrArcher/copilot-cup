# Tasks: Authentication System

## Status: ✅ COMPLETED

All tasks for the authentication system have been implemented.

---

## Backend Implementation

### Database Schema
- [x] Add `User` model to Prisma schema
- [x] Add `Role` enum (ADMIN, EDITOR, VIEWER)
- [x] Add `passwordHash` field to User model
- [x] Create and run migration

### Auth Service
- [x] Implement `hashPassword()` using bcrypt
- [x] Implement `verifyPassword()` for authentication
- [x] Implement `generateToken()` for JWT creation
- [x] Implement `verifyToken()` for JWT validation
- [x] Implement `hasMinimumRole()` for permission checks
- [x] Implement `validatePassword()` for password rules
- [x] Implement `validateEmail()` for email validation
- [x] Implement `toSafeUser()` to remove sensitive fields

### Crypto Service
- [x] Implement AES-256-GCM encryption
- [x] Implement decryption with auth tag verification
- [x] Add JSON encryption helpers
- [x] Add encryption key generation utility
- [x] Add sensitive value masking
- [x] Write unit tests for crypto service

### Auth Middleware
- [x] Implement `requireAuth()` middleware
- [x] Add token extraction from cookies
- [x] Add token extraction from Authorization header
- [x] Add user loading from database
- [x] Implement `requireRole()` middleware factory
- [x] Implement `optionalAuth()` middleware
- [x] Extend Express Request type with user/token

### Auth Router
- [x] Implement `POST /auth/register` endpoint
- [x] Implement `POST /auth/login` endpoint
- [x] Implement `POST /auth/logout` endpoint
- [x] Implement `GET /auth/me` endpoint
- [x] Implement `PATCH /auth/me` endpoint
- [x] Implement `GET /auth/users` endpoint (admin only)
- [x] Implement `PATCH /auth/users/:id/role` endpoint (admin only)
- [x] Add cookie configuration
- [x] Add input validation
- [x] Add error handling
- [x] Prevent admin self-role-change

### Integration
- [x] Add `cookie-parser` middleware to Express app
- [x] Add auth router to main app
- [x] Install dependencies (bcryptjs, jsonwebtoken, cookie-parser)
- [x] Configure JWT_SECRET in environment
- [x] Update seed scripts with password hashes

---

## Frontend Implementation

### Types
- [x] Define `User` interface
- [x] Define `Role` type
- [x] Define auth request types (Login, Register, UpdateProfile)
- [x] Define auth response types
- [x] Add password validation function

### API Client
- [x] Add auth API methods to `lib/api.ts`
- [x] Implement `register()` API call
- [x] Implement `login()` API call
- [x] Implement `logout()` API call
- [x] Implement `getMe()` API call
- [x] Implement `updateProfile()` API call
- [x] Implement `listUsers()` API call (admin)
- [x] Implement `updateUserRole()` API call (admin)
- [x] Add unauthorized callback handler
- [x] Configure cookie credentials

### Auth Context
- [x] Create `AuthContext` with state and actions
- [x] Implement `AuthProvider` component
- [x] Add auto-load user on mount
- [x] Implement `login()` action
- [x] Implement `register()` action
- [x] Implement `logout()` action
- [x] Implement `updateProfile()` action
- [x] Implement `refreshUser()` action
- [x] Add loading and error state management
- [x] Set up unauthorized handler

### Auth Hook
- [x] Create `useAuth()` hook
- [x] Add context validation
- [x] Export auth types

### Auth Components
- [x] Create `AuthPage.tsx` container
- [x] Create `LoginForm.tsx` component
- [x] Create `RegisterForm.tsx` component
- [x] Add form validation
- [x] Add error display
- [x] Add loading states
- [x] Create `UserMenu.tsx` component
- [x] Add role badge display
- [x] Add logout functionality

### Protected Routes
- [x] Create `ProtectedRoute.tsx` component
- [x] Add authentication check
- [x] Add redirect to login
- [x] Add loading state handling
- [x] Add optional role-based protection

### Profile Management
- [x] Create `ProfilePage.tsx`
- [x] Add name update form
- [x] Add password change form
- [x] Add current password verification
- [x] Add success/error feedback

### Admin Features
- [x] Create `AdminUsersPage.tsx`
- [x] Add user list display
- [x] Add role badge display
- [x] Add role change dropdown
- [x] Add admin-only access protection
- [x] Prevent self-role-modification

### Routing Integration
- [x] Wrap app with `AuthProvider`
- [x] Add `/auth` route for login/register
- [x] Protect dashboard routes
- [x] Protect admin routes
- [x] Add user menu to layout

### Styling
- [x] Style auth forms
- [x] Style user menu dropdown
- [x] Style profile page
- [x] Style admin users page
- [x] Add role badges with colors
- [x] Add responsive design

---

## Testing

### Backend Tests
- [x] Unit tests for `crypto.service.ts`
- [x] Unit tests for `auth.service.ts`
- [ ] Integration tests for auth endpoints
- [ ] Test role-based access control
- [ ] Test token expiration
- [ ] Test password validation
- [ ] Test error responses

### Frontend Tests
- [ ] Unit tests for password validation
- [ ] Integration tests for auth forms
- [ ] Test protected route behavior
- [ ] Test auth context state management
- [ ] Test unauthorized handling

---

## Documentation

- [x] Create OpenSpec proposal
- [x] Create OpenSpec design document
- [x] Create OpenSpec tasks list
- [ ] Add API documentation
- [ ] Add inline code comments
- [ ] Update main README with auth info

---

## Deployment

- [ ] Generate production JWT_SECRET
- [ ] Generate production ENCRYPTION_KEY
- [ ] Configure environment variables
- [ ] Test HTTPS cookie behavior
- [ ] Verify CORS configuration
- [ ] Add rate limiting to auth endpoints
- [ ] Set up monitoring for failed login attempts

---

## Future Enhancements

- [ ] Password reset via email
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] OAuth integration (Google, GitHub)
- [ ] Session management UI
- [ ] Account lockout after failed attempts
- [ ] Remember me functionality
- [ ] Password strength meter
- [ ] Audit log for admin actions

---

## Notes

- Default role for new users is `VIEWER`
- JWT tokens expire after 7 days
- Passwords require: 8+ chars, uppercase, lowercase, number
- Admins cannot change their own role (safety feature)
- Tokens work in both cookies and Authorization headers
- User data fetched fresh on each authenticated request
