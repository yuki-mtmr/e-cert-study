import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 模試タイマーhook
 * Date.now()ベースでドリフト防止
 */
export function useMockExamTimer(durationMinutes: number, onTimeUp: () => void) {
  const totalSeconds = durationMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const startTimeRef = useRef(Date.now());
  const onTimeUpRef = useRef(onTimeUp);
  const expiredRef = useRef(false);

  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    startTimeRef.current = Date.now();
    expiredRef.current = false;
    setIsExpired(false);
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        setIsExpired(true);
        onTimeUpRef.current();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds]);

  const isWarning = remainingSeconds < 10 * 60 && remainingSeconds > 0;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return {
    remainingSeconds,
    formattedTime,
    isWarning,
    isExpired,
  };
}
