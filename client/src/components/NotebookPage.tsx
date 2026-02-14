import React, { useState, useRef, useLayoutEffect } from 'react';
import {
    ArrowLeft, FileText, BookOpen, Sparkles, AlertCircle,
    Search, Lightbulb, Image, Presentation, MessageSquare,
    FileUp, FileDown, FileScan, FileCheck, ArrowRightLeft,
    ChevronRight, ExternalLink, Loader2, Globe, Download
} from 'lucide-react';
import gsap from 'gsap';
import { AISearchBar } from './AISearchBar';
import { KeyPointsPanel } from './KeyPointsPanel';
import { FileConverterPanel } from './FileConverterPanel';
import { InfographicPanel } from './InfographicPanel';

type MainView = 'home' | 'converter' | 'notes';
type NotesSubView = 'search' | 'keypoints' | 'infographic';

interface SearchSection {
    heading: string;
    content: string;
}

interface KeyPoint {
    text: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
}

interface SearchData {
    title: string;
    summary: string;
    sections: SearchSection[];
    keyPoints: KeyPoint[];
    suggestedTopics?: string[];
    links?: { title: string; url: string; snippet: string }[];
    images?: { prompt: string; caption: string; generatedUrl?: string }[];
}

interface NotebookPageProps {
    onBack: () => void;
    onStartPPT: (plan?: any) => void;
}

// ── Converter tool cards (LovePDF-style) ─────────────────────
const CONVERTER_TOOLS = [
    {
        id: 'pdf-to-text',
        label: 'PDF to Text',
        desc: 'Extract all text content from a PDF file',
        icon: FileScan,
        accept: '.pdf',
        gradient: 'from-red-500 to-orange-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
    },
    {
        id: 'docx-to-text',
        label: 'DOCX to Text',
        desc: 'Convert Word documents to plain text',
        icon: FileDown,
        accept: '.docx',
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
    },
    {
        id: 'txt-extract',
        label: 'TXT / MD Reader',
        desc: 'Read and preview text or markdown files',
        icon: FileCheck,
        accept: '.txt,.md',
        gradient: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
    },
    {
        id: 'any-to-text',
        label: 'Any File to Text',
        desc: 'Upload any supported document for text extraction',
        icon: ArrowRightLeft,
        accept: '.pdf,.docx,.txt,.md',
        gradient: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-400',
    },
];

interface WebImage {
    title: string;
    image: string;
    thumbnail: string;
    url: string;
    source: string;
}

