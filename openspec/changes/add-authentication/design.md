# Design: Authentication System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AuthContext (Global State)                          │  │
│  │  - user, isAuthenticated, isLoading                  │  │
│  │  - login(), register(), logout()                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌────────────┬──────────┴────────┬────────────┐          │
│  │  Login     │  Register         │  Profile   │          │
│  │  Form      │  Form             │  Page      │          │
│  └────────────┴───────────────────┴────────────┘          │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  API Client (lib/api.ts)                              │ │
│  │  - Cookie-based auth                                  │ │
│  │  - Bearer token fallback                              │ │
│  │  - Unauthorized handler                               │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            │ JWT in Cookie or Header
┌───────────────────────────▼─────────────────────────────────┐
│                         Backend                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Auth Middleware                                     │   │
│  │  - Extract token from cookie/header                 │   │
│  │  - Verify JWT signature                             │   │
│  │  - Load user from database                          │   │
│  │  - Attach user to req.user                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  Auth Router (Express)                                │ │
│  │  POST /auth/register                                  │ │
│  │  POST /auth/login                                     │ │
│  │  POST /auth/logout                                    │ │
│  │  GET  /auth/me                                        │ │
│  │  PATCH /auth/me                                       │ │
│  │  GET  /auth/users (admin)                            │ │
│  │  PATCH /auth/users/:id/role (admin)                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  Auth Service                                         │ │
│  │  - hashPassword() - bcrypt with 12 rounds            │ │
│  │  - verifyPassword() - compare hash                   │ │
│  │  - generateToken() - create JWT                      │ │
│  │  - verifyToken() - validate JWT                      │ │
│  │  - validatePassword() - enforce rules                │ │
│  │  - hasMinimumRole() - check permissions              │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  Database (PostgreSQL via Prisma)                    │ │
│  │  User table: id, email, passwordHash, name, role     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. User Model (Database)

**Table**: `User`

| Field        | Type     | Constraints                    | Description                    |
|-------------|----------|--------------------------------|--------------------------------|
| id          | String   | PK, CUID                       | Unique identifier              |
| email       | String   | UNIQUE, NOT NULL               | User's email (lowercase)       |
| passwordHash| String   | NOT NULL                       | Bcrypt hash of password        |
| name        | String?  | OPTIONAL                       | User's display name            |
| role        | Role     | DEFAULT VIEWER                 | Access level                   |
| createdAt   | DateTime | DEFAULT now()                  | Account creation timestamp     |
| updatedAt   | DateTime | AUTO-UPDATE                    | Last update timestamp          |

**Enum**: `Role`
- `ADMIN` - Full system access
- `EDITOR` - Create/edit content
- `VIEWER` - Read-only access

### 2. JWT Token Structure

**Payload**:
```typescript
{
  userId: string    // User's database ID
  email: string     // User's email
  role: Role        // User's current role
  iat: number       // Issued at (timestamp)
  exp: number       // Expires at (timestamp)
}
```

**Configuration**:
- Algorithm: HS256 (HMAC with SHA-256)
- Expiration: 7 days (604800 seconds)
- Secret: Configurable via `JWT_SECRET` env var

### 3. Cookie Configuration

```javascript
{
  httpOnly: true,           // Prevent XSS access
  secure: production,       // HTTPS only in production
  sameSite: 'lax',         // CSRF protection
  maxAge: 7 days,          // Match JWT expiration
  path: '/',               // Available site-wide
}
```

### 4. Password Requirements

**Validation Rules**:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)

**Hashing**:
- Algorithm: bcrypt
- Salt rounds: 12
- Automatic salt generation

### 5. API Request/Response Formats

#### Register
```typescript
// Request
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"  // optional
}

// Response (201 Created)
{
  "message": "Account created successfully",
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "VIEWER",
    "createdAt": "2023-12-03T10:00:00Z",
    "updatedAt": "2023-12-03T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```typescript
// Request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

