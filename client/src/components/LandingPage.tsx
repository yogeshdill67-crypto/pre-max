import React, { useRef, useLayoutEffect } from 'react';
import { Sparkles, ArrowRight, Upload } from 'lucide-react';
import gsap from 'gsap';

interface LandingPageProps {
    onChoice: (choice: 'upload' | 'notebook' | 'infographic') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onChoice }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.from(titleRef.current, {
                y: -50,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
            })
                .from('.option-card', {
                    y: 100,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.2,
                    ease: 'back.out(1.7)',
                }, '-=0.5');

        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        gsap.to(e.currentTarget, {
            scale: 1.02,
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            duration: 0.3,
        });
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        gsap.to(e.currentTarget, {
            scale: 1,
            boxShadow: '0 0 0 0 transparent',
            duration: 0.3,
        });
    };

    return (
        <div ref={containerRef} className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950 text-white overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-900 rounded-full blur-[120px]" />
            </div>

            <div className="z-10 text-center mb-16">
                <h1 ref={titleRef} className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 tracking-tight">
                    Pre Max
                </h1>
                <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto font-light">
                    Choose how you want to create your presentation
                </p>
            </div>

            <div ref={cardsRef} className="z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4">
                {/* Option 1: Document to PPT */}
                <div
                    onClick={() => onChoice('upload')}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="option-card relative group cursor-pointer p-10 rounded-3xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm transition-colors hover:border-blue-500/50"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 group-hover:bg-blue-500/20 transition-colors">
                        <Upload className="w-10 h-10 text-blue-400" />
                    </div>

                    <h3 className="text-3xl font-bold mb-4 text-white">Transform Document</h3>
                    <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                        Upload PDF, Word, or Text files and instantly convert them into structured presentations.
                    </p>

                    <div className="flex items-center text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
                        <span>Upload File</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                </div>

                {/* Option 2: AI Notebook */}
                <div
                    onClick={() => onChoice('notebook')}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="option-card relative group cursor-pointer p-10 rounded-3xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm transition-colors hover:border-cyan-500/50"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-8 group-hover:bg-cyan-500/20 transition-colors">
                        <Sparkles className="w-10 h-10 text-cyan-400" />
                    </div>

                    <h3 className="text-3xl font-bold mb-4 text-white">AI Notebook</h3>
                    <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                        Research topics with AI, extract key insights, and generate content from scratch.
                    </p>

                    <div className="flex items-center text-cyan-400 font-medium group-hover:translate-x-2 transition-transform">
                        <span>Open Notebook</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                </div>

                {/* Option 3: Infographic Poster */}
                <div
                    onClick={() => onChoice('infographic')}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="option-card relative group cursor-pointer p-8 rounded-3xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm transition-colors hover:border-pink-500/50"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:bg-pink-500/20 transition-colors">
                        <Sparkles className="w-8 h-8 text-pink-400" />
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-white">Infographic Poster</h3>
                    <p className="text-neutral-400 text-base mb-6 leading-relaxed">
                        Design stunning posters with AI tools like background removal and image generation.
                    </p>

                    <div className="flex items-center text-pink-400 font-medium group-hover:translate-x-2 transition-transform">
                        <span>Create Poster</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                </div>
            </div>
        </div>
    );
};
