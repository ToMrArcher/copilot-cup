# Proposal: UI Branding - Checkin.no Style

## Problem Statement
The current UI uses generic styling. We need to apply Checkin.no branding including logo, favicon, colors, and overall visual style to match the corporate identity.

## Solution
Apply Checkin.no branding across the application:

1. **Logo & Favicon** - Add Checkin logo to header and favicon
2. **Color Scheme** - Purple/violet primary color (#6B46C1 or similar)
3. **Typography** - Clean, modern font styling
4. **Layout** - Professional header with logo, clean navigation
5. **Components** - Update buttons, cards, and widgets to match style

## Checkin.no Design Elements

### Colors (observed from website)
- **Primary Purple**: ~#7C3AED (violet-600)
- **Dark Purple**: ~#5B21B6 (violet-700)
- **Light Purple**: ~#EDE9FE (violet-100)
- **White backgrounds** with subtle shadows
- **Gray text**: #6B7280 for secondary text

### Style Characteristics
- Clean, minimal design
- White cards with subtle shadows
- Rounded corners (not too sharp)
- Purple accent buttons
- Professional, trustworthy feel

## Phases

### Phase 1: Assets & Basic Branding
- [ ] Download/create Checkin logo (SVG)
- [ ] Create favicon
- [ ] Update index.html title
- [ ] Add logo to header

### Phase 2: Color Scheme
- [ ] Update Tailwind config with brand colors
- [ ] Update primary buttons to purple
- [ ] Update active nav states
- [ ] Update accent colors throughout

### Phase 3: Layout & Components
- [ ] Redesign header/navigation
- [ ] Update card styling
- [ ] Update widget styling
- [ ] Improve empty states

## Files to Modify
- `frontend/public/favicon.ico`
- `frontend/index.html`
- `frontend/src/assets/` (add logo)
- `frontend/src/components/Layout.tsx`
- `frontend/tailwind.config.js` or `index.css`
- Widget and card components

## Estimated Effort
- Phase 1: 15 min
- Phase 2: 20 min
- Phase 3: 30 min
- **Total: ~1 hour**
