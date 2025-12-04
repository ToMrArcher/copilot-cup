import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

export type RefreshInterval = 'off' | '30s' | '1m' | '5m' | '15m';

interface AutoRefreshContextValue {
  /** Current refresh interval setting */
  interval: RefreshInterval;
  /** Increments to trigger refetches in data hooks */
  refreshKey: number;
  /** Timestamp of last refresh */
  lastRefresh: Date;
  /** Whether auto-refresh is currently active */
  isActive: boolean;
  /** Set the refresh interval */
  setInterval: (interval: RefreshInterval) => void;
  /** Trigger an immediate refresh */
  triggerRefresh: () => void;
}

const AutoRefreshContext = createContext<AutoRefreshContextValue | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'auto-refresh-interval-';

function getIntervalMs(interval: RefreshInterval): number | null {
  switch (interval) {
    case '30s': return 30 * 1000;
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    default: return null;
  }
}

function getStoredInterval(dashboardId: string): RefreshInterval {
  if (typeof window === 'undefined') return 'off';
  const stored = localStorage.getItem(STORAGE_KEY_PREFIX + dashboardId);
  if (stored === '30s' || stored === '1m' || stored === '5m' || stored === '15m') {
    return stored;
  }
  return 'off';
}

interface AutoRefreshProviderProps {
  children: ReactNode;
  dashboardId: string;
}

export function AutoRefreshProvider({ children, dashboardId }: AutoRefreshProviderProps) {
  const [interval, setIntervalState] = useState<RefreshInterval>(() => 
    getStoredInterval(dashboardId)
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const timerRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null);

  const isActive = interval !== 'off';

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setLastRefresh(new Date());
  }, []);

  const setIntervalFn = useCallback((newInterval: RefreshInterval) => {
    setIntervalState(newInterval);
    localStorage.setItem(STORAGE_KEY_PREFIX + dashboardId, newInterval);
  }, [dashboardId]);

  // Set up interval timer
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const ms = getIntervalMs(interval);
    if (ms) {
      timerRef.current = globalThis.setInterval(() => {
        triggerRefresh();
      }, ms);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [interval, triggerRefresh]);

  // Reset when dashboard changes
  useEffect(() => {
    setIntervalState(getStoredInterval(dashboardId));
    setRefreshKey(0);
    setLastRefresh(new Date());
  }, [dashboardId]);

  return (
    <AutoRefreshContext.Provider value={{
      interval,
      refreshKey,
      lastRefresh,
      isActive,
      setInterval: setIntervalFn,
      triggerRefresh,
    }}>
      {children}
    </AutoRefreshContext.Provider>
  );
}

export function useAutoRefresh() {
  const context = useContext(AutoRefreshContext);
  if (context === undefined) {
    throw new Error('useAutoRefresh must be used within an AutoRefreshProvider');
  }
  return context;
}

// Hook for optional usage (returns default values if not in provider)
export function useAutoRefreshOptional(): AutoRefreshContextValue {
  const context = useContext(AutoRefreshContext);
  if (context === undefined) {
    return {
      interval: 'off',
      refreshKey: 0,
      lastRefresh: new Date(),
      isActive: false,
      setInterval: () => {},
      triggerRefresh: () => {},
    };
  }
  return context;
}
