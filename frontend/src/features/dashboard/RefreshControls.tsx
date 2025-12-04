import { useAutoRefresh, type RefreshInterval } from '../../contexts/AutoRefreshContext';

const intervalOptions: { value: RefreshInterval; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: '30s', label: '30s' },
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
];

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function RefreshControls() {
  const { interval, setInterval, triggerRefresh, lastRefresh, isActive } = useAutoRefresh();

  return (
    <div className="flex items-center gap-3">
      {/* Last updated timestamp */}
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Updated {formatRelativeTime(lastRefresh)}
      </span>

      {/* Manual refresh button */}
      <button
        onClick={triggerRefresh}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        title="Refresh now"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Interval selector */}
      <div className="flex items-center gap-2">
        {isActive && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value as RefreshInterval)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          title="Auto-refresh interval"
        >
          {intervalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
