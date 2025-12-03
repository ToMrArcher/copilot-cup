import { useState } from 'react'
import { useCreateShareLink } from '../../hooks/useSharing'
import { EXPIRATION_PRESETS, type ExpirationPreset } from '../../types/sharing'

interface CreateShareModalProps {
  isOpen: boolean
  onClose: () => void
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  resourceName: string
}

export function CreateShareModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceName,
}: CreateShareModalProps) {
  const [name, setName] = useState('')
  const [expiresIn, setExpiresIn] = useState<ExpirationPreset>('7d')
  const [showTarget, setShowTarget] = useState(true)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const createLink = useCreateShareLink()

  const handleCreate = async () => {
    try {
      const result = await createLink.mutateAsync({
        resourceType,
        resourceId,
        name: name || undefined,
        expiresIn,
        showTarget,
      })
      setGeneratedUrl(result.url)
    } catch (err) {
      console.error('Failed to create share link:', err)
    }
  }

  const handleCopy = async () => {
    if (!generatedUrl) return
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClose = () => {
    setName('')
    setExpiresIn('7d')
    setShowTarget(true)
    setGeneratedUrl(null)
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Create Share Link
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!generatedUrl ? (
            <>
              {/* Resource info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                  Sharing {resourceType}
                </p>
                <p className="font-medium text-gray-900">{resourceName}</p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Link name (optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Client review"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Expiration */}
                <div>
                  <label htmlFor="expiresIn" className="block text-sm font-medium text-gray-700 mb-1">
                    Link expires
                  </label>
                  <select
                    id="expiresIn"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value as ExpirationPreset)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {EXPIRATION_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show target */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showTarget"
                    checked={showTarget}
                    onChange={(e) => setShowTarget(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showTarget" className="ml-2 block text-sm text-gray-700">
                    Show target achievement
                  </label>
                </div>
                <p className="text-xs text-gray-500 -mt-2 ml-6">
                  When unchecked, target values and progress will be hidden from viewers
                </p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createLink.isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createLink.isPending ? 'Creating...' : 'Create Link'}
                </button>
              </div>

              {createLink.isError && (
                <p className="mt-2 text-sm text-red-600">
                  Failed to create share link. Please try again.
                </p>
              )}
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="text-center py-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Link Created!
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Anyone with this link can view the {resourceType}
                </p>
              </div>

              {/* URL */}
              <div className="mb-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    readOnly
                    value={generatedUrl}
                    className="flex-1 bg-transparent text-sm text-gray-700 border-none focus:ring-0 p-0"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      copied
                        ? 'text-green-600 bg-green-100'
                        : 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
