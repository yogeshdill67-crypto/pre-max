import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, RefreshCw, ShoppingBag, Check } from 'lucide-react';
import { fetchStockImages, generateAIImages } from '../utils/imageService';

interface ImagePickerProps {
    initialKeyword: string;
    initialPrompt?: string;
    onSelect: (url: string) => void;
    onClose: () => void;
    showAI?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
    initialKeyword,
    initialPrompt,
    onSelect,
    onClose,
    showAI: initialShowAI = false
}) => {
    const [keyword, setKeyword] = useState(initialKeyword);
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAI, setShowAI] = useState(initialShowAI);

    const loadImages = async () => {
        if (!keyword) return;
        setLoading(true);
        // Clear images immediately to show loading state cleanly
        setImages([]);

        try {
            // If AI is on, we ONLY load AI images to avoid mixing and confusion, 
            // or we could mix them. Let's start with AI only if showAI is true, 
            // or maybe user wants both? The original code mixed them.
            // Let's stick to the behavior: if showAI, load AI. If not, load Stock.

            if (showAI) {
                const prompt = initialPrompt || `cinematic shot of ${keyword}, 8k, realistic`;
                const aiUrls = await generateAIImages(keyword, prompt, 2); // Generate 2 high quality
                setImages(aiUrls);
            } else {
                const stockUrls = await fetchStockImages(keyword, 8);
                setImages(stockUrls);
            }
        } catch (error) {
            console.error("Failed to load images", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadImages();
    }, [showAI]); // Reload when AI toggles

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadImages();
    };

    const getSource = (url: string) => {
        if (url.includes('wikimedia')) return 'Web';
        if (url.includes('pollinations')) return 'AI';
        return 'Unknown';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 border border-neutral-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] min-h-[500px]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-blue-400">Select Image</span>
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full bg-neutral-800 border-none rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Search for images..."
                        />
                    </form>
                    <button
                        onClick={() => setShowAI(!showAI)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${showAI
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        {showAI ? 'AI On' : 'Enable AI'}
                    </button>
                    <button
                        onClick={() => loadImages()}
                        className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                            <p>Finding the best images...</p>
                        </div>
                    ) : images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {images.map((url, i) => (
                                <button
                                    key={i}
                                    onClick={() => onSelect(url)}
                                    className="group relative aspect-video rounded-lg overflow-hidden border border-neutral-800 hover:border-blue-500 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-900"
                                >
                                    <img
                                        src={url}
                                        alt={`Result ${i}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                            // Show fallback icon in parent
                                            const parent = img.parentElement;
                                            if (parent) {
                                                const fallback = document.createElement('div');
                                                fallback.className = 'absolute inset-0 flex items-center justify-center text-neutral-600';
                                                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                parent.appendChild(fallback);
                                                parent.classList.add('cursor-not-allowed', 'opacity-50');
                                                parent.setAttribute('disabled', 'true');
                                            }
                                        }}
                                    />
                                    <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold backdrop-blur-sm ${getSource(url) === 'Web' ? 'bg-blue-500/80 text-white' : 'bg-purple-500/80 text-white'}`}>
                                        {getSource(url) === 'Web' ? 'WEB' : 'AI'}
                                    </div>
                                    <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-blue-500 p-1.5 rounded-full text-white shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                            <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                            <p>No images found for "{keyword}"</p>
                            {!showAI && (
                                <button onClick={() => setShowAI(true)} className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline">
                                    Try AI generation?
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
