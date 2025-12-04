# Proposal: Add Drop-Through Rate KPI via Xledger

## Overview
Add Net Profit data to the Xledger mock server to enable the Drop-Through Rate KPI calculation.

## What is Drop-Through Rate?
**Definition**: The percentage of revenue that "drops through" to the bottom line (net profit).
- **Formula**: `(Net Profit / Revenue) × 100`
- **Purpose**: Measures operational efficiency - how much of each revenue dollar becomes profit
- **Target**: Varies by industry, typically 10-20% for SaaS

## Current State
The Xledger mock has:
- ✅ Revenue
- ✅ EBITDA
- ✅ Operating Income
- ✅ Gross Profit
- ❌ Net Profit (missing)

## Required Changes

### 1. Extend Financial Data Model
Add `netProfit` to each year's data:
- `netProfit = operatingIncome - interest - taxes`

### 2. Add NET_PROFIT Account Type
Add support for `NET_PROFIT` in the GraphQL schema and resolvers.

### 3. No Schema Changes Needed
The existing `financialSummary` query with `accountType: "NET_PROFIT"` pattern will work.

## Scope
- **Backend**: Xledger mock server only
- **Frontend**: No changes needed
- **Integration Setup**: Manual via UI (same as Rule of 40)
