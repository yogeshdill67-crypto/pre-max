import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ContentSelector } from './components/ContentSelector';
import { SlidePreview } from './components/SlidePreview';
import { NotebookPage } from './components/NotebookPage';
import { ImageSelector } from './components/ImageSelector';
import { KeyPointsSelector } from './components/KeyPointsSelector';
import { AppMode, AppStep, TemplateChoice, PresentationResult } from './types';
import { InfographicStudio } from './components/InfographicStudio';

function App() {
    const [step, setStep] = useState<AppStep>('landing');
    const [mode, setMode] = useState<AppMode>(null);
    const [contentType, setContentType] = useState<string>('');
    const [templateChoice, setTemplateChoice] = useState<TemplateChoice>('auto');
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [slideCount, setSlideCount] = useState(10);
    const [result, setResult] = useState<PresentationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [aiData, setAiData] = useState<any>(null);
    const [userStyle, setUserStyle] = useState('modern');
    const [userGradient, setUserGradient] = useState('auto');

    // New state for analysis flow
    const [analysisPlan, setAnalysisPlan] = useState<any>(null);
    const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);



    const handleContentComplete = (type: string, choice: TemplateChoice, file?: File) => {
        setContentType(type);
        setTemplateChoice(choice);
        if (file) setTemplateFile(file);
        setStep('workspace');
    };

    // Step 1: Analyze Document
    const handleAnalyze = async (file: File) => {
        setStep('generating'); // Reusing generating spinner for "Scanning..."
        setError(null);

        const formData = new FormData();
        formData.append('document', file);
        if (templateFile) formData.append('templateRef', templateFile);

        try {
            const API_BASE = window.location.hostname === 'localhost'
                ? 'http://localhost:3000'
                : `http://${window.location.hostname}:3000`;

            // Call /api/analyze to get the plan
            const response = await fetch(`${API_BASE}/api/analyze`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setAnalysisPlan(data.plan);
                setUploadedFilename(data.filename);
                setStep('keyPointsSelect'); // Go to selection screen
            } else {
                setError(data.error || 'Analysis failed');
                setStep('workspace');
            }
        } catch (err) {
            console.error('Analysis failed:', err);
            setError('Failed to connect to server.');
            setStep('workspace');
        }
    };

    // Step 2: Confirm Key Points & Generate Presentation
    const handleKeyPointsConfirm = async (customPlan: any) => {
        setStep('generating');
        try {
            const API_BASE = window.location.hostname === 'localhost'
                ? 'http://localhost:3000'
                : `http://${window.location.hostname}:3000`;

            const formData = new FormData();
            formData.append('mode', mode || 'office');
            formData.append('slideCount', slideCount.toString());
            formData.append('contentType', contentType);
            formData.append('userStyle', userStyle);
            formData.append('userGradient', userGradient);

            // Pass the custom plan as JSON
            formData.append('customPlan', JSON.stringify(customPlan));

            // Pass the existing filename so we don't need to re-upload
            if (uploadedFilename) {
                formData.append('existingFilename', uploadedFilename);
            }
            // Note: We don't append 'document' here because it's already on server

            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setAiData(data.data);
                setResult({
                    title: data.data.title,
                    mode: data.data.mode,
                    theme: data.data.theme || undefined,
                    slides: data.data.slides,
                    downloadUrl: '',
                });
                setStep('imageSelect');
            } else {
                setError(data.error || 'Generation failed');
                setStep('workspace'); // Or back to keyPointsSelect?
            }
        } catch (err) {
            console.error('Generation failed:', err);
            setError('Generation failed. Try again.');
            setStep('keyPointsSelect');
        }
    };

    const handleFinalizeWithImages = async (updatedResult: PresentationResult) => {
        setStep('generating');
        try {
            const API_BASE = window.location.hostname === 'localhost'
                ? 'http://localhost:3000'
                : `http://${window.location.hostname}:3000`;

            const response = await fetch(`${API_BASE}/api/generate-pptx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...aiData,
                    title: updatedResult.title,
                    slides: updatedResult.slides,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setResult({ ...updatedResult, downloadUrl: data.downloadUrl });
                setStep('preview');
            } else {
                setError(data.error || 'PPTX generation failed');
                setStep('imageSelect');
            }
        } catch (err) {
            console.error('PPTX generation failed:', err);
            setError('Failed to generate PPTX. Try again.');
            setStep('imageSelect');
        }
    };

    const handleLandingChoice = (choice: 'upload' | 'notebook' | 'infographic') => {
        if (choice === 'notebook') {
            setStep('notebook');
        } else if (choice === 'infographic') {
            setStep('infographic');
        } else {
            // Document upload flow
            setMode('general');
            setContentType('Document'); // Specific type for this flow
            setStep('workspace');
        }
    };

    // Landing
    if (step === 'landing') {
        return <LandingPage onChoice={handleLandingChoice} />;
    }

    const handleStartPPTFromNotebook = (plan?: any) => {
        setMode('general');
        if (plan && plan.topics) {
            setAnalysisPlan(plan);
            setStep('keyPointsSelect');
        } else {
            // If no plan, go to landing to let them type their request
            setStep('landing');
        }
    };

    // Notebook
    if (step === 'notebook') {
        return (
            <NotebookPage
                onBack={() => { setStep('landing'); setMode(null); }}
                onStartPPT={handleStartPPTFromNotebook}
            />
        );
    }

    // Content type + template selection
    if (step === 'contentSelect') {
        return (
            <ContentSelector
                onComplete={handleContentComplete}
                onBack={() => { setStep('landing'); setMode(null); }}
            />
        );
    }

    // Key Points Selection (New Step)
    if (step === 'keyPointsSelect' && analysisPlan) {
        return (
            <KeyPointsSelector
                plan={analysisPlan}
                onConfirm={handleKeyPointsConfirm}
                onBack={() => setStep('workspace')}
            />
        );
    }

    // Image Selection
    if (step === 'imageSelect' && result) {
        return (
            <ImageSelector
                result={result}
                onConfirm={handleFinalizeWithImages}
                onBack={() => setStep('workspace')}
            />
        );
    }

    // Preview
    if (step === 'preview' && result) {
        return (
            <SlidePreview
                result={result}
                onBack={() => setStep('workspace')}
                onUpdate={handleFinalizeWithImages}
            />
        );
    }

    // Infographic Studio
    if (step === 'infographic') {
        return (
            <InfographicStudio
                onBack={() => setStep('landing')}
            />
        );
    }

    // ─── Style & Gradient Definitions ───
    const styles = [
        { id: 'modern', name: 'Modern', desc: 'Clean, minimal, glassmorphism', icon: '◆' },
        { id: 'classic', name: 'Classic', desc: 'Elegant, serif, refined', icon: '♦' },
        { id: 'bold', name: 'Bold', desc: 'High impact, large headlines', icon: '■' },
        { id: 'minimal', name: 'Minimal', desc: 'Whitespace, understated', icon: '○' },
        { id: 'creative', name: 'Creative', desc: 'Artistic, vibrant, playful', icon: '★' },
    ];

    const gradients = [
        { id: 'auto', name: 'Auto', desc: 'Matches your content', colors: ['#3B82F6', '#8B5CF6'] },
        { id: 'ocean', name: 'Ocean', desc: 'Cool blues', colors: ['#0EA5E9', '#0284C7'] },
        { id: 'sunset', name: 'Sunset', desc: 'Warm tones', colors: ['#F97316', '#EF4444'] },
        { id: 'forest', name: 'Forest', desc: 'Earthy greens', colors: ['#059669', '#10B981'] },
        { id: 'royal', name: 'Royal', desc: 'Purple & gold', colors: ['#7C3AED', '#D4A636'] },
        { id: 'neon', name: 'Neon', desc: 'Electric glow', colors: ['#06B6D4', '#EC4899'] },
        { id: 'aurora', name: 'Aurora', desc: 'Dreamy', colors: ['#34D399', '#A78BFA'] },
        { id: 'monochrome', name: 'Mono', desc: 'Clean grays', colors: ['#E5E7EB', '#6B7280'] },
    ];

    // Workspace (upload + generate)
    return (
        <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
            <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm p-4 flex items-center justify-between">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Pre Max <span className="text-neutral-500 font-normal">/ {contentType.replace('-', ' ')}</span>
                </h1>
                <button
                    onClick={() => setStep('contentSelect')}
                    className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                    ← Back
                </button>
            </header>

            <main className="flex-1 flex items-center justify-center p-8">
                {step === 'generating' ? (
                    <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-neutral-800" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Analyzing Content...</h2>
                        <p className="text-neutral-400">AI is scanning your document for infographic opportunities</p>
                    </div>
                ) : (
                    <div className="max-w-2xl w-full space-y-6">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold mb-2">Customize & Upload</h2>
                            <p className="text-neutral-400">
                                Choose your style, pick a color theme, then upload your file
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* ─── Style Selector ─── */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-300 mb-3">Presentation Style</label>
                            <div className="grid grid-cols-5 gap-2">
                                {styles.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setUserStyle(s.id)}
                                        className={`relative flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${userStyle === s.id
                                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50'
                                            : 'border-neutral-700/50 bg-neutral-900/50 hover:border-neutral-600 hover:bg-neutral-800/50'
                                            }`}
                                    >
                                        <span className="text-2xl mb-1 opacity-70">{s.icon}</span>
                                        <span className="text-xs font-bold">{s.name}</span>
                                        <span className="text-[10px] text-neutral-500 leading-tight text-center mt-0.5">{s.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ─── Color Gradient Picker ─── */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-300 mb-3">Color Theme</label>
                            <div className="grid grid-cols-4 gap-2">
                                {gradients.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setUserGradient(g.id)}
                                        className={`relative flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${userGradient === g.id
                                            ? 'border-blue-500 ring-1 ring-blue-500/50'
                                            : 'border-neutral-700/50 hover:border-neutral-600'
                                            }`}
                                        style={{ backgroundColor: userGradient === g.id ? 'rgba(59,130,246,0.08)' : 'rgba(23,23,23,0.5)' }}
                                    >
                                        <div className="w-full h-6 rounded-lg mb-2 overflow-hidden"
                                            style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }} />
                                        <span className="text-xs font-bold">{g.name}</span>
                                        <span className="text-[10px] text-neutral-500">{g.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ─── File Upload ─── */}
                        <label className="block p-10 border-2 border-dashed border-neutral-700 rounded-2xl text-center hover:bg-neutral-900/50 hover:border-blue-500/50 transition-all cursor-pointer group">
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleAnalyze(f);
                                }}
                                accept=".pdf,.docx,.txt,.md"
                            />
                            <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto mb-3 group-hover:bg-neutral-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" x2="12" y1="3" y2="15" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-white mb-1">Drop your file here or click to browse</p>
                            <p className="text-sm text-neutral-500">Supports PDF, DOCX, TXT, MD</p>
                        </label>

                        {/* ─── Slide Count ─── */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">Slide Count: {slideCount}</label>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                value={slideCount}
                                onChange={(e) => setSlideCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-neutral-600 mt-1">
                                <span>5</span>
                                <span>30</span>
                            </div>
                        </div>

                        {templateChoice === 'upload' && templateFile && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs">
                                Template: {templateFile.name}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
