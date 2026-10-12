'use client';

import { useEffect, useRef } from 'react';
import localforage from 'localforage';

export interface ReadingStats {
  streak: number;
  activeDays: number[];
  [dateStr: string]: any;
}

/**
 * Calculates current streak based on history dates with > 0 minutes read
 */
export function calculateStreak(stats: Record<string, any>): number {
  if (!stats) return 1;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  let checkDate = new Date(today);
  if (!stats[todayStr] || stats[todayStr] <= 0) {
    if (stats[yesterdayStr] && stats[yesterdayStr] > 0) {
      checkDate = new Date(yesterday);
    } else {
      return 0;
    }
  }

  while (true) {
    const dStr = checkDate.toDateString();
    if (stats[dStr] && stats[dStr] > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return Math.max(streak, 1);
}

/**
 * Merges local and cloud stats, taking the maximum minutes for each day
 */
export function mergeStats(localStats: any, cloudStats: any): ReadingStats {
  if (!localStats && !cloudStats) {
    return {
      streak: 1,
      activeDays: [new Date().getDay()]
    };
  }
  if (!localStats) return cloudStats;
  if (!cloudStats) return localStats;

  const merged: Record<string, any> = { ...localStats };

  for (const [key, cloudVal] of Object.entries(cloudStats)) {
    if (key === 'streak' || key === 'activeDays') continue;
    if (typeof cloudVal === 'number') {
      const localVal = typeof localStats[key] === 'number' ? localStats[key] : 0;
      merged[key] = Math.max(localVal, cloudVal);
    }
  }

  const localActive = Array.isArray(localStats.activeDays) ? localStats.activeDays : [];
  const cloudActive = Array.isArray(cloudStats.activeDays) ? cloudStats.activeDays : [];
  merged.activeDays = Array.from(new Set([...localActive, ...cloudActive]));
  merged.streak = calculateStreak(merged);

  return merged as ReadingStats;
}

/**
 * Logs 1 minute of active reading or study time into localforage and syncs to D1
 */
export async function logReadingMinute(): Promise<ReadingStats> {
  const todayStr = new Date().toDateString();
  const currentDayIndex = new Date().getDay();

  let stats: ReadingStats = await localforage.getItem<any>('quiet_reading_stats') || {
    streak: 1,
    activeDays: [currentDayIndex]
  };

  stats[todayStr] = (stats[todayStr] || 0) + 1;

  if (!stats.activeDays) stats.activeDays = [];
  if (!stats.activeDays.includes(currentDayIndex)) {
    stats.activeDays.push(currentDayIndex);
  }

  stats.streak = calculateStreak(stats);

  await localforage.setItem('quiet_reading_stats', stats);

  // Sync to Cloudflare D1 if user is signed in
  try {
    fetch('/api/reading-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats })
    }).catch(() => {});
  } catch (_) {}

  return stats;
}

/**
 * Hook to automatically track active reading/study time on a page.
 * Tracks time only when tab is active (document.visibilityState === 'visible').
 * Logs initial minute after 15s of active presence, then every 60s thereafter.
 */
export function useReadingTimer() {
  const isTabActiveRef = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      isTabActiveRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    isTabActiveRef.current = document.visibilityState === 'visible';

    let activeSeconds = 0;
    let hasLoggedInitial = false;

    // Check if an initial minute was already logged recently (within 60s) in this session
    const lastInitialLog = sessionStorage.getItem('quiet_last_initial_log');
    const now = Date.now();
    if (lastInitialLog && now - parseInt(lastInitialLog, 10) < 60000) {
      hasLoggedInitial = true;
    }

    const interval = setInterval(() => {
      if (!isTabActiveRef.current) return;

      activeSeconds += 1;

      if (!hasLoggedInitial && activeSeconds >= 15) {
        hasLoggedInitial = true;
        sessionStorage.setItem('quiet_last_initial_log', String(Date.now()));
        logReadingMinute();
        activeSeconds = 0;
      } else if (hasLoggedInitial && activeSeconds >= 60) {
        logReadingMinute();
        activeSeconds = 0;
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
