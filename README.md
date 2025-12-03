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

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/ToMrArcher/copilot-cup.git
cd copilot-cup

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
# Health check: http://localhost:4000/health
```

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (in a separate terminal)
cd backend
npm install
npm run dev
```

## Project Structure

```
copilot-cup/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── features/      # Feature modules
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── Dockerfile
├── backend/               # Express API
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── middleware/    # Express middleware
│   │   ├── db/            # Prisma and database
│   │   └── types/         # Shared types
│   └── Dockerfile
├── docker-compose.yml     # Local development stack
└── .env.example           # Environment template
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with service status |

*More endpoints will be added as features are implemented.*

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is private and proprietary.