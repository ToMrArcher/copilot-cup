# Proposal: Add Image Widget to Dashboards

## Change ID
`add-image-widget`

## Summary
Add a new "Image" widget type that allows users to display pictures on their dashboards. Images can be added via URL or file upload, with support for logos, branding, decorative elements, or informational graphics.

## Motivation
Dashboards often need visual elements beyond data visualizations:
- **Company branding**: Logos and brand imagery
- **Context**: Product images, team photos, or location maps
- **Visual hierarchy**: Decorative separators or headers
- **Documentation**: Process diagrams, org charts, or reference images

Currently, the widget picker only supports KPI-based widgets (number, stat, gauge, charts). Adding an image widget provides flexibility for users to create more professional and visually appealing dashboards.

## Requirements Addressed
- "Når jeg vil endre rekkefølge eller oppsett, vil jeg kunne dra-og-slippe widgets" - Images are widgets too
- "Visuell kvalitet: Smarte defaults, konsekvent typografi, ren grid-oppbygning" - Images enhance visual quality
- No-code approach: Users can add images without developer assistance

## Scope

### In Scope
1. **New widget type**: `image` added to WidgetType enum
2. **Widget picker**: New "Image" option in the widget type selection
3. **Image configuration**: URL input with preview, alt text, and object-fit options
4. **Widget rendering**: Display image with proper sizing within grid
5. **Drag-and-drop**: Same behavior as other widgets
6. **Responsive sizing**: Maintain aspect ratio or fill container

### Out of Scope
- File upload to server (images are URL-based only for MVP)
- Image cropping or editing
- Image galleries or carousels
- Background images for the dashboard
- Image caching or CDN integration

## Design Overview

### Widget Type Addition
```typescript
export type WidgetType = 'number' | 'stat' | 'gauge' | 'line' | 'bar' | 'area' | 'image'
```

### Widget Config Extension
```typescript
interface ImageWidgetConfig extends WidgetConfig {
  imageUrl: string
  altText?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none'
  caption?: string
}
```

### UI Flow
1. User clicks "Add Widget" on dashboard
2. User selects "Image" widget type (new option with 🖼️ icon)
3. User enters image URL (with live preview)
4. User optionally sets alt text, caption, and sizing
5. Widget is added to dashboard with default 4x3 size
6. Widget can be resized/repositioned like any other widget

### Image Widget Component
- Displays image with configurable object-fit
- Shows placeholder when loading or on error
- Optional caption below image
- Delete button on hover (same as other widgets)

## Impact Analysis

### Breaking Changes
None - this is purely additive.

### Database Changes
None - widget type and config are already stored as JSON in the `Widget` model.

### Migration
None required.

## Estimated Effort
- Frontend widget component: ~1 hour
- Widget picker modification: ~30 minutes
- Type definitions: ~15 minutes
- Testing: ~30 minutes
- **Total: ~2.5 hours**
