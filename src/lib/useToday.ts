import { useEffect, useState } from 'react';
import { todayKey } from './store';

/** Date-sensitive pages render after hydration; never publish a stale prerendered day. */
export function useToday() {
  const [date, setDate] = useState(todayKey);
  useEffect(() => {
    const timer = window.setInterval(() => setDate(todayKey()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  return date;
}