export const NotebookPage: React.FC<NotebookPageProps> = ({ onBack, onStartPPT }) => {
    const [mainView, setMainView] = useState<MainView>('home');
    const [notesSubView, setNotesSubView] = useState<NotesSubView>('search');
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [resultTab, setResultTab] = useState<'answer' | 'links' | 'images'>('answer');

    // AI state
    const [isSearching, setIsSearching] = useState(false);
    const [searchData, setSearchData] = useState<SearchData | null>(null);
    const [infographicData, setInfographicData] = useState<any>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState('');
    const [lastQuery, setLastQuery] = useState('');
    const [lastMode, setLastMode] = useState<'quick' | 'research'>('quick');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});

    // Web Image state
    const [webImages, setWebImages] = useState<WebImage[]>([]);
    const [visibleWebImages, setVisibleWebImages] = useState<WebImage[]>([]);
    const [page, setPage] = useState(1);
    const [isWebImageLoading, setIsWebImageLoading] = useState(false);
    const [imageSource, setImageSource] = useState<'ai' | 'web'>('web');

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : `http://${window.location.hostname}:3000`;

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.nb-anim', {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.06,
                ease: 'power2.out',
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    useLayoutEffect(() => {
        if (contentRef.current) {
            gsap.fromTo(contentRef.current,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
            );
        }
    }, [mainView, notesSubView, selectedTool, resultTab]);

    // ── Search handler ─────────────────
    const handleSearch = async (query: string, mode: 'quick' | 'research') => {
        setIsSearching(true);
        setSearchData(null);
        setSearchError(null);
        setLastQuery(query);
        setLastMode(mode);
        setNotesSubView('search');
        setResultTab('answer');

        // Reset web images
        setWebImages([]);
        setVisibleWebImages([]);
        setPage(1);
        setIsWebImageLoading(false);

        try {
            const response = await fetch(`${API_BASE}/api/ai-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, mode }),
            });
            const result = await response.json();

            if (result.success && result.data) {
                setSearchData(result.data);
                setSearchError(null);
                setSearchHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 10));

                // Pre-fetch web images in background
                fetchWebImages(query);

                if (mode === 'research') {
                    // setTimeout(() => setNotesSubView('keypoints'), 500); 
                }
            } else {
                setSearchError(result.error || 'Search failed. Please try again.');
            }
        } catch (err: any) {
            setSearchError(`Connection error: ${err.message || 'Could not reach server.'}`);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchWebImages = async (query: string) => {
        setIsWebImageLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/search-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const result = await response.json();
            if (result.success && result.images) {
                setWebImages(result.images);
                setVisibleWebImages(result.images.slice(0, 20));
                setPage(1);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsWebImageLoading(false);
        }
    };

    const loadMoreWebImages = () => {
        const nextPage = page + 1;
        const newImages = webImages.slice(0, nextPage * 20);
        setVisibleWebImages(newImages);
        setPage(nextPage);
    };

    const handleGenerateImage = async (imgIdx: number) => {
        if (!searchData || !searchData.images || !searchData.images[imgIdx]) return;

        setImageLoading(prev => ({ ...prev, [imgIdx]: true }));
        try {
            const response = await fetch(`${API_BASE}/api/clipdrop/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: searchData.images[imgIdx].prompt }),
            });
            const result = await response.json();

            if (result.success && result.image) {
                setSearchData((prev: any) => {
                    if (!prev || !prev.images) return prev;
                    const newImages = [...prev.images];
                    newImages[imgIdx] = { ...newImages[imgIdx], generatedUrl: result.image };
                    return { ...prev, images: newImages };
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setImageLoading(prev => ({ ...prev, [imgIdx]: false }));
        }
    };

    const handleDownloadImage = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: just open in new tab
            window.open(url, '_blank');
        }
    };

    const handleTextExtracted = (text: string, _filename: string) => {
        setExtractedText(text);
    };

    const handleExtractKeyPoints = async () => {
        if (!extractedText) return;
        setMainView('notes');
        setNotesSubView('keypoints');
        setIsSearching(true);
        try {
            const response = await fetch(`${API_BASE}/api/extract-keypoints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: extractedText }),
            });
            const result = await response.json();
            if (result.success) {
                setSearchData(prev => ({
                    title: prev?.title || 'Extracted Content',
                    summary: result.data.summary || '',
                    sections: prev?.sections || [],
                    keyPoints: result.data.keyPoints || [],
                }));
            }
        } catch (err) {
            console.error('Key point extraction failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleStartPPT = () => {
        // If we have search data or infographic data, build a plan
        if (searchData || infographicData) {
            const topics: any[] = [];

            // 1. Add title slide
            topics.push({
                title: searchData?.title || infographicData?.title || "Overview",
                description: searchData?.summary || infographicData?.subtitle || "Key Information Summary",
                visualType: "section"
            });

            // 2. Add sections from infographic if available (prioritize this as per user request)
            if (infographicData?.sections) {
                infographicData.sections.forEach((s: any) => {
                    topics.push({
                        title: s.heading,
                        description: s.content,
                        visualType: s.stat ? "data_visual" : "standard",
                        stat: s.stat ? { label: s.stat.label, value: s.stat.value } : undefined
                    });
                });
            } else if (searchData?.sections) {
                // Otherwise use search sections
                searchData.sections.forEach(s => {
                    topics.push({
                        title: s.heading,
                        description: s.content,
                        visualType: "standard"
                    });
                });
            }

            // 3. Add key points if not too many slides already
            if (searchData?.keyPoints && topics.length < 10) {
                topics.push({
                    title: "Key Insights",
                    description: searchData.keyPoints.map(kp => kp.text).slice(0, 5).join(". "),
                    visualType: "standard"
                });
            }

            onStartPPT({ topics });
        } else {
            // Fallback to manual mode if no data
            onStartPPT();
        }
    };

    // ── RENDER ──────────────────────────
    return (
        <div ref={containerRef} className="flex flex-col min-h-screen bg-neutral-950 text-white">
            {/* ─── Header ─── */}
            <header className="nb-anim border-b border-neutral-800/50 bg-neutral-900/30 backdrop-blur-xl px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (mainView === 'home') onBack();
                                else { setMainView('home'); setSelectedTool(null); }
                            }}
                            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                                AI Notebook
                            </h1>
                            {mainView !== 'home' && (
                                <span className="text-neutral-600 text-sm ml-1">
                                    / {mainView === 'converter' ? 'Converter' : 'AI Notes'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <Sparkles className="w-3 h-3" />
                        Gemini AI Powered
                    </div>
                </div>
            </header>

            {/* ─── HOME VIEW — Two big cards ─── */}
            {mainView === 'home' && (
                <div className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                        {/* Converter Card */}
                        <button
                            onClick={() => setMainView('converter')}
                            className="nb-anim group relative overflow-hidden rounded-3xl border border-neutral-800/50 bg-neutral-900/30 backdrop-blur p-8 text-left transition-all duration-300 hover:border-red-500/30 hover:bg-neutral-900/50 hover:shadow-2xl hover:shadow-red-500/5 hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <ArrowRightLeft className="w-8 h-8 text-red-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">File Converter</h2>
                                <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                                    Extract text from PDF, DOCX, TXT, and Markdown files instantly.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {['PDF', 'DOCX', 'TXT', 'MD'].map(ext => (
                                        <span key={ext} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                            .{ext}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1 mt-4 text-sm text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Open Converter <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </button>

                        {/* AI Notes Card */}
                        <button
                            onClick={() => setMainView('notes')}
                            className="nb-anim group relative overflow-hidden rounded-3xl border border-neutral-800/50 bg-neutral-900/30 backdrop-blur p-8 text-left transition-all duration-300 hover:border-cyan-500/30 hover:bg-neutral-900/50 hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-8 h-8 text-cyan-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">AI Notes Maker</h2>
                                <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                                    Search any topic with AI, get structured notes with key points, and create infographics & presentations.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {['Search', 'Key Points', 'Infographic', 'PPT'].map(f => (
                                        <span key={f} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1 mt-4 text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Open Notes <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* ─── CONVERTER VIEW — LovePDF-style grid ─── */}
            {mainView === 'converter' && !selectedTool && (
                <div ref={contentRef} className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-2">File Converter</h2>
                        <p className="text-neutral-500">Choose a conversion tool to get started</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {CONVERTER_TOOLS.map(tool => {
                            const Icon = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool.id)}
                                    className={`group relative overflow-hidden rounded-2xl border ${tool.border} ${tool.bg} p-6 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-xl`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} bg-opacity-20 flex items-center justify-center mb-4`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className={`text-base font-semibold ${tool.text} mb-1`}>{tool.label}</h3>
                                        <p className="text-xs text-neutral-500 leading-relaxed">{tool.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick actions at bottom */}
                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={() => { setMainView('notes'); setNotesSubView('search'); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Switch to AI Notes
                        </button>
                        <button
                            onClick={handleStartPPT}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
                        >
                            <Presentation className="w-4 h-4" />
                            Make PPT
                        </button>
                    </div>
                </div>
            )}

            {/* ─── CONVERTER — Active tool ─── */}
            {mainView === 'converter' && selectedTool && (
                <div ref={contentRef} className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
                    {(() => {
                        const tool = CONVERTER_TOOLS.find(t => t.id === selectedTool);
                        const Icon = tool?.icon || FileUp;
                        return (
                            <div>
                                <button
                                    onClick={() => setSelectedTool(null)}
                                    className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-6 transition-colors"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Back to tools
                                </button>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool?.gradient || 'from-blue-500 to-cyan-500'} flex items-center justify-center`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{tool?.label}</h2>
                                        <p className="text-xs text-neutral-500">{tool?.desc}</p>
                                    </div>
                                </div>

                                <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6">
                                    <FileConverterPanel onTextExtracted={handleTextExtracted} />

                                    {extractedText && (
                                        <div className="mt-5 pt-5 border-t border-neutral-800/50 flex flex-wrap gap-3">
                                            <button
                                                onClick={handleExtractKeyPoints}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-all hover:scale-[1.02]"
                                            >
                                                <Lightbulb className="w-4 h-4" />
                                                Extract Key Points with AI
                                            </button>
                                            <button
                                                onClick={handleStartPPT}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-all hover:scale-[1.02]"
                                            >
                                                <Presentation className="w-4 h-4" />
                                                Make PPT from this
                                            </button>
                                            <button
                                                onClick={() => { setMainView('notes'); setNotesSubView('search'); }}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all hover:scale-[1.02]"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Open AI Notes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ─── AI NOTES VIEW ─── */}
            {mainView === 'notes' && (
                <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-4">
                    {/* Search Bar */}
                    <div ref={contentRef} className="mb-6">
                        <AISearchBar onSearch={handleSearch} isLoading={isSearching} />
                    </div>

                    <div className="flex-1 flex gap-6">
                        {/* Left sidebar with sub-views */}
                        <aside className="w-52 flex-shrink-0 space-y-3">
                            {[
                                { id: 'search' as NotesSubView, label: 'AI Search', icon: Search, color: 'cyan' },
                                { id: 'keypoints' as NotesSubView, label: 'Key Points', icon: Lightbulb, color: 'amber' },
                                { id: 'infographic' as NotesSubView, label: 'Infographic', icon: Image, color: 'purple' },
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = notesSubView === tab.id;
                                const hasData = tab.id === 'keypoints' && searchData?.keyPoints?.length;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setNotesSubView(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${isActive
                                            ? `bg-${tab.color}-500/10 text-${tab.color}-400 border border-${tab.color}-500/20`
                                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
                                            }`}
                                        style={isActive ? {
                                            backgroundColor: tab.color === 'cyan' ? 'rgba(6,182,212,0.1)' :
                                                tab.color === 'amber' ? 'rgba(245,158,11,0.1)' : 'rgba(168,85,247,0.1)',
                                            color: tab.color === 'cyan' ? '#22d3ee' :
                                                tab.color === 'amber' ? '#fbbf24' : '#c084fc',
                                            borderColor: tab.color === 'cyan' ? 'rgba(6,182,212,0.2)' :
                                                tab.color === 'amber' ? 'rgba(245,158,11,0.2)' : 'rgba(168,85,247,0.2)',
                                        } : {}}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="flex-1 text-left">{tab.label}</span>
                                        {hasData && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                                    </button>
                                );
                            })}

                            {/* Divider */}
                            <div className="border-t border-neutral-800/50 pt-3">
                                <button
                                    onClick={handleStartPPT}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                >
                                    <Presentation className="w-4 h-4" />
                                    <span className="flex-1 text-left">Make PPT</span>
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => { setMainView('converter'); setSelectedTool(null); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span className="flex-1 text-left">Converter</span>
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Search History */}
                            {searchHistory.length > 0 && (
                                <div className="pt-3 border-t border-neutral-800/50">
                                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2 px-3">History</p>
                                    <div className="space-y-0.5">
                                        {searchHistory.slice(0, 5).map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSearch(q, 'quick')}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-600 hover:text-neutral-300 hover:bg-neutral-900/50 transition-colors truncate"
                                            >
                                                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{q}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>

                        {/* Main content area */}
                        <main className="flex-1 min-w-0">
                            <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6 min-h-[450px] relative">
                                {/* ── Search Results ── */}
                                {notesSubView === 'search' && (
                                    <div className="space-y-6">
                                        {isSearching ? (
                                            <div className="flex flex-col items-center justify-center py-20">
                                                <div className="relative w-16 h-16 mb-6">
                                                    <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
                                                    <div className="absolute inset-0 rounded-full border-2 border-t-cyan-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin" />
                                                </div>
                                                <p className="text-neutral-400 text-sm">AI is researching your query...</p>
                                            </div>
                                        ) : searchData ? (
                                            <div className="flex flex-col h-full">
                                                {/* TAB NAVIGATION */}
                                                <div className="flex items-center gap-2 border-b border-neutral-800 mb-6">
                                                    {[
                                                        { id: 'answer', label: 'Answer', icon: Sparkles },
                                                        { id: 'links', label: 'Links', icon: BookOpen },
                                                        { id: 'images', label: 'Images', icon: Image }
                                                    ].map((t) => {
                                                        const isActive = resultTab === t.id;
                                                        const Icon = t.icon;
                                                        return (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => setResultTab(t.id as any)}
                                                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${isActive
                                                                    ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                                                                    : 'text-neutral-500 border-transparent hover:text-neutral-300 hover:border-neutral-800 hover:bg-neutral-800/40'
                                                                    }`}
                                                            >
                                                                <Icon className="w-4 h-4" />
                                                                {t.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>

                                                {/* TAB CONTENT: ANSWER */}
                                                {resultTab === 'answer' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        <div>
                                                            <h2 className="text-2xl font-bold text-white mb-3">{searchData.title}</h2>
                                                            <p className="text-neutral-400 text-sm leading-relaxed p-4 rounded-xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-neutral-800">
                                                                {searchData.summary}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {searchData.sections?.map((section, i) => (
                                                                <div key={i} className="p-4 rounded-xl border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                                                                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">{section.heading}</h3>
                                                                    <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">{section.content}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {searchData.suggestedTopics && searchData.suggestedTopics.length > 0 && (
                                                            <div className="pt-4 border-t border-neutral-800/50">
                                                                <p className="text-xs text-neutral-600 mb-2">Explore related:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {searchData.suggestedTopics.map((topic, i) => (
                                                                        <button
                                                                            key={i}
                                                                            onClick={() => handleSearch(topic, 'quick')}
                                                                            className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800/50 text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-neutral-800 hover:border-cyan-500/30 transition-all"
                                                                        >
                                                                            {topic}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Action row */}
                                                        <div className="pt-4 border-t border-neutral-800/50 flex flex-wrap gap-3">
                                                            <button onClick={() => setNotesSubView('keypoints')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors">
                                                                <Lightbulb className="w-4 h-4" /> View Key Points
                                                            </button>
                                                            <button onClick={() => setNotesSubView('infographic')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/20 transition-colors">
                                                                <Image className="w-4 h-4" /> Make Infographic
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const plan = {
                                                                        topics: searchData.sections.map(s => ({
                                                                            title: s.heading,
                                                                            description: s.content.substring(0, 150) + '...',
                                                                            visualType: 'standard', // Default
                                                                            reason: 'Derived from search result'
                                                                        }))
                                                                    };
                                                                    onStartPPT(plan);
                                                                }}
                                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
                                                            >
                                                                <Presentation className="w-4 h-4" /> Make Presentation
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TAB CONTENT: LINKS */}
                                                {resultTab === 'links' && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-lg font-semibold text-white">Sources & References</h3>
                                                            {searchData.links && searchData.links.length > 0 && <span className="text-xs text-neutral-500">{searchData.links.length} results</span>}
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {searchData.links?.map((link, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
                                                                >
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <h4 className="text-cyan-400 font-medium truncate group-hover:underline max-w-[90%]">{link.title}</h4>
                                                                        <ExternalLink className="w-3 h-3 text-neutral-600 group-hover:text-cyan-400" />
                                                                    </div>
                                                                    <p className="text-xs text-neutral-500 mb-2 truncate font-mono opacity-70">{link.url}</p>
                                                                    <p className="text-sm text-neutral-400 line-clamp-2">{link.snippet}</p>
                                                                </a>
                                                            ))}
                                                            {(!searchData.links || searchData.links.length === 0) && (
                                                                <div className="col-span-2 flex flex-col items-center justify-center py-16 border-2 border-dashed border-neutral-800 rounded-xl">
                                                                    <BookOpen className="w-10 h-10 text-neutral-700 mb-2" />
                                                                    <p className="text-neutral-500">No specific sources found for this query.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TAB CONTENT: IMAGES */}
                                                {/* TAB CONTENT: IMAGES */}
                                                {resultTab === 'images' && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                                                                <button
                                                                    onClick={() => setImageSource('web')}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${imageSource === 'web'
                                                                        ? 'bg-neutral-800 text-white shadow-sm'
                                                                        : 'text-neutral-500 hover:text-neutral-300'
                                                                        }`}
                                                                >
                                                                    <Globe className="w-3.5 h-3.5" />
                                                                    Web Results
                                                                </button>
                                                                <button
                                                                    onClick={() => setImageSource('ai')}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${imageSource === 'ai'
                                                                        ? 'bg-purple-900/30 text-purple-300 shadow-sm border border-purple-500/20'
                                                                        : 'text-neutral-500 hover:text-neutral-300'
                                                                        }`}
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5" />
                                                                    AI Generated
                                                                </button>
                                                            </div>
                                                            {imageSource === 'ai' && searchData.images && searchData.images.length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        searchData.images?.forEach((_, i) => handleGenerateImage(i));
                                                                    }}
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5" />
                                                                    Generate All
                                                                </button>
                                                            )}
                                                        </div>

                                                        {imageSource === 'web' ? (
                                                            // WEB IMAGES GRID
                                                            <div className="flex flex-col gap-6">
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                                    {visibleWebImages.map((img, i) => (
                                                                        <div
                                                                            key={i}
                                                                            className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 transition-all"
                                                                        >
                                                                            <img
                                                                                src={img.thumbnail || img.image}
                                                                                alt={img.title}
                                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                                            />
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <a
                                                                                        href={img.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="p-1.5 bg-neutral-800/80 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                                                                                        title="Open original"
                                                                                    >
                                                                                        <ExternalLink className="w-4 h-4" />
                                                                                    </a>
                                                                                    <button
                                                                                        onClick={() => handleDownloadImage(img.url, `web-image-${i}.jpg`)}
                                                                                        className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                                                                                        title="Download"
                                                                                    >
                                                                                        <Download className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                                <p className="text-xs text-white font-medium truncate mb-0.5">{img.title}</p>
                                                                                <p className="text-[10px] text-neutral-400 truncate">{img.source}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {isWebImageLoading && (
                                                                        [...Array(4)].map((_, i) => (
                                                                            <div key={`skel-${i}`} className="aspect-square rounded-xl bg-neutral-900 animate-pulse border border-neutral-800" />
                                                                        ))
                                                                    )}
                                                                    {!isWebImageLoading && visibleWebImages.length === 0 && (
                                                                        <div className="col-span-full py-12 text-center text-neutral-500">
                                                                            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                                            <p>No web images found.</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Load More Button */}
                                                                {visibleWebImages.length < webImages.length && (
                                                                    <div className="flex justify-center pt-2 pb-6">
                                                                        <button
                                                                            onClick={loadMoreWebImages}
                                                                            className="px-6 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                                                                        >
                                                                            Load More Images
                                                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            // AI IMAGES GRID (Existing)
                                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {searchData.images?.map((img, i) => (
                                                                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 transition-all">
                                                                        {img.generatedUrl ? (
                                                                            <div className="relative w-full h-full group/img">
                                                                                <img src={img.generatedUrl} alt={img.caption} className="w-full h-full object-cover" />
                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                                                    <a href={img.generatedUrl} download={`image-${i}.svg`} className="p-2 bg-neutral-900/80 rounded-lg text-white hover:text-cyan-400 trasition-colors">
                                                                                        <ExternalLink className="w-5 h-5" />
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        ) : imageLoading[i] ? (
                                                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 gap-3">
                                                                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                                                                                <p className="text-xs text-neutral-500">Creating...</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="absolute inset-0 flex flex-col items-center justify-between p-6 bg-neutral-800/30 text-center">
                                                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                                                    <p className="text-xs text-neutral-400 italic line-clamp-4 mb-4">
                                                                                        "{img.prompt}"
                                                                                    </p>
                                                                                    <button
                                                                                        onClick={() => handleGenerateImage(i)}
                                                                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                                                                                    >
                                                                                        <Sparkles className="w-3.5 h-3.5" />
                                                                                        Generate Art
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/80 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none">
                                                                            <p className="text-xs text-white truncate">{img.caption}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!searchData.images || searchData.images.length === 0) && (
                                                                    <div className="col-span-3 flex flex-col items-center justify-center py-16 border-2 border-dashed border-neutral-800 rounded-xl">
                                                                        <Image className="w-10 h-10 text-neutral-700 mb-2" />
                                                                        <p className="text-neutral-500">No visual concepts found for this query.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : searchError ? (
                                            <div className="flex flex-col items-center justify-center py-16">
                                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                                </div>
                                                <p className="text-lg font-medium text-red-400 mb-2">Search Failed</p>
                                                <p className="text-sm text-neutral-500 text-center max-w-md mb-4">{searchError}</p>
                                                <button
                                                    onClick={() => handleSearch(lastQuery, lastMode)}
                                                    className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
                                                <Search className="w-16 h-16 mb-4 opacity-20" />
                                                <p className="text-lg font-medium mb-1">Search anything with AI</p>
                                                <p className="text-sm text-neutral-700">Type a query above to get AI-powered research & notes</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Key Points ── */}
                                {notesSubView === 'keypoints' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-amber-400" />
                                            Key Points
                                        </h3>
                                        <KeyPointsPanel
                                            keyPoints={searchData?.keyPoints || []}
                                            summary={searchData?.summary}
                                            isLoading={isSearching}
                                        />
                                    </div>
                                )}

                                {/* ── Infographic ── */}
                                {notesSubView === 'infographic' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Image className="w-5 h-5 text-purple-400" />
                                            Infographic / Poster
                                        </h3>
                                        <InfographicPanel
                                            initialTopic={searchData?.title || ''}
                                            onDataGenerated={(data) => setInfographicData(data)}
                                        />
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
};
