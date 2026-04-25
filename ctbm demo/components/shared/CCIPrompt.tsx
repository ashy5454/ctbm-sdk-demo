import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CCIPromptProps {
  onAccept: () => void;
  onDismiss: () => void;
}

export function CCIPrompt({ onAccept, onDismiss }: CCIPromptProps) {
  return (
    <div className="flex w-full justify-end mt-2">
      <div className="relative max-w-[80%] rounded-2xl p-4 bg-slate-50 border border-slate-200 text-sm shadow-sm animate-in fade-in slide-in-from-bottom-2">
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        
        <p className="text-slate-700 pr-6 mb-3">
          I know some things that might help with this — want me to show you some options? Totally optional.
        </p>
        
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4"
            onClick={onAccept}
          >
            Yes, show me
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full px-4"
            onClick={onDismiss}
          >
            No thanks
          </Button>
        </div>
      </div>
    </div>
  );
}
