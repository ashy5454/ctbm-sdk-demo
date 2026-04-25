import Link from 'next/link';
import { Shield, Circle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        
        {/* Hero Section */}
        <div className="space-y-6 max-w-3xl mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-sm text-slate-300 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Introducing CTBM SDK
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
            Monetize AI conversations ethically
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            CTBM is an open-source SDK that automatically protects emotional conversations from monetization while unlocking revenue where it's contextually appropriate.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/onboarding">
              <Button size="lg" className="h-14 px-8 text-base rounded-full bg-white text-slate-950 hover:bg-slate-200 group">
                Try the Playground
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-full border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-white">
              View on GitHub
            </Button>
          </div>
        </div>

        {/* Zone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
          
          <div className="flex flex-col text-left p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-red-900/50 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6 border border-red-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Protected Zone</h3>
            <p className="text-slate-400 leading-relaxed">
              Emotional support, mental health, grief, loneliness. Zero ads. Zero product mentions. Always.
            </p>
          </div>

          <div className="flex flex-col text-left p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-400 flex items-center justify-center mb-6 border border-slate-500/20">
              <Circle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Neutral Zone</h3>
            <p className="text-slate-400 leading-relaxed">
              General knowledge, learning, casual chat. No active monetization. Optional transition to Commerce.
            </p>
          </div>

          <div className="flex flex-col text-left p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-900/50 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Commerce Zone</h3>
            <p className="text-slate-400 leading-relaxed">
              Product discovery, purchase advice, comparisons. Full monetization with clear disclosure.
            </p>
          </div>

        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-800/50">
        Built by Ashmith Atmuri, Mahindra University
      </footer>
    </div>
  );
}
