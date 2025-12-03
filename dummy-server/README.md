# Dummy Data Server

A mock API server for testing the KPI Dashboard integrations feature.

## Endpoints

| Endpoint | Description | Example Response Fields |
|----------|-------------|------------------------|
| `GET /api/sales` | Sales data | `product`, `revenue`, `units`, `date`, `region` |
| `GET /api/customers` | Customer metrics | `metric`, `value`, `change`, `period` |
| `GET /api/financial` | Financial KPIs | `name`, `value`, `currency`, `target` |
| `GET /api/employees` | Employee stats | `department`, `headcount`, `avgSalary`, `satisfaction` |

## Query Parameters

- `/api/sales?region=North` - Filter by region
- `/api/sales?limit=3` - Limit results
- `/api/customers?period=daily` - Filter by period
- `/api/employees?department=Engineering` - Filter by department

## Authentication

The server supports Bearer token authentication (disabled by default).

- **Test Token**: `test-token-123`
- **Header**: `Authorization: Bearer test-token-123`

To enable auth requirement, set `REQUIRE_AUTH=true` in environment.

## Usage in Integration Wizard

1. Go to **Integrations** → **Add Integration**
2. Select **REST API**
3. Enter URL: `http://localhost:5000/api/sales` (or any endpoint)
4. Method: `GET`
5. Auth Type: `None` (or `Bearer Token` with `test-token-123`)
6. Click **Discover Fields** to fetch available fields
7. Map the fields you want to import
8. Complete the wizard

## Running Locally

```bash
cd dummy-server
npm install
npm start
```

Server runs on http://localhost:5000

## Docker

Included in `docker-compose.yml` - runs automatically with other services.
