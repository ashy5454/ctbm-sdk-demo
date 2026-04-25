import { Zone } from '@ctbm/core';
import { Shield, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ZoneBannerProps {
  zone: Zone;
}

export function ZoneBanner({ zone }: ZoneBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Re-trigger animation when zone changes to protected or commerce
    if (zone !== 'neutral') {
      setShow(false);
      const timer = setTimeout(() => setShow(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [zone]);

  if (zone === 'neutral') return null;

  return (
    <div className={cn(
      "w-full px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-all duration-500",
      show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
      zone === 'protected' ? "bg-red-50 text-red-700 border-b border-red-100" : "",
      zone === 'commerce' ? "bg-emerald-50 text-emerald-700 border-b border-emerald-100" : ""
    )}>
      {zone === 'protected' && (
        <>
          <Shield className="w-3.5 h-3.5" />
          <span>Safe Space — This conversation is ad-free</span>
        </>
      )}
      {zone === 'commerce' && (
        <>
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Product suggestions may include affiliate links</span>
        </>
      )}
    </div>
  );
}
