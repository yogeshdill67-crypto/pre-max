import React, { useState, useRef, useLayoutEffect } from 'react';
import { Search, Zap, BookOpen, Loader2, Sparkles } from 'lucide-react';
import gsap from 'gsap';

interface AISearchBarProps {
    onSearch: (query: string, mode: 'quick' | 'research') => void;
    isLoading: boolean;
}

export const AISearchBar: React.FC<AISearchBarProps> = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<'quick' | 'research'>('quick');
    const barRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(barRef.current, {
                y: -30,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out',
            });
            // Glow pulse
            gsap.to(glowRef.current, {
                opacity: 0.6,
                scale: 1.02,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, barRef);
        return () => ctx.revert();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && !isLoading) {
            onSearch(query.trim(), mode);
        }
    };

    return (
        <div ref={barRef} className="w-full max-w-4xl mx-auto relative">
            {/* Glow effect behind */}
            <div
                ref={glowRef}
                className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                style={{
                    background: mode === 'research'
                        ? 'linear-gradient(135deg, #06b6d4, #8b5cf6, #06b6d4)'
                        : 'linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6)',
                }}
            />

            <div className="relative backdrop-blur-xl bg-neutral-900/80 border border-neutral-700/50 rounded-2xl p-1.5 shadow-2xl">
                {/* Mode Toggle */}
                <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                    <button
                        onClick={() => setMode('quick')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'quick'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        <Zap className="w-3 h-3" />
                        Quick Search
                    </button>
                    <button
                        onClick={() => setMode('research')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'research'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        <BookOpen className="w-3 h-3" />
                        Research Mode
                    </button>
                    <div className="ml-auto flex items-center gap-1.5 text-[10px] text-neutral-600">
                        <Sparkles className="w-3 h-3" />
                        Powered by Gemini AI
                    </div>
                </div>

                {/* Search Input */}
                <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
                    <Search className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={mode === 'research'
                            ? 'Enter a topic for deep research analysis...'
                            : 'Search anything... AI will find and summarize for you'
                        }
                        className="flex-1 bg-transparent text-white text-lg placeholder-neutral-600 outline-none"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${isLoading
                            ? 'bg-neutral-700 text-neutral-400 cursor-wait'
                            : query.trim()
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105'
                                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Thinking...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                {mode === 'research' ? 'Research' : 'Search'}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
