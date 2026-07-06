import { useEffect, useState } from 'react';

export function useIsOnline(pollMs = 15000): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch('https://clients3.google.com/generate_204', { method: 'HEAD' });
        if (!cancelled) setOnline(response.ok || response.status === 204);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollMs]);

  return online;
}
