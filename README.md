# KPI Dashboard Platform

A no-code KPI/dashboard platform designed to be Docker-first and AWS-ready. Build custom dashboards with data from multiple sources without writing code.

## Features

- 🔌 **No-Code Integrations** - Connect data sources through a visual interface
- 📊 **KPI Builder** - Create and configure KPIs with a formula engine
- 📈 **Dashboard Widgets** - Drag-and-drop dashboard customization
- 🔐 **Role-Based Access** - Secure access control per user/team
- 🔗 **Secure Sharing** - Time-limited URLs for external sharing

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Infrastructure**: Docker + Docker Compose

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ (for local development without Docker)

### Quick Start with Docker (Recommended)

This is the easiest way to run the application locally:

```bash
# Clone the repository
git clone https://github.com/ToMrArcher/copilot-cup.git
cd copilot-cup

# Start all services (database, backend, frontend, dummy-server)
docker-compose up --build

# Wait for all services to be healthy (about 30-60 seconds)
# The backend will automatically run database migrations on first start
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health
- Dummy data server: http://localhost:5050

**Seed demo users (optional, run in a new terminal):**
```bash
docker-compose exec backend npx ts-node scripts/seed-users.ts
```

This creates three test users:
| Email | Password | Role |
|-------|----------|------|
| admin@checkin.no | Admin123! | ADMIN |
| editor@checkin.no | Editor123! | EDITOR |
| viewer@checkin.no | Viewer123! | VIEWER |

**Stopping the application:**
```bash
# Stop all services
docker-compose down

# Stop and remove all data (including database)
docker-compose down -v
```

### Local Development (Without Docker)

If you prefer to run services locally:

**1. Start PostgreSQL** (using Docker or local installation):
```bash
# Using Docker for just the database
docker-compose up postgres -d
```

**2. Set up the backend:**
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed demo users
npx ts-node scripts/seed-users.ts

# Start the development server
npm run dev
```

**3. Set up the frontend** (in a new terminal):
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

**4. (Optional) Start the dummy data server:**
```bash
cd dummy-server
npm install
npm start
```

### Environment Variables

For local development without Docker, copy the example environment file:
```bash
cp .env.example .env
```

Key variables:
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/kpi_dashboard` |
| `JWT_SECRET` | Secret for JWT tokens | (required in production) |
| `ENCRYPTION_KEY` | 64-char hex key for encrypting credentials | (required) |
| `VITE_API_URL` | Backend API URL for frontend | `http://localhost:4000` |

### Useful Commands

**Backend:**
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev --name <name>  # Create a new migration
```

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

**Docker:**
```bash
docker-compose up --build      # Build and start all services
docker-compose up -d           # Start in detached mode
docker-compose logs -f         # Follow logs
docker-compose logs backend    # View backend logs only
docker-compose exec backend sh # Shell into backend container
docker-compose down -v         # Stop and remove volumes
```

## Project Structure

```
copilot-cup/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── features/      # Feature modules (auth, dashboard, kpi, integrations)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API client and utilities
│   │   └── types/         # TypeScript types
│   └── Dockerfile
├── backend/               # Express API
│   ├── src/
│   │   ├── modules/       # Feature modules (auth, dashboard, kpi, integrations, sharing)
│   │   ├── middleware/    # Express middleware (auth, error handling)
│   │   ├── services/      # Business logic services
│   │   ├── db/            # Prisma client
│   │   └── tests/         # Test files
│   ├── prisma/            # Database schema and migrations
│   ├── scripts/           # Seed scripts
│   └── Dockerfile
├── dummy-server/          # Mock data server for testing integrations
├── openspec/              # Project specifications and change proposals
├── docker-compose.yml     # Local development stack
└── .env.example           # Environment template
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with service status |
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Login and receive JWT token |
| `/api/auth/me` | GET | Get current user info |
| `/api/integrations` | GET/POST | List or create integrations |
| `/api/integrations/:id` | GET/PUT/DELETE | Manage specific integration |
| `/api/integrations/:id/datafields` | GET | Get data fields from integration |
| `/api/kpis` | GET/POST | List or create KPIs |
| `/api/kpis/:id` | GET/PUT/DELETE | Manage specific KPI |
| `/api/dashboards` | GET/POST | List or create dashboards |
| `/api/dashboards/:id` | GET/PUT/DELETE | Manage specific dashboard |
| `/api/sharing/:type/:id/access` | GET/POST/DELETE | Manage access control |

## Troubleshooting

**Database connection issues:**
```bash
# Check if postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Reset the database completely
docker-compose down -v
docker-compose up --build
```

**Backend not starting:**
```bash
# Check backend logs
docker-compose logs backend

# Manually run migrations
docker-compose exec backend npx prisma migrate deploy
```

**Frontend not loading:**
```bash
# Check if backend is accessible
curl http://localhost:4000/health

# Check frontend logs
docker-compose logs frontend
```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is private and proprietary.