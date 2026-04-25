import { Zone } from '@ctbm/core';
import { Shield, Circle, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoneBadgeProps {
  zone: Zone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const zoneConfig = {
  protected: {
    color: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'PROTECTED',
    icon: Shield,
    border: 'border-red-200 dark:border-red-800'
  },
  neutral: {
    color: 'bg-slate-500',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    label: 'NEUTRAL',
    icon: Circle,
    border: 'border-slate-200 dark:border-slate-700'
  },
  commerce: {
    color: 'bg-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'COMMERCE',
    icon: ShoppingBag,
    border: 'border-emerald-200 dark:border-emerald-800'
  }
};

export function ZoneBadge({ zone, size = 'md', className }: ZoneBadgeProps) {
  const config = zoneConfig[zone];
  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <div 
        className={cn("w-2 h-2 rounded-full", config.color, className)} 
        title={config.label}
      />
    );
  }

  if (size === 'md') {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        config.bg, config.text, config.border, className
      )}>
        <div className={cn("w-1.5 h-1.5 rounded-full", config.color)} />
        {config.label}
      </div>
    );
  }

  // Large badge for debug panel
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-4 rounded-xl border transition-colors",
      config.bg, config.text, config.border, className
    )}>
      <Icon className="w-8 h-8 mb-2" />
      <span className="font-bold tracking-wider">{config.label}</span>
    </div>
  );
}
