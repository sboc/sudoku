import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(
  initialElapsed: number,
  initialPenaltyCount: number,
  penaltyCount: number,
  solved: boolean,
  failed: boolean,
) {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timerFlash, setTimerFlash] = useState<string | null>(null);
  const [timerFlashKey, setTimerFlashKey] = useState(0);
  const timerFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPenaltyRef = useRef(initialPenaltyCount);

  const showTimerFlash = useCallback((msg: string) => {
    if (timerFlashTimerRef.current) clearTimeout(timerFlashTimerRef.current);
    setTimerFlash(msg);
    setTimerFlashKey(k => k + 1);
    timerFlashTimerRef.current = setTimeout(() => setTimerFlash(null), 1500);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timerFlashTimerRef.current) clearTimeout(timerFlashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if ((solved || failed) && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [solved, failed]);

  useEffect(() => {
    if (penaltyCount > prevPenaltyRef.current) {
      const minutes = Math.pow(2, penaltyCount - 1);
      setElapsed(s => s + minutes * 60);
      showTimerFlash(`+${minutes}m`);
      prevPenaltyRef.current = penaltyCount;
    }
  }, [penaltyCount, showTimerFlash]);

  return { elapsed, setElapsed, timerFlash, timerFlashKey, showTimerFlash };
}
