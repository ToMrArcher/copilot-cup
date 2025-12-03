/**
 * DashboardPage Component
 * Main dashboard page with list and view modes
 */

import { useState } from 'react'
import { DashboardList } from './DashboardList'
import { DashboardView } from './DashboardView'
import { WidgetPicker } from './WidgetPicker'

export function DashboardPage() {
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null)
  const [showWidgetPicker, setShowWidgetPicker] = useState(false)

  return (
    <div className="px-4 py-6 sm:px-0">
      {selectedDashboardId ? (
        <>
          <DashboardView
            dashboardId={selectedDashboardId}
            onBack={() => setSelectedDashboardId(null)}
            onAddWidget={() => setShowWidgetPicker(true)}
          />
          <WidgetPicker
            dashboardId={selectedDashboardId}
            isOpen={showWidgetPicker}
            onClose={() => setShowWidgetPicker(false)}
          />
        </>
      ) : (
        <DashboardList onSelectDashboard={setSelectedDashboardId} />
      )}
    </div>
  )
}
