import { Zone } from '@ctbm/core';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ScoreBarProps {
  label: string;
  score: number;
  zoneType: Zone;
}

export function ScoreBar({ label, score, zoneType }: ScoreBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Animate from 0 on mount or score change
    setWidth(0);
    const timer = setTimeout(() => {
      setWidth(Math.max(2, score * 100)); // Minimum 2% to show the bar exists
    }, 50);
    return () => clearTimeout(timer);
  }, [score]);

  let fillColor = 'bg-slate-400';
  if (zoneType === 'protected') fillColor = 'bg-red-500';
  if (zoneType === 'commerce') fillColor = 'bg-emerald-500';

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
        <span>{label}</span>
        <span>{score.toFixed(2)}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
        <div 
          className={cn("h-full transition-all duration-500 ease-out rounded-full", fillColor)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
