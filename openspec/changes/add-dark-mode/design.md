# Design: Dark Mode Implementation

## Technical Approach

### 1. Tailwind Dark Mode Strategy

Use Tailwind's `class` strategy (not `media`) to allow manual override:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  // ...
}
```

### 2. Theme Context

Create a React context to manage theme state:

```tsx
// ThemeContext.tsx
type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}
```

### 3. Color Palette

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `bg-gray-50` | `bg-gray-900` |
| Card/Surface | `bg-white` | `bg-gray-800` |
| Primary Text | `text-gray-900` | `text-gray-100` |
| Secondary Text | `text-gray-500` | `text-gray-400` |
| Border | `border-gray-200` | `border-gray-700` |
| Brand/Accent | `violet-600` | `violet-500` |
| Success | `green-600` | `green-500` |
| Error | `red-600` | `red-500` |
| Warning | `yellow-600` | `yellow-500` |

### 4. Implementation Pattern

Update components to use dark mode variants:

```tsx
// Before
<div className="bg-white border-gray-200 text-gray-900">

// After
<div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
```

### 5. Chart.js Dark Mode

Update chart configuration to detect theme:

```tsx
const chartColors = {
  light: {
    grid: 'rgba(0, 0, 0, 0.1)',
    text: '#374151',
    background: '#ffffff',
  },
  dark: {
    grid: 'rgba(255, 255, 255, 0.1)',
    text: '#e5e7eb',
    background: '#1f2937',
  },
}
```

### 6. Persistence Strategy

```tsx
// On mount
const stored = localStorage.getItem('theme')
const system = window.matchMedia('(prefers-color-scheme: dark)').matches

// Apply class to <html>
document.documentElement.classList.toggle('dark', isDark)
```

### 7. Prevent Flash of Wrong Theme

Add inline script in `index.html` before React loads:

```html
<script>
  (function() {
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (!theme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

## File Changes

| File | Change |
|------|--------|
| `tailwind.config.js` | Add `darkMode: 'class'` |
| `index.html` | Add anti-flash script |
| `src/contexts/ThemeContext.tsx` | NEW: Theme provider |
| `src/hooks/useTheme.ts` | NEW: Theme hook |
| `src/components/ThemeToggle.tsx` | NEW: Toggle component |
| `src/components/Layout.tsx` | Add ThemeToggle to header |
| `src/index.css` | Add dark mode base styles |
| `src/lib/chartConfig.ts` | Theme-aware chart colors |
| All components | Add `dark:` variants |

## Components to Update

### High Priority (visible on every page)
1. `Layout.tsx` - Main layout wrapper
2. `Sidebar/Navigation` - If exists
3. `Cards` - Dashboard widgets

### Medium Priority (feature pages)
4. `IntegrationCard.tsx`
5. `KpiCard.tsx`
6. `DashboardView.tsx`
7. Widget components (NumberWidget, StatWidget, etc.)

### Low Priority (modals, forms)
8. Modal components
9. Form inputs
10. Dropdown menus

## Migration Strategy

1. **Phase 1**: Setup infrastructure (context, toggle, tailwind config)
2. **Phase 2**: Update Layout and navigation
3. **Phase 3**: Update dashboard and widget components
4. **Phase 4**: Update feature pages (KPIs, Integrations, Sharing)
5. **Phase 5**: Update charts and visualizations
6. **Phase 6**: Polish and edge cases
