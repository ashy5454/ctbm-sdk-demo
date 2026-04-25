"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Shield, Circle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 'protected',
    title: 'Protected Zone',
    icon: Shield,
    color: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    description: "When you share something personal, Yudi creates a completely ad-free space. No products, no suggestions, ever.",
    phoneImage: (
      <div className="w-full max-w-[240px] mx-auto bg-white rounded-3xl border-8 border-slate-900 shadow-xl overflow-hidden aspect-[9/16] flex flex-col">
        <div className="bg-red-50 p-3 border-b border-red-100 flex items-center gap-2 text-xs font-medium text-red-700 justify-center">
          <Shield className="w-3 h-3" /> Safe Space Active
        </div>
        <div className="p-4 flex flex-col gap-3 flex-1 bg-slate-50">
          <div className="self-end bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[85%]">
            I've been feeling really lonely and overwhelmed lately.
          </div>
          <div className="self-start bg-white border shadow-sm rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[85%] text-slate-700">
            I'm so sorry you're feeling this way. It's completely normal to feel overwhelmed sometimes. I'm here to listen.
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'neutral',
    title: 'Neutral Zone',
    icon: Circle,
    color: 'bg-slate-500',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    description: "For everyday questions, Yudi stays helpful and neutral. You can optionally ask for product suggestions — your choice.",
    phoneImage: (
      <div className="w-full max-w-[240px] mx-auto bg-white rounded-3xl border-8 border-slate-900 shadow-xl overflow-hidden aspect-[9/16] flex flex-col">
        <div className="p-4 flex flex-col gap-3 flex-1 bg-slate-50">
          <div className="self-end bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[85%]">
            How do noise cancelling headphones actually work?
          </div>
          <div className="self-start bg-white border shadow-sm rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[85%] text-slate-700">
            They use microphones to listen to outside noise, then play an "anti-noise" sound wave that cancels it out before it reaches your ear.
          </div>
          <div className="self-end bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[10px] text-slate-600 shadow-sm mt-2 max-w-[90%]">
            I know some things that might help — want me to show you some options?
            <div className="flex gap-2 mt-2">
              <div className="bg-emerald-600 text-white px-2 py-1 rounded-full text-[9px]">Yes, show me</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'commerce',
    title: 'Commerce Zone',
    icon: ShoppingBag,
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    description: "When you're looking to buy something, Yudi helps you find the best option and is transparent about affiliate links.",
    phoneImage: (
      <div className="w-full max-w-[240px] mx-auto bg-white rounded-3xl border-8 border-slate-900 shadow-xl overflow-hidden aspect-[9/16] flex flex-col">
        <div className="bg-emerald-50 p-2 border-b border-emerald-100 flex items-center gap-2 text-[10px] font-medium text-emerald-700 justify-center">
          <ShoppingBag className="w-3 h-3" /> Affiliate links active
        </div>
        <div className="p-4 flex flex-col gap-3 flex-1 bg-slate-50">
          <div className="self-end bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[85%]">
            What are the best headphones under ₹15000?
          </div>
          <div className="self-start bg-white border shadow-sm rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[85%] text-slate-700">
            Here are some great options in that price range with excellent noise cancellation.
          </div>
          <div className="bg-white border rounded-lg p-2 shadow-sm">
            <div className="text-[9px] text-slate-400 mb-1 flex justify-between"><span>AUDIO</span><span>Sponsored</span></div>
            <div className="font-bold text-[10px] mb-1">Sony WH-CH720N</div>
            <div className="text-[10px] text-slate-500 mb-2 leading-tight">Lightweight over-ear headphones with V1 chip.</div>
            <div className="text-[10px] font-bold text-emerald-600">₹9,990</div>
          </div>
        </div>
      </div>
    )
  }
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        
        {/* Progress dots */}
        <div className="flex gap-2 mb-12">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-8 bg-slate-800" : "w-2 bg-slate-200"
              )} 
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
          
          {/* Left: Phone Mockup */}
          <div className="order-2 md:order-1 flex justify-center animate-in fade-in slide-in-from-left-8 duration-500" key={`img-${step}`}>
            {current.phoneImage}
          </div>

          {/* Right: Text content */}
          <div className="order-1 md:order-2 flex flex-col items-start text-left animate-in fade-in slide-in-from-right-8 duration-500" key={`txt-${step}`}>
            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 border", current.bg, current.text, current.border)}>
              <Icon className="w-4 h-4" />
              {current.title}
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              {current.title === 'Protected Zone' && 'Your emotional data is off-limits.'}
              {current.title === 'Neutral Zone' && 'Answers without the upsell.'}
              {current.title === 'Commerce Zone' && 'Smart shopping, clearly disclosed.'}
            </h2>
            
            <p className="text-lg text-slate-600 leading-relaxed mb-10">
              {current.description}
            </p>

            <div className="flex items-center gap-4 w-full">
              {step > 0 && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full"
                  onClick={() => setStep(s => s - 1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              
              {step < STEPS.length - 1 ? (
                <Button 
                  size="lg" 
                  className="rounded-full flex-1"
                  onClick={() => setStep(s => s + 1)}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Link href="/playground" className="flex-1">
                  <Button size="lg" className="rounded-full w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Enter Playground <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
