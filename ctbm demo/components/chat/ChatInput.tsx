import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  "I've been feeling really lonely lately",
  "What's the difference between RAM and storage?",
  "Best noise-cancelling headphones under ₹15,000",
  "I'm so stressed about my exams",
  "My mom wants a new phone, any suggestions?",
  "I feel like I need a fresh start"
];

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-white/50 backdrop-blur-md border-t">
      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-1">
        {SUGGESTIONS.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => setInput(suggestion)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap"
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="relative flex items-end gap-2 bg-white rounded-2xl border shadow-sm p-1 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message Yudi..."
          className="flex-1 max-h-[120px] min-h-[44px] px-4 py-3 bg-transparent resize-none outline-none text-sm leading-relaxed"
          rows={1}
          disabled={isLoading}
        />
        <Button 
          size="icon" 
          className="rounded-xl h-[44px] w-[44px] shrink-0 mb-1 mr-1"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      <p className="text-center text-[11px] text-slate-400 font-medium tracking-wide">
        Try: "I've been feeling lonely" or "best headphones under ₹15000"
      </p>
    </div>
  );
}
