import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Layout, Settings, FileText, Activity, GitCommit, Layers, PieChart, Info, BarChart2 } from 'lucide-react';

interface KeyPointsSelectorProps {
    plan: any; // The plan from /api/analyze
    onConfirm: (customPlan: any) => void;
    onBack: () => void;
}

const VISUAL_TYPES = [
    { id: 'exploded_view', name: 'Exploded View', icon: Layers, desc: 'Show internal parts & structure' },
    { id: 'cutaway', name: 'Cutaway Diagram', icon: Layout, desc: 'Show hidden mechanisms/flow' },
    { id: 'dashboard', name: 'Performance Dashboard', icon: Activity, desc: 'Stats, speed, KPIs, metrics' },
    { id: 'flowchart', name: 'Step-by-Step Flowchart', icon: GitCommit, desc: 'Process, assembly, timeline' },
    { id: 'comparison', name: 'Comparison', icon: BarChart2, desc: 'A vs B, Pros/Cons' },
    { id: 'standard', name: 'Standard Slide', icon: FileText, desc: 'Text & Bullet points' },
];

export const KeyPointsSelector: React.FC<KeyPointsSelectorProps> = ({ plan, onConfirm, onBack }) => {
    // Local state to manage the list of topics
    const [topics, setTopics] = useState(plan?.topics || []);

    const toggleTopic = (index: number) => {
        // Toggle selection? Or just remove?
        // Let's assume all are selected by default, user can remove.
        const newTopics = [...topics];
        newTopics.splice(index, 1);
        setTopics(newTopics);
    };

    const changeType = (index: number, newType: string) => {
        const newTopics = [...topics];
        newTopics[index].visualType = newType;
        setTopics(newTopics);
    };

    const handleContinue = () => {
        onConfirm({ ...plan, topics });
    };

    return (
        <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
            <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-neutral-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Key Points & Visuals
                        </h1>
                        <p className="text-xs text-neutral-500">
                            Review and select the best visualization for each topic
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleContinue}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                    Generate Slides <ArrowRight className="w-4 h-4" />
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-8 w-full space-y-6">
                {topics.map((topic: any, idx: number) => {
                    const currentType = VISUAL_TYPES.find(t => t.id === topic.visualType) || VISUAL_TYPES[5];
                    const Icon = currentType.icon;

                    return (
                        <div key={idx} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 transition-all hover:border-blue-500/30">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Left: Content Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-400 font-mono">
                                            {idx + 1}
                                        </span>
                                        <input
                                            type="text"
                                            value={topic.title}
                                            onChange={(e) => {
                                                const newTopics = [...topics];
                                                newTopics[idx].title = e.target.value;
                                                setTopics(newTopics);
                                            }}
                                            className="bg-transparent border-none text-lg font-bold text-white focus:outline-none focus:ring-0 w-full"
                                        />
                                    </div>
                                    <textarea
                                        value={topic.description}
                                        onChange={(e) => {
                                            const newTopics = [...topics];
                                            newTopics[idx].description = e.target.value;
                                            setTopics(newTopics);
                                        }}
                                        className="w-full bg-transparent text-sm text-neutral-400 resize-none focus:outline-none"
                                        rows={2}
                                    />
                                </div>

                                {/* Right: Visual Type Selector */}
                                <div className="w-full md:w-64 flex-shrink-0">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">
                                        Infographic Type
                                    </label>
                                    <div className="relative group">
                                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-800 rounded-xl border border-neutral-700 hover:border-blue-500 transition-all text-left">
                                            <div className={`p-2 rounded-lg ${currentType.id === 'exploded_view' ? 'bg-orange-500/20 text-orange-400' :
                                                    currentType.id === 'cutaway' ? 'bg-red-500/20 text-red-400' :
                                                        currentType.id === 'dashboard' ? 'bg-green-500/20 text-green-400' :
                                                            currentType.id === 'flowchart' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-neutral-700/50 text-neutral-300'
                                                }`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{currentType.name}</div>
                                                <div className="text-[10px] text-neutral-500 truncate">{currentType.desc}</div>
                                            </div>
                                        </button>

                                        {/* Dropdown (visible on group hover for simplicity, or click) */}
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                                            {VISUAL_TYPES.map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => changeType(idx, type.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors text-left ${type.id === currentType.id ? 'bg-blue-500/10' : ''}`}
                                                >
                                                    <type.icon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm text-neutral-300">{type.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleTopic(idx)}
                                    className="text-neutral-600 hover:text-red-500 self-start mt-2"
                                    title="Remove this slide"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    );
                })}

                <button
                    onClick={() => setTopics([...topics, { title: 'New Slide', description: '', visualType: 'standard' }])}
                    className="w-full py-4 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500 hover:border-neutral-700 hover:text-neutral-400 transition-all font-medium flex items-center justify-center gap-2"
                >
                    + Add Slide
                </button>
            </main>
        </div>
    );
};
