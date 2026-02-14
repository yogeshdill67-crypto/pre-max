import React, { useState, useRef, useLayoutEffect } from 'react';
import { Loader2, Sparkles, Download, Image as ImageIcon } from 'lucide-react';
import gsap from 'gsap';

interface InfographicPanelProps {
    initialTopic?: string;
    onDataGenerated?: (data: any) => void;
}

const STYLES = [
    { id: 'corporate', label: 'Corporate', emoji: '💼' },
    { id: 'vibrant', label: 'Vibrant', emoji: '🎨' },
    { id: 'minimal', label: 'Minimal', emoji: '✨' },
    { id: 'academic', label: 'Academic', emoji: '📚' },
    { id: 'scientific', label: 'Scientific', emoji: '🧬' },
];

export const InfographicPanel: React.FC<InfographicPanelProps> = ({ initialTopic = '', onDataGenerated }) => {
    const [topic, setTopic] = useState(initialTopic);
    const [style, setStyle] = useState('corporate');
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : `http://${window.location.hostname}:3000`;

    useLayoutEffect(() => {
        if (imageUrl && containerRef.current) {
            gsap.from(containerRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
            });
        }
    }, [imageUrl]);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        // Enhance prompt with style
        const enhancedPrompt = `Infographic poster about ${topic}. Style: ${style}. High resolution, professional design, clear text, detailed visualization.`;

        try {
            const response = await fetch(`${API_BASE}/api/generate-infographic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: enhancedPrompt, style }),
            });
            const result = await response.json();

            if (result.success) {
                if (result.imageUrl) setImageUrl(result.imageUrl);
                if (result.data && onDataGenerated) {
                    onDataGenerated(result.data);
                }
            } else {
                setError(result.error || 'Generation failed');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!imageUrl) return;
        try {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `infographic-${topic.replace(/\s+/g, '-').toLowerCase()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Download failed:', err);
            // Fallback
            window.open(imageUrl, '_blank');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                {/* Input Bar */}
                <div className="flex gap-3 mb-6">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Describe your infographic topic..."
                        className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 text-sm outline-none focus:border-cyan-500/50 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isLoading}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-sm font-semibold disabled:opacity-40 hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate Poster
                    </button>
                </div>

                {/* Style Selector */}
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-neutral-500 font-medium py-1.5 px-2">Style:</span>
                    {STYLES.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setStyle(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${style === s.id
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-neutral-950 text-neutral-500 border border-neutral-800 hover:text-neutral-300'
                                }`}
                        >
                            <span>{s.emoji}</span>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Infographic Poster Display */}
            <div className="min-h-[400px] flex items-center justify-center bg-neutral-900/30 border border-neutral-800/50 rounded-2xl overflow-hidden relative group">
                {isLoading ? (
                    <div className="text-center p-12">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-neutral-800" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-cyan-500 border-b-transparent border-l-transparent animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-neutral-600 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Designing Infographic...</h3>
                        <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                            Using Imagen 4.0 model to generate a professional visual summary for "{topic}"
                        </p>
                    </div>
                ) : imageUrl ? (
                    <div ref={containerRef} className="relative w-full h-full">
                        <img
                            src={imageUrl}
                            alt={`Infographic about ${topic}`}
                            className="w-full h-auto object-contain max-h-[800px] shadow-2xl"
                        />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 text-white text-sm font-medium backdrop-blur-md hover:bg-black transition-colors shadow-lg border border-white/10"
                            >
                                <Download className="w-4 h-4" />
                                Download PNG
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-12 opacity-50">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-neutral-700" />
                        <p className="text-neutral-500">Enter a topic and generate a stunning infographic poster</p>
                    </div>
                )}
            </div>
        </div>
    );
};
