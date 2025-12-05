# Design: Add Image Widget to Dashboards

## Component Architecture

```
WidgetPicker
    │
    ├── Type Selection (Step 1)
    │   └── [Number] [Stat] [Gauge] [Line] [Bar] [Area] [Image] ← NEW
    │
    ├── KPI Selection (Step 2) ← SKIP for image widgets
    │
    └── Configuration (Step 3)
        └── For image: URL input, preview, alt text, object-fit

DashboardView
    │
    └── WidgetRenderer
        ├── NumberWidget
        ├── StatWidget
        ├── GaugeWidget
        ├── ChartWidget
        └── ImageWidget ← NEW
```

## Type Definitions

### Updated WidgetType
```typescript
// frontend/src/types/dashboard.ts
export type WidgetType = 'number' | 'stat' | 'gauge' | 'line' | 'bar' | 'area' | 'image'
```

### Extended WidgetConfig
```typescript
export interface WidgetConfig {
  // Existing fields
  format?: 'currency' | 'percent' | 'number'
  prefix?: string
  suffix?: string
  showTarget?: boolean
  period?: string
  interval?: string
  
  // New image-specific fields
  imageUrl?: string
  altText?: string
  objectFit?: 'contain' | 'cover' | 'fill'
  caption?: string
}
```

## Widget Picker Changes

### New Widget Type Entry
```typescript
const widgetTypes = [
  // ... existing types
  { type: 'image', label: 'Image', description: 'Display a picture or logo', icon: '🖼️' },
]
```

### Default Position
```typescript
const defaultPositions: Record<WidgetType, WidgetPosition> = {
  // ... existing positions
  image: { x: 0, y: 0, w: 4, h: 3 },
}
```

### Skip KPI Selection for Images
```typescript
const handleTypeSelect = (type: WidgetType) => {
  setSelectedType(type)
  if (type === 'image') {
    setStep('config')  // Skip KPI selection
  } else {
    setStep('kpi')
  }
}
```

## ImageWidget Component

```tsx
// frontend/src/features/dashboard/ImageWidget.tsx

interface ImageWidgetProps {
  imageUrl: string
  altText?: string
  objectFit?: 'contain' | 'cover' | 'fill'
  caption?: string
  onDelete?: () => void
}

export function ImageWidget({
  imageUrl,
  altText = 'Dashboard image',
  objectFit = 'contain',
  caption,
  onDelete
}: ImageWidgetProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
      {/* Delete button */}
      {onDelete && (
        <button onClick={onDelete} className="absolute top-2 right-2 ...">
          <TrashIcon />
        </button>
      )}
      
      {/* Image container */}
      <div className="flex-1 relative">
        {isLoading && <LoadingPlaceholder />}
        {hasError && <ErrorPlaceholder />}
        <img
          src={imageUrl}
          alt={altText}
          className={`w-full h-full object-${objectFit}`}
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setHasError(true) }}
        />
      </div>
      
      {/* Optional caption */}
      {caption && (
        <div className="px-3 py-2 text-sm text-center text-gray-600 dark:text-gray-400 border-t">
          {caption}
        </div>
      )}
    </div>
  )
}
```

## DashboardView Changes

```typescript
// In renderContent switch statement
case 'image':
  return (
    <ImageWidget
      imageUrl={config?.imageUrl || ''}
      altText={config?.altText}
      objectFit={config?.objectFit}
      caption={config?.caption}
      onDelete={handleDelete}
    />
  )
```

## DraggableGrid Constraints

```typescript
const WIDGET_CONSTRAINTS: Record<string, { minW: number; minH: number }> = {
  // ... existing constraints
  image: { minW: 2, minH: 2 },
}
```

## Image Configuration Step UI

```tsx
// New step in WidgetPicker for image configuration
{step === 'config' && selectedType === 'image' && (
  <div className="space-y-4">
    <h3>Configure Image</h3>
    
    {/* URL Input */}
    <input
      type="url"
      placeholder="https://example.com/image.png"
      value={config.imageUrl}
      onChange={(e) => setConfig({...config, imageUrl: e.target.value})}
    />
    
    {/* Live Preview */}
    {config.imageUrl && (
      <div className="border rounded p-2">
        <img src={config.imageUrl} alt="Preview" className="max-h-40 mx-auto" />
      </div>
    )}
    
    {/* Alt Text */}
    <input
      type="text"
      placeholder="Image description (for accessibility)"
      value={config.altText}
      onChange={(e) => setConfig({...config, altText: e.target.value})}
    />
    
    {/* Object Fit */}
    <select
      value={config.objectFit}
      onChange={(e) => setConfig({...config, objectFit: e.target.value})}
    >
      <option value="contain">Contain (show whole image)</option>
      <option value="cover">Cover (fill space, may crop)</option>
      <option value="fill">Fill (stretch to fit)</option>
    </select>
    
    {/* Caption */}
    <input
      type="text"
      placeholder="Optional caption"
      value={config.caption}
      onChange={(e) => setConfig({...config, caption: e.target.value})}
    />
  </div>
)}
```

## Error Handling

1. **Invalid URL**: Show placeholder with error icon and message
2. **Loading**: Show spinner or skeleton
3. **CORS issues**: Note that external images may have CORS restrictions
4. **Empty URL**: Show "No image URL" placeholder