// Response (200 OK)
{
  "message": "Login successful",
  "user": { /* same as register */ },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User
```typescript
// Request
GET /api/auth/me
Headers: Cookie: auth_token=<jwt>

// Response (200 OK)
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "VIEWER",
    "createdAt": "2023-12-03T10:00:00Z",
    "updatedAt": "2023-12-03T10:00:00Z"
  }
}
```

#### Update Profile
```typescript
// Request
PATCH /api/auth/me
Headers: Cookie: auth_token=<jwt>
{
  "name": "Jane Doe",
  "currentPassword": "SecurePass123",  // required for password change
  "newPassword": "NewSecurePass456"    // optional
}

// Response (200 OK)
{
  "message": "Profile updated successfully",
  "user": { /* updated user */ }
}
```

#### List Users (Admin)
```typescript
// Request
GET /api/auth/users
Headers: Cookie: auth_token=<jwt>  // Must be ADMIN

// Response (200 OK)
{
  "users": [
    {
      "id": "clxxx...",
      "email": "user1@example.com",
      "name": "User One",
      "role": "EDITOR",
      "createdAt": "2023-12-01T10:00:00Z",
      "updatedAt": "2023-12-01T10:00:00Z"
    },
    // ...more users
  ]
}
```

#### Update User Role (Admin)
```typescript
// Request
PATCH /api/auth/users/:id/role
Headers: Cookie: auth_token=<jwt>  // Must be ADMIN
{
  "role": "EDITOR"
}

// Response (200 OK)
{
  "message": "Role updated successfully",
  "user": { /* updated user */ }
}
```

### 6. Error Responses

**Standard Error Format**:
```typescript
{
  "error": "Error message here"
}
```

**Common Errors**:
- `400 Bad Request` - Validation errors, missing fields
- `401 Unauthorized` - Invalid credentials, expired token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server-side errors

### 7. Middleware Flow

#### requireAuth Middleware
```
1. Extract token from:
   a. Cookie: auth_token
   b. Header: Authorization: Bearer <token>
2. Verify token with JWT secret
3. If invalid/expired → 401 Unauthorized
4. Fetch user from database by userId
5. If user not found → 401 Unauthorized
6. Attach user to req.user
7. Attach payload to req.token
8. Call next()
```

#### requireRole Middleware
```
1. Check if req.user exists
2. If not → 401 Unauthorized
3. Compare user.role with required role using hierarchy
4. If insufficient → 403 Forbidden with details
5. Call next()
```

#### optionalAuth Middleware
```
1. Try to extract and verify token
2. If valid → attach user to req.user
3. Always call next() (no errors thrown)
```

### 8. Frontend State Management

**AuthContext State**:
```typescript
{
  user: User | null           // Current user or null
  isAuthenticated: boolean    // Derived from user !== null
  isLoading: boolean         // Loading state for async ops
  error: string | null       // Last error message
}
```

**AuthContext Actions**:
- `login(email, password)` - Authenticate user
- `register(email, password, name?)` - Create account
- `logout()` - Clear session
- `updateProfile(data)` - Update user profile
- `refreshUser()` - Reload current user
- `clearError()` - Clear error message

**Initialization Flow**:
1. On mount, call `GET /api/auth/me`
2. If successful → set user state
3. If failed (401) → user remains null
4. Set isLoading to false

**Unauthorized Handler**:
- API client detects 401 responses
- Calls registered unauthorized callback
- AuthContext clears user state
- User redirected to login

### 9. Protected Routes

**Implementation**:
```tsx
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

**Logic**:
1. Check `isAuthenticated` from AuthContext
2. If true → render children
3. If false and not loading → redirect to /auth
4. If loading → show loading spinner

**Role-Based Protection**:
```tsx
<ProtectedRoute requiredRole="ADMIN">
  <AdminUsersPage />
</ProtectedRoute>
```

### 10. Security Best Practices

**Implemented**:
- ✅ Passwords never sent in responses
- ✅ HTTP-only cookies prevent XSS
- ✅ bcrypt with high salt rounds (12)
- ✅ Generic error messages prevent enumeration
- ✅ Email normalized to lowercase
- ✅ Password validation enforced
- ✅ JWT expiration configured
- ✅ Secure flag on cookies in production
- ✅ SameSite cookie attribute
- ✅ User data fetched fresh on each request
- ✅ Admins cannot modify own role

**Recommended for Production**:
- [ ] HTTPS enforcement (load balancer/reverse proxy)
- [ ] Rate limiting on auth endpoints
- [ ] CORS configuration
- [ ] CSP headers
- [ ] Account lockout after failed attempts
- [ ] Password reset flow
- [ ] Email verification
- [ ] Audit logging

## File Structure

```
backend/
  src/
    modules/
      auth/
        auth.router.ts          # Auth API endpoints
        index.ts                # Module exports
    services/
      auth.service.ts           # Auth business logic
      crypto.service.ts         # Encryption utilities
    middleware/
      auth.middleware.ts        # Auth middleware
    types/
      # Auth types defined in services/middleware

frontend/
  src/
    features/
      auth/
        AuthContext.tsx         # Global auth state
        AuthPage.tsx           # Auth page container
        LoginForm.tsx          # Login form
        RegisterForm.tsx       # Registration form
        UserMenu.tsx           # User dropdown
        ProfilePage.tsx        # Profile editor
        AdminUsersPage.tsx     # Admin user management
        ProtectedRoute.tsx     # Route guard
        index.ts               # Module exports
    hooks/
      useAuth.ts               # Auth hook
    types/
      auth.ts                  # Auth TypeScript types
    lib/
      api.ts                   # API client with auth

database/
  prisma/
    schema.prisma             # User model definition
    migrations/
      20251203123228_add_password_hash/
```

## Dependencies

**Backend**:
- `bcryptjs@^2.4.3` - Password hashing
- `jsonwebtoken@^9.0.2` - JWT handling
- `cookie-parser@^1.4.6` - Cookie middleware
- `@prisma/client` - Database ORM
- `express` - Web framework

**Frontend**:
- `react@^18.3.1` - UI framework
- `react-router-dom@^7.0.2` - Routing
- Native `fetch` API - HTTP requests

## Environment Variables

**Backend** (`.env`):
```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/kpi_dashboard
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Optional
NODE_ENV=development                    # development | production
ENCRYPTION_KEY=hex-encoded-32-byte-key  # For integration configs
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

## Testing Considerations

**Unit Tests Needed**:
- `auth.service.ts` - Password hashing, JWT generation/verification
- `crypto.service.ts` - Encryption/decryption
- Password validation logic
- Email validation logic
- Role hierarchy checks

**Integration Tests Needed**:
- Registration flow (success, duplicate email)
- Login flow (success, invalid credentials)
- Protected endpoint access (with/without token)
- Role-based access control
- Token expiration handling
- Profile update (name, password)
- Admin user management

**E2E Tests Needed**:
- Complete registration → login → access protected route
- Login → logout → verify session cleared
- Admin user role management
- Password change flow
