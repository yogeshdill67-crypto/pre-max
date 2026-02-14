import React, { useRef, useLayoutEffect } from 'react';
import { Lightbulb, AlertTriangle, BarChart3, Target, Zap, Copy, Check } from 'lucide-react';
import gsap from 'gsap';

interface KeyPoint {
    text: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
}

interface KeyPointsPanelProps {
    keyPoints: KeyPoint[];
    summary?: string;
    isLoading: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
    concept: Lightbulb,
    data: BarChart3,
    insight: Target,
    action: Zap,
    warning: AlertTriangle,
};

const categoryColors: Record<string, string> = {
    concept: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    data: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    insight: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    action: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const importanceBadge: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
};

export const KeyPointsPanel: React.FC<KeyPointsPanelProps> = ({ keyPoints, summary, isLoading }) => {
    const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (keyPoints.length > 0 && containerRef.current) {
            const ctx = gsap.context(() => {
                gsap.from('.kp-card', {
                    x: -20,
                    opacity: 0,
                    duration: 0.4,
                    stagger: 0.06,
                    ease: 'power2.out',
                });
            }, containerRef);
            return () => ctx.revert();
        }
    }, [keyPoints]);

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                <div className="w-10 h-10 border-2 border-neutral-700 border-t-cyan-500 rounded-full animate-spin mb-4" />
                <p className="text-sm">Extracting key points...</p>
            </div>
        );
    }

    if (keyPoints.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
                <Lightbulb className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Key points will appear here after searching</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="space-y-4">
            {summary && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-neutral-800">
                    <p className="text-sm text-neutral-300 leading-relaxed">{summary}</p>
                </div>
            )}

            <div className="space-y-2">
                {keyPoints.map((kp, i) => {
                    const Icon = categoryIcons[kp.category] || Lightbulb;
                    const colorClass = categoryColors[kp.category] || categoryColors.concept;
                    const badgeClass = importanceBadge[kp.importance] || importanceBadge.medium;

                    return (
                        <div
                            key={i}
                            className={`kp-card group flex items-start gap-3 p-3 rounded-xl border border-neutral-800/50 bg-neutral-900/50 hover:bg-neutral-800/50 transition-all duration-200`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-neutral-200 leading-relaxed">{kp.text}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeClass}`}>
                                        {kp.importance}
                                    </span>
                                    <span className="text-[10px] text-neutral-600 capitalize">{kp.category}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleCopy(kp.text, i)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-neutral-700 transition-all"
                            >
                                {copiedIdx === i ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
