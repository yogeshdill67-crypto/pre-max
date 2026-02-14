import React, { useRef, useLayoutEffect, useState } from 'react';
import {
    BarChart3, TrendingUp, BookOpen, FolderKanban, FlaskConical,
    Palette, Code2, Megaphone, FileSearch, ArrowLeft, Upload, Sparkles, ArrowRight
} from 'lucide-react';
import gsap from 'gsap';
import { CONTENT_TYPES, TemplateChoice } from '../types';

const iconMap: Record<string, React.ElementType> = {
    BarChart3, TrendingUp, BookOpen, FolderKanban, FlaskConical,
    Palette, Code2, Megaphone, FileSearch,
};

interface ContentSelectorProps {
    onComplete: (contentType: string, templateChoice: TemplateChoice, templateFile?: File) => void;
    onBack: () => void;
}

export const ContentSelector: React.FC<ContentSelectorProps> = ({ onComplete, onBack }) => {
    const [step, setStep] = useState<'types' | 'template'>('types');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.content-card', {
                y: 40,
                opacity: 0,
                duration: 0.5,
                stagger: 0.05,
                ease: 'power2.out',
            });
        }, containerRef);
        return () => ctx.revert();
    }, [step]);

    const handleTypeSelect = (typeId: string) => {
        setSelectedType(typeId);
        // Animate out then switch step
        gsap.to('.content-card', {
            y: -20,
            opacity: 0,
            duration: 0.3,
            stagger: 0.03,
            ease: 'power2.in',
            onComplete: () => setStep('template'),
        });
    };

    const handleTemplateChoice = (choice: TemplateChoice) => {
        if (choice === 'upload') {
            // Trigger file pick
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pptx,.ppt';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    onComplete(selectedType!, 'upload', file);
                }
            };
            input.click();
        } else {
            onComplete(selectedType!, 'auto');
        }
    };

    const selectedConfig = CONTENT_TYPES.find(c => c.id === selectedType);

    return (
        <div ref={containerRef} className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950 text-white overflow-hidden relative">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <div className="z-10 w-full max-w-5xl mb-8">
                <button
                    onClick={step === 'template' ? () => setStep('types') : onBack}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">{step === 'template' ? 'Back to Content Types' : 'Back to Modes'}</span>
                </button>

                <div className="text-center">
                    <p className="text-sm text-blue-400 font-medium tracking-wider uppercase mb-2">
                        {step === 'types' ? 'Step 1 of 2' : 'Step 2 of 2'}
                    </p>
                    <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {step === 'types'
                            ? 'What should your PPT contain?'
                            : `${selectedConfig?.title} — Choose a Template`}
                    </h2>
                    <p className="text-neutral-400 text-lg">
                        {step === 'types'
                            ? 'Select the type of content for your presentation'
                            : 'Upload your own reference template or let AI generate one'}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div ref={gridRef} className="z-10 w-full max-w-5xl">
                {step === 'types' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {CONTENT_TYPES.map((ct) => {
                            const Icon = iconMap[ct.icon];
                            return (
                                <div
                                    key={ct.id}
                                    onClick={() => handleTypeSelect(ct.id)}
                                    className="content-card group cursor-pointer p-6 rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm hover:border-blue-500/50 hover:bg-neutral-800/80 transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                                            <Icon className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">{ct.title}</h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">{ct.description}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Upload Template */}
                        <div
                            onClick={() => handleTemplateChoice('upload')}
                            className="content-card group cursor-pointer p-8 rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-900/60 backdrop-blur-sm hover:border-blue-500/60 hover:bg-neutral-800/60 transition-all duration-300 flex flex-col items-center text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="w-10 h-10 text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-orange-300 transition-colors">Upload Template</h3>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                Upload your own <strong>.pptx</strong> reference file. Its style will be applied to <em>all slides</em>.
                            </p>
                        </div>

                        {/* Auto Template */}
                        <div
                            onClick={() => handleTemplateChoice('auto')}
                            className="content-card group cursor-pointer p-8 rounded-2xl border-2 border-neutral-700 bg-neutral-900/60 backdrop-blur-sm hover:border-purple-500/60 hover:bg-neutral-800/60 transition-all duration-300 flex flex-col items-center text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-10 h-10 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-purple-300 transition-colors">Auto Template</h3>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                Let <strong>Pre Max AI</strong> generate a beautiful theme automatically based on your content type.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
