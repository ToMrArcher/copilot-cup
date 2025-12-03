export function SharingPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sharing</h1>
        <p className="text-gray-600">
          Manage external sharing links for your dashboards and KPIs.
        </p>
        <div className="mt-6">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700">
            + Create Share Link
          </button>
        </div>
      </div>
    </div>
  )
}
