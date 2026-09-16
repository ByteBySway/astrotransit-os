import React, { useEffect, useState, useRef } from 'react';

interface RollingOdometerProps {
  value: number;
  decimals?: number;
  formatLocale?: boolean;
  className?: string;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
}

export const RollingOdometer: React.FC<RollingOdometerProps> = ({
  value,
  decimals = 0,
  formatLocale = false,
  className = '',
  prefix = '',
  suffix = '',
  durationMs = 300,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = Number.isFinite(value) ? value : 0;
    
    if (Math.abs(startVal - endVal) < 0.000001) {
      setDisplayValue(endVal);
      return;
    }

    const startTime = performance.now();

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Fast responsive ease-out cubic curve (300ms transition)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
      }
    };

    animFrameRef.current = requestAnimationFrame(updateCounter);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, durationMs]);

  const formatted = formatLocale
    ? Math.round(displayValue).toLocaleString()
    : displayValue.toFixed(decimals);

  return (
    <span className={`inline-block tabular-nums transition-all ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
