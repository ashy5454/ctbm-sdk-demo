"use client";

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/lib/types';
import { ClassificationResult, Zone } from '@ctbm/core';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ZoneBanner } from '@/components/chat/ZoneBanner';
import { DebugPanel } from '@/components/debug/DebugPanel';
import { ZoneBadge } from '@/components/shared/ZoneBadge';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentZone, setCurrentZone] = useState<Zone>('neutral');
  const [currentDebugResult, setCurrentDebugResult] = useState<ClassificationResult | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedTopics, setDismissedTopics] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load dismissed topics from local storage
    const stored = localStorage.getItem('ctbm_dismissed_topics');
    if (stored) {
      try {
        setDismissedTopics(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string, overrideZone?: Zone) => {
    if (!content.trim() && !overrideZone) return;
    
    setIsLoading(true);
    
    // Add User Message
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: content || '[CCIPrompt Accepted]',
      zone: currentZone, // Will update after classify
      timestamp: new Date()
    };
    
    if (content) {
      setMessages(prev => [...prev, userMsg]);
    }

    try {
      let zoneToUse = overrideZone;
      let classResult = currentDebugResult;

      if (!overrideZone) {
        // 1. Classify
        const classRes = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, history: sessionHistory })
        });
        
        if (!classRes.ok) throw new Error('Classification failed');
        classResult = await classRes.json();
        
        // Update states
        zoneToUse = classResult!.zone;
        userMsg.zone = zoneToUse;
        userMsg.debugResult = classResult!;
        
        setCurrentZone(zoneToUse);
        setCurrentDebugResult(classResult);
        setSessionHistory(prev => [...prev, userMsg]);
      } else {
        setCurrentZone(zoneToUse as Zone);
      }

      // 2. Chat Generate
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, zone: zoneToUse, history: sessionHistory })
      });
      
      if (!chatRes.ok) throw new Error('Chat failed');
      const chatData = await chatRes.json();
      
      let products = undefined;
      
      // 3. Products Generate (if commerce)
      if (zoneToUse === 'commerce') {
        const prodRes = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: content })
        });
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          products = prodData.products;
        }
      }

      // Add Assistant Message
      const astMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: chatData.response,
        zone: zoneToUse as Zone,
        products,
        showCCIPrompt: zoneToUse === 'neutral' && !dismissedTopics.includes(content.toLowerCase()),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, astMsg]);
      setSessionHistory(prev => [...prev, astMsg]);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCCIAccept = () => {
    // Hide CCI prompt on last message
    setMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs.length > 0) {
        newMsgs[newMsgs.length - 1].showCCIPrompt = false;
      }
      return newMsgs;
    });
    // Trigger commerce flow silently
    handleSendMessage('', 'commerce');
  };

  const handleCCIDismiss = (topic: string) => {
    const newDismissed = [...dismissedTopics, topic.toLowerCase()];
    setDismissedTopics(newDismissed);
    localStorage.setItem('ctbm_dismissed_topics', JSON.stringify(newDismissed));
    
    setMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs.length > 0) {
        newMsgs[newMsgs.length - 1].showCCIPrompt = false;
      }
      return newMsgs;
    });
  };

  // UI Theme based on zone
  let bgClass = 'bg-white';
  if (currentZone === 'protected') bgClass = 'bg-[#FFF5F5]';
  if (currentZone === 'commerce') bgClass = 'bg-[#F0FFF4]';

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-slate-900 bg-slate-50">
      
      {/* LEFT PANEL: Chat Interface */}
      <div className="flex flex-col h-full w-full md:w-[60%] border-r border-slate-200 relative">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              Y
            </div>
            <span className="font-semibold text-lg tracking-tight">Yudi</span>
          </div>
          <ZoneBadge zone={currentZone} size="md" />
        </header>

        {/* Dynamic Background Area */}
        <div className={cn("flex-1 overflow-y-auto relative transition-colors duration-500", bgClass)}>
          <div className="sticky top-0 z-10">
            <ZoneBanner zone={currentZone} />
          </div>

          <div className="p-6 pb-12 max-w-3xl mx-auto flex flex-col justify-end min-h-full">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 space-y-4 mb-12">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl">👋</div>
                <div>
                  <h3 className="font-medium text-lg text-slate-800">Welcome to the CTBM Playground</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-2">Send a message below to test how the classifier dynamically switches zones to protect your data while enabling commerce.</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => {
                // Determine topic for CCI dismissal (using the last user message)
                const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                const topic = lastUserMsg?.content || '';

                return (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    onCCIAccept={handleCCIAccept}
                    onCCIDismiss={() => handleCCIDismiss(topic)}
                  />
                );
              })
            )}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-3 w-fit shadow-sm mt-2">
                <span className="flex h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="flex h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-.15s]" />
                <span className="flex h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-.3s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>

      {/* RIGHT PANEL: Debug Panel */}
      <div className="h-full w-full md:w-[40%] bg-slate-50 relative z-20">
        <DebugPanel currentResult={currentDebugResult} sessionHistory={sessionHistory} />
      </div>

    </div>
  );
}
