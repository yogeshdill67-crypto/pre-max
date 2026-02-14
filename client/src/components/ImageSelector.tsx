import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, RefreshCw, Image as ImageIcon, Sparkles, Download, Globe, Search, ShoppingBag, Info } from 'lucide-react';
import { PresentationResult } from '../types';

interface ImageSelectorProps {
    result: PresentationResult;
    onConfirm: (updatedResult: PresentationResult) => void;
    onBack: () => void;
}

// Fetch stock images from Wikimedia Commons
const fetchStockImages = async (keyword: string, count: number = 8): Promise<string[]> => {
    try {
        // Search specifically for photos (jpeg/jpg) - prioritize high quality
        const k = encodeURIComponent(keyword + ' filetype:jpg -historical -drawing -chart');
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${k}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json&origin=*&gsrlimit=20`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.query || !data.query.pages) return [];

        // Extract URLs from pages
        return Object.values(data.query.pages)
            .map((p: any) => p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url)
            .filter(Boolean)
            .slice(0, count);
    } catch (e) {
        console.error("Wikimedia fetch failed", e);
        return [];
    }
};

// Generate AI URLs (synchronous)
const generateAIUrls = (keyword: string, prompt?: string, count: number = 4): string[] => {
    const urls: string[] = [];
    const p = prompt || `cinematic product shot of ${keyword}, studio lighting, 8k, photorealistic, white background`;
    const encoded = encodeURIComponent(p);
    for (let i = 0; i < count; i++) {
        const seed = Math.floor(Math.random() * 100000) + i;
        urls.push(`https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&seed=${seed}&model=flux`);
    }
    return urls;
};

export const ImageSelector: React.FC<ImageSelectorProps> = ({ result, onConfirm, onBack }) => {
    const [selectedImages, setSelectedImages] = useState<Record<number, string>>({});

    // Store options for each slide
    const [slideOptions, setSlideOptions] = useState<Record<number, string[]>>({});

    const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
    const [showAI, setShowAI] = useState(false); // Default to FALSE per user request
    const [loadingOptions, setLoadingOptions] = useState<Record<number, boolean>>({});
    const [generating, setGenerating] = useState(false);

    // Load options for a specific slide
    const loadSlideOptions = async (slideIdx: number, keyword: string, prompt?: string) => {
        if (!keyword) return;

        setLoadingOptions(prev => ({ ...prev, [slideIdx]: true }));

        // 1. Fetch Stock (Real Images) - User's priority
        const stockCount = showAI ? 4 : 8; // If AI shown, show 4+4. If independent, show 8 real.
        const stockUrls = await fetchStockImages(keyword, stockCount);

        let aiUrls: string[] = [];
        if (showAI) {
            // 2. Generate AI only if requested
            const originalKeyword = result.slides[slideIdx].imageKeyword;
            // Use existing prompt if keyword matches, else new basic prompt
            const usePrompt = (keyword === originalKeyword && prompt) ? prompt : `cinematic detailed shot of ${keyword}, professional photography, 8k, realistic`;
            aiUrls = generateAIUrls(keyword, usePrompt, 4);
        }

        // Combine
        const combined = [...stockUrls, ...aiUrls];

        setSlideOptions(prev => ({ ...prev, [slideIdx]: combined }));

        // Auto-select first available if none selected
        if (!selectedImages[slideIdx] && combined.length > 0) {
            setSelectedImages(prev => ({ ...prev, [slideIdx]: combined[0] }));
        }

        setLoadingOptions(prev => ({ ...prev, [slideIdx]: false }));
    };

    // Reload all when ShowAI toggles
    useEffect(() => {
        result.slides.forEach((slide, i) => {
            const term = searchTerms[i] || slide.imageKeyword || '';
            if (term) loadSlideOptions(i, term, slide.imagePrompt);
        });
    }, [showAI]);

    // Initial load - Handle Visual Types
    useEffect(() => {
        const termMap: Record<number, string> = {};
        result.slides.forEach((slide, i) => {
            let term = slide.imageKeyword || '';

            // Smart Suffix for Visual Types
            // Only add suffix if term doesn't already have it
            if (slide.visualType === 'exploded_view' && !term.includes('exploded')) term += ' exploded view';
            else if (slide.visualType === 'cutaway' && !term.includes('section')) term += ' cross section';
            else if (slide.visualType === 'dashboard' && !term.includes('dashboard')) term += ' dashboard interface';
            else if (slide.visualType === 'flowchart' && !term.includes('diagram')) term += ' process diagram';

            termMap[i] = term;
            loadSlideOptions(i, term, slide.imagePrompt);
        });
        setSearchTerms(termMap);
    }, []);

    const handleSelect = (slideIndex: number, imageUrl: string) => {
        setSelectedImages(prev => ({ ...prev, [slideIndex]: imageUrl }));
    };

    const handleRefresh = (slideIndex: number) => {
        const term = searchTerms[slideIndex];
        const slide = result.slides[slideIndex];
        loadSlideOptions(slideIndex, term, slide.imagePrompt);
    };

    const handleSearchChange = (slideIndex: number, newTerm: string) => {
        setSearchTerms(prev => ({ ...prev, [slideIndex]: newTerm }));
    };

    const handleSearchSubmit = (slideIndex: number) => {
        const term = searchTerms[slideIndex];
        const slide = result.slides[slideIndex];
        if (term) {
            loadSlideOptions(slideIndex, term, slide.imagePrompt);
        }
    };

    const handleConfirm = async () => {
        setGenerating(true);
        const updatedSlides = result.slides.map((slide, i) => ({
            ...slide,
            imageUrl: selectedImages[i] || undefined,
            imageKeyword: searchTerms[i] || slide.imageKeyword
        }));
        onConfirm({ ...result, slides: updatedSlides });
    };

    const getSource = (url: string) => {
        if (url.includes('wikimedia')) return 'Web';
        if (url.includes('pollinations')) return 'AI';
        return 'Unknown';
    };

    const theme = result.theme;
    const accent1 = theme?.accent1 || '3B82F6';
    const accent2 = theme?.accent2 || '8B5CF6';
    const selectedCount = Object.keys(selectedImages).length;
    const totalWithKeywords = result.slides.filter(s => s.imageKeyword).length;

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-neutral-800/50 bg-neutral-900/80 backdrop-blur-xl px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="text-neutral-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5" style={{ color: `#${accent1}` }} />
                                    Select Images
                                </h1>
                                <p className="text-xs text-neutral-500">
                                    {selectedCount} of {totalWithKeywords} slides have images selected
                                </p>
                            </div>
                        </div>

                        {/* AI Toggle */}
                        <button
                            onClick={() => setShowAI(!showAI)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${showAI
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                                }`}
                        >
                            <Sparkles className="w-3 h-3" />
                            {showAI ? 'AI Enabled' : 'Enable AI Images'}
                        </button>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={generating}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                        style={{
                            background: `linear-gradient(135deg, #${accent1}, #${accent2})`,
                            boxShadow: `0 4px 20px rgba(59,130,246,0.3)`,
                        }}
                    >
                        {generating ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating PPT...</>
                        ) : (
                            <><Download className="w-4 h-4" /> Generate PPT</>
                        )}
                    </button>
                </div>
            </header>

            {/* Slides */}
            <main className="max-w-6xl mx-auto p-6 space-y-8">
                {result.slides.map((slide, slideIdx) => {
                    const options = slideOptions[slideIdx] || [];
                    const isLoading = loadingOptions[slideIdx];
                    const selected = selectedImages[slideIdx];
                    const searchTerm = searchTerms[slideIdx] || '';
                    const isComplexVisual = ['exploded_view', 'cutaway', 'flowchart'].includes(slide.visualType || '');

                    return (
                        <div key={slideIdx} className="rounded-2xl border border-neutral-800/50 overflow-hidden bg-neutral-900/30">
                            {/* Slide info header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/30">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                        style={{ background: `linear-gradient(135deg, #${accent1}, #${accent2})` }}>
                                        {slideIdx + 1}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-white">{slide.title}</p>
                                            {slide.visualType && slide.visualType !== 'standard' && (
                                                <span className="text-[9px] uppercase tracking-wider font-bold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                    {slide.visualType.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Editable Search Bar */}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="relative flex items-center">
                                                <Search className="absolute left-2 w-3 h-3 text-neutral-500" />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => handleSearchChange(slideIdx, e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(slideIdx)}
                                                    onBlur={() => handleSearchSubmit(slideIdx)}
                                                    className="pl-7 pr-8 py-1 rounded bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500 w-[200px] transition-colors"
                                                    placeholder="Search product/stock..."
                                                />
                                            </div>
                                            {isComplexVisual && !showAI && (
                                                <div className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 animate-pulse">
                                                    <Info className="w-3 h-3" />
                                                    <span>Tip: Enable AI for best diagrams</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRefresh(slideIdx)}
                                        disabled={isLoading}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> {isLoading ? 'Loading...' : 'Refresh'}
                                    </button>
                                </div>
                            </div>

                            {/* Image grid */}
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-4 min-h-[120px]">
                                {isLoading ? (
                                    <div className="col-span-full flex items-center justify-center py-8 text-neutral-500 text-sm">
                                        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Searching web products...
                                    </div>
                                ) : options.length > 0 ? (
                                    options.map((url, imgIdx) => {
                                        const isSelected = selected === url;
                                        const source = getSource(url);
                                        return (
                                            <button
                                                key={imgIdx}
                                                onClick={() => handleSelect(slideIdx, url)}
                                                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 group ${isSelected
                                                    ? 'border-blue-500 ring-2 ring-blue-500/40 scale-[1.02]'
                                                    : 'border-transparent hover:border-neutral-600'
                                                    }`}
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Option ${imgIdx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                            <Check className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Source badge */}
                                                <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold backdrop-blur-sm ${source === 'Web' ? 'bg-blue-500/80 text-white' : 'bg-purple-500/80 text-white'}`}>
                                                    {source === 'Web' ? 'WEB PRODUCT' : 'AI'}
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-8 text-neutral-500 text-sm">
                                        <ShoppingBag className="w-8 h-8 opacity-20 mb-2" />
                                        <p>No product images found for "{searchTerm}"</p>
                                        {!showAI && isComplexVisual && (
                                            <button onClick={() => setShowAI(true)} className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline">
                                                Try enabling AI matching?
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Bottom bar */}
            <div className="sticky bottom-0 border-t border-neutral-800/50 bg-neutral-900/90 backdrop-blur-xl px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <p className="text-sm text-neutral-400">
                        <span className="font-medium text-white">{selectedCount}</span> images selected
                    </p>
                    <button
                        onClick={handleConfirm}
                        disabled={generating}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                        style={{
                            background: `linear-gradient(135deg, #${accent1}, #${accent2})`,
                            boxShadow: `0 4px 20px rgba(59,130,246,0.3)`,
                        }}
                    >
                        {generating ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                        ) : (
                            <><Download className="w-4 h-4" /> Generate PPT</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
