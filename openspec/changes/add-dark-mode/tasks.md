# Tasks: Dark Mode Implementation

## Status: ✅ COMPLETE

---

## Phase 1: Infrastructure Setup ✅

### 1.1 Tailwind Configuration
- [x] Updated Tailwind v4 with `@custom-variant dark` in CSS

### 1.2 Anti-Flash Script
- [x] Added inline script to `index.html` to prevent flash of wrong theme

### 1.3 Theme Context
- [x] Created `src/contexts/ThemeContext.tsx`
- [x] Implemented theme state management (light/dark/system)
- [x] Added system preference detection
- [x] Added localStorage persistence

### 1.4 Theme Hook
- [x] Export `useTheme` from ThemeContext

### 1.5 Theme Toggle Component
- [x] Created `src/components/ThemeToggle.tsx`
- [x] Added sun/moon/monitor icons
- [x] Supports three states: light, dark, system

---

## Phase 2: Layout & Navigation ✅

### 2.1 Update Layout.tsx
- [x] Wrapped app with ThemeProvider
- [x] Added ThemeToggle to header
- [x] Updated background colors with dark variants
- [x] Updated text colors with dark variants

### 2.2 Base Styles
- [x] Updated `index.css` with dark mode defaults
- [x] Added smooth transition for theme changes

---

## Phase 3: Dashboard Components ✅

### 3.1 DashboardView
- [x] Updated page background
- [x] Updated grid container

### 3.2 Widget Components
- [x] `NumberWidget.tsx` - dark card, text colors
- [x] `StatWidget.tsx` - dark card, change indicators
- [x] `GaugeWidget.tsx` - dark card, gauge colors
- [x] `ChartWidget.tsx` - dark card, chart theme

### 3.3 DraggableGrid
- [x] Updated drag handle colors
- [x] Updated placeholder colors

---

## Phase 4: Feature Pages ✅

### 4.1 Integrations
- [x] `IntegrationsPage.tsx`
- [x] `IntegrationCard.tsx`
- [x] `ManualDataEntryModal.tsx`

### 4.2 KPIs
- [x] `KpisPage.tsx`
- [x] `KpiCard.tsx`
- [x] `KpiWizard.tsx`

### 4.3 Sharing
- [x] `SharingPage.tsx`
- [x] `ShareLinkCard.tsx`
- [x] `CreateShareModal.tsx`
- [x] `PublicDashboardView.tsx`
- [x] `PublicKpiView.tsx`
- [x] `PublicShareView.tsx`

### 4.4 Auth
- [x] `LoginForm.tsx`
- [x] `RegisterForm.tsx`
- [x] `ProfilePage.tsx`
- [x] `AdminUsersPage.tsx`
- [x] `UserMenu.tsx`

---

## Phase 5: Charts & Visualizations ✅

### 5.1 Chart.js Configuration
- [x] Created `getChartColors(isDark)` function
- [x] Created `getChartOptions(isDark)` function
- [x] Updated grid line colors
- [x] Updated text/label colors
- [x] Updated tooltip styling

### 5.2 Chart Components
- [x] `LineChart.tsx` - theme-aware options
- [x] `BarChart.tsx` - theme-aware options
- [x] `AreaChart.tsx` - theme-aware options
- [x] `GaugeChart.tsx` - dark mode text classes

---

## Phase 6: Polish & Edge Cases ✅

### 6.1 Form Elements
- [x] Input fields (global CSS)
- [x] Select dropdowns
- [x] Buttons with dark focus ring offset
- [x] Checkboxes/toggles (global CSS)

### 6.2 Modals & Overlays
- [x] Modal backgrounds (dark backdrop)
- [x] Dropdown menus (UserMenu)
- [x] Role badges with dark variants

### 6.3 Status Indicators
- [x] Integration status badges
- [x] KPI progress indicators
- [x] Error/success states

### 6.4 Additional Polish
- [x] Custom scrollbar styling
- [x] Selection styling
- [x] Dashboard drag shadow for dark mode
- [x] Fixed TypeScript errors in ManualDataEntryModal
- [ ] Test all pages in light mode
- [ ] Test all pages in dark mode
- [ ] Test system preference switching
- [ ] Test persistence across reload
- [ ] Verify no flash on page load

---

## Definition of Done

- [ ] Theme toggle visible and functional in header
- [ ] All three modes work (light/dark/system)
- [ ] Preference persists in localStorage
- [ ] No flash of incorrect theme on load
- [ ] All pages look good in both modes
- [ ] Charts adapt to theme
- [ ] Smooth transition when switching themes
- [ ] No accessibility issues (contrast ratios)
