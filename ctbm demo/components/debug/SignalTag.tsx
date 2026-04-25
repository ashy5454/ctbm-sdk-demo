import { cn } from '@/lib/utils';

export function SignalTag({ signal }: { signal: string }) {
  // Try to pick a relevant emoji based on the signal content
  let emoji = '⚡';
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  
  const lower = signal.toLowerCase();
  
  if (lower.includes('keyword')) {
    emoji = '🔑';
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (lower.includes('affect')) {
    emoji = '😔';
    colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (lower.includes('trajectory')) {
    emoji = '📈';
    colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (lower.includes('llm')) {
    emoji = '🧠';
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border shadow-sm",
      colorClass
    )}>
      <span>{emoji}</span>
      <span>{signal}</span>
    </div>
  );
}
