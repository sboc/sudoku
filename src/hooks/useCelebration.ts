import { useState, useEffect, useRef, useCallback } from 'react';
import type { MutableRefObject } from 'react';

export const useCelebration = (
  solved: boolean,
  failed: boolean,
  solvedRef: MutableRefObject<boolean>,
  failedRef: MutableRefObject<boolean>,
) => {
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCelebration = useCallback(() => {
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    setCelebrationKey(k => k + 1);
    setCelebrating(true);
    celebrationTimerRef.current = setTimeout(() => setCelebrating(false), 5100);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (solved && !failed) startCelebration();
    return () => { if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current); };
  }, [solved, failed, startCelebration]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && solvedRef.current && !failedRef.current)
        startCelebration();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [startCelebration, solvedRef, failedRef]);

  return { celebrating, celebrationKey };
};
