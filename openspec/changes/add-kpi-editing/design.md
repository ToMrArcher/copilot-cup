# Design: Add KPI Editing Capability

## Technical Design

### Backend: PATCH /api/kpis/:id

```typescript
// kpi.router.ts
kpiRouter.patch('/:id', async (req: Request, res: Response) => {
  const ctx = getPermissionContext(req)
  
  // Check EDIT permission
  if (ctx) {
    const hasAccess = await canAccessKpi(ctx, req.params.id, 'EDIT')
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' })
      return
    }
  }

  const { name, description, formula, targetValue, targetDirection, sources } = req.body

  // Update KPI basic fields
  const updatedKpi = await prisma.kpi.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(formula && { formula }),
      ...(targetValue !== undefined && { targetValue }),
      ...(targetDirection !== undefined && { targetDirection }),
    },
  })

  // Update sources if provided
  if (sources) {
    // Delete existing sources
    await prisma.kpiSource.deleteMany({
      where: { kpiId: req.params.id },
    })
    
    // Create new sources
    for (const source of sources) {
      await prisma.kpiSource.create({
        data: {
          kpiId: req.params.id,
          dataFieldId: source.dataFieldId,
          alias: source.alias,
        },
      })
    }
  }

  // Recalculate and return updated KPI
  // ... (similar to create endpoint)
})
```

### Frontend: useUpdateKpi Hook

```typescript
// hooks/useKpis.ts
export function useUpdateKpi() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateKpiRequest }) => {
      return kpisApi.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}
```

### Frontend: KpiWizard Changes

```typescript
interface KpiWizardProps {
  onClose: () => void
  kpiId?: string  // If provided, edit mode
}

export function KpiWizard({ onClose, kpiId }: KpiWizardProps) {
  const isEditMode = !!kpiId
  const { data: existingKpi, isLoading } = useKpi(kpiId)
  const createKpi = useCreateKpi()
  const updateKpi = useUpdateKpi()

  // Initialize state from existing KPI in edit mode
  useEffect(() => {
    if (existingKpi) {
      setName(existingKpi.name)
      setDescription(existingKpi.description || '')
      setFormula(existingKpi.formula)
      setTargetValue(existingKpi.targetValue?.toString() || '')
      setTargetDirection(existingKpi.targetDirection || 'increase')
      // Map sources to selectedSources format
      setSelectedSources(existingKpi.sources.map(s => ({
        dataFieldId: s.dataField.id,
        alias: s.alias || s.dataField.name,
        field: s.dataField,
        integrationName: s.dataField.integration?.name || '',
      })))
    }
  }, [existingKpi])

  const handleSubmit = async () => {
    if (isEditMode) {
      await updateKpi.mutateAsync({ id: kpiId, data: formData })
    } else {
      await createKpi.mutateAsync(formData)
    }
    onClose()
  }
}
```

### Frontend: KpiCard Edit Button

```typescript
// KpiCard.tsx - add Edit button
{kpi.canEdit && (
  <button
    onClick={handleEdit}
    className="p-1.5 text-gray-400 hover:text-blue-600..."
    title="Edit"
  >
    <svg>...</svg> {/* Pencil icon */}
  </button>
)}
```

### API Types

```typescript
// types/kpi.ts
export interface UpdateKpiRequest {
  name?: string
  description?: string | null
  formula?: string
  targetValue?: number | null
  targetDirection?: 'increase' | 'decrease' | null
  sources?: Array<{
    dataFieldId: string
    alias: string
  }>
}
```

### State Flow

1. User clicks "Edit" on KpiCard
2. Parent component sets `editingKpiId = kpi.id`
3. KpiWizard opens with `kpiId={editingKpiId}`
4. KpiWizard fetches KPI data and pre-fills form
5. User makes changes
6. User clicks "Save Changes"
7. `updateKpi` mutation is called
8. On success, wizard closes and list refreshes
9. Parent sets `editingKpiId = null`

### Permission Flow

1. Check `kpi.canEdit` flag from list/detail endpoint
2. Only show Edit button if `canEdit === true`
3. Backend checks EDIT permission on PATCH request
4. Owners, admins, and users with EDIT access can modify
