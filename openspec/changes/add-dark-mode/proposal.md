# Change: Add Dark Mode Support

## Status: ⏳ PENDING APPROVAL

## Why
Dark mode is essential for:
1. **User comfort** - Reduces eye strain in low-light environments
2. **Modern expectations** - Users expect dark mode in 2025
3. **Visual quality** - Part of the "Visuell kvalitet" requirement
4. **Accessibility** - Some users prefer or need dark interfaces

## What Changes
- Add theme toggle (light/dark/system) to the UI
- Implement CSS custom properties for theming
- Update all components to use theme-aware colors
- Persist user preference in localStorage
- Respect system preference by default

## Impact
- **Affected code:**
  - `frontend/src/index.css` - CSS custom properties for themes
  - `frontend/src/App.tsx` - Theme provider context
  - `frontend/src/components/Layout.tsx` - Theme toggle in header
  - All component files - Update hardcoded colors to use CSS variables
- **No backend changes required**
- **No database changes required**

## Approach
Use Tailwind's built-in dark mode with `class` strategy, allowing:
- Manual toggle override
- System preference detection
- Smooth transitions between themes

## Acceptance Criteria
- [ ] Theme toggle visible in header/navbar
- [ ] Three options: Light, Dark, System
- [ ] Preference persists across page reloads
- [ ] All pages render correctly in both modes
- [ ] Charts adapt to dark mode colors
- [ ] No flash of wrong theme on page load
