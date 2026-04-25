import { Message } from '@/lib/types';
import { ZoneBadge } from '../shared/ZoneBadge';
import { ProductGrid } from '../commerce/ProductGrid';
import { CCIPrompt } from '../shared/CCIPrompt';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  onCCIAccept?: () => void;
  onCCIDismiss?: () => void;
}

export function MessageBubble({ message, onCCIAccept, onCCIDismiss }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex flex-col w-full mb-6", isUser ? "items-end" : "items-start")}>
      <div className={cn(
        "relative max-w-[85%] rounded-2xl px-5 py-3 text-sm/relaxed whitespace-pre-wrap",
        isUser 
          ? "bg-blue-600 text-white rounded-tr-sm" 
          : "bg-white text-slate-800 rounded-tl-sm shadow-sm border border-slate-100"
      )}>
        {/* Tiny Zone Indicator Dot */}
        <div className={cn(
          "absolute -top-1",
          isUser ? "-left-1" : "-right-1"
        )}>
          <ZoneBadge zone={message.zone} size="sm" />
        </div>
        
        {message.content}
        
        <div className={cn(
          "text-[10px] mt-2 opacity-60",
          isUser ? "text-blue-100 text-right" : "text-slate-400 text-left"
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Commerce Product Grid */}
      {!isUser && message.zone === 'commerce' && message.products && message.products.length > 0 && (
        <div className="w-full mt-3">
          <ProductGrid products={message.products} />
        </div>
      )}

      {/* CCIPrompt for Neutral */}
      {!isUser && message.showCCIPrompt && onCCIAccept && onCCIDismiss && (
        <CCIPrompt onAccept={onCCIAccept} onDismiss={onCCIDismiss} />
      )}
    </div>
  );
}
