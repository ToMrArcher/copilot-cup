# Change: Add No-Code Integrations System

## Why
Users need to connect external data sources (APIs, manual input) to the platform without writing code. This is a core requirement for the KPI dashboard - without integrations, there's no data to visualize.

The requirements specify:
1. Visual configuration interface for data sources
2. Secure handling of API keys and OAuth tokens
3. Live data preview when mapping fields

## What Changes
- Add integration management UI with wizard-style flow
- Create pluggable adapter architecture for different source types (API, Manual, Webhook)
- Implement secure credential storage (encrypted in database)
- Build field mapping interface with live data preview
- Add integration status tracking and sync logging
- Create backend API endpoints for CRUD operations on integrations

## Impact
- Affected specs: Creates new `integrations` capability
- Affected code:
  - `backend/src/modules/integrations/` - API routes, adapter system, encryption
  - `frontend/src/features/integrations/` - UI components, wizard, field mapper
  - Database: Uses existing `Integration`, `DataField` models from Prisma schema
- Security: Introduces encrypted credential storage pattern
