import { DEFAULT_DATE_LOOKBACK_DAYS } from '../constants.js';

export type DateRange = 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_quarter';

export function getDateRange(range: DateRange): { created_after: string; created_before?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return { created_after: today.toISOString() };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        created_after: yesterday.toISOString(),
        created_before: today.toISOString()
      };
    }

    case 'last_week': {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return { created_after: lastWeek.toISOString() };
    }

    case 'last_month': {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return { created_after: lastMonth.toISOString() };
    }

    case 'last_quarter': {
      const lastQuarter = new Date(today);
      lastQuarter.setMonth(lastQuarter.getMonth() - 3);
      return { created_after: lastQuarter.toISOString() };
    }
  }
}

export function getDefaultLookbackDate(days: number = DEFAULT_DATE_LOOKBACK_DAYS): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function calculateDurationMinutes(startTime: string, endTime: string): number | null {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();

    if (durationMs < 0) return null;

    return Math.round(durationMs / (1000 * 60));
  } catch {
    return null;
  }
}
