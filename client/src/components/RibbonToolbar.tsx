import React, { useState } from 'react';
import {
    Clipboard, Scissors, Copy, Paintbrush,
    PlusSquare, LayoutTemplate, RotateCcw, Columns,
    Bold, Italic, Underline, Strikethrough, Highlighter, Type,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Layers, PaintBucket, PenTool,
    Search, Replace, MousePointer2,
    Mic, Zap, ChevronDown, MonitorPlay, Share, MessageSquare,
    Download, Edit3, Check
} from 'lucide-react';

interface RibbonToolbarProps {
    onPresent: () => void;
    onBack: () => void;
    onEdit: () => void;
    onSave: () => void;
    onDownload: () => void;
    isEditing: boolean;
    title: string;
}

const TABS = ['File', 'Home', 'Insert', 'Draw', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Record', 'Review', 'View', 'Help', 'EdrawMax'];

export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
    onPresent, onBack, onEdit, onSave, onDownload, isEditing, title
}) => {
    const [activeTab, setActiveTab] = useState('Home');

    return (
        <div className="flex flex-col bg-[#111111] text-white border-b border-neutral-800 select-none">
            {/* Top Bar (Title & Quick Actions) */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a] text-xs">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {/* Quick Save / Undo / Redo placeholders */}
                        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white">P</div>
                        <span className="font-semibold text-neutral-300">{title} - PowerPoint</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded hover:bg-neutral-800 cursor-pointer text-neutral-400">
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                    </div>
                    <div className="h-4 w-px bg-neutral-700 mx-2" />

                    {/* Restored Functionality Buttons */}
                    {isEditing ? (
                        <button
                            onClick={onSave}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/50 hover:bg-green-900/80 text-green-400 rounded transition-colors font-medium border border-green-800"
                        >
                            <Check className="w-4 h-4" />
                            <span>Save</span>
                        </button>
                    ) : (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-white font-medium"
                        >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit</span>
                        </button>
                    )}

                    <button
                        onClick={onDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-white font-medium"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-white font-medium">
                        <MonitorPlay className="w-4 h-4" />
                        <span onClick={onPresent}>Present</span>
                    </button>

                    <button className="p-2 hover:bg-neutral-800 rounded">
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 rounded transition-colors text-white font-bold ml-2">
                        <Share className="w-4 h-4" />
                        <span>Share</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center px-2 pt-1 border-b border-neutral-700/50 bg-[#111111]">
                <button
                    onClick={onBack}
                    className="px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-700 bg-orange-600 rounded-t-md mr-1"
                >
                    File
                </button>
                {TABS.slice(1).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-orange-500 text-orange-500 bg-[#1e1e1e] rounded-t'
                                : 'border-transparent text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-t'
                            } `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Ribbon Content (Only Home implemented for now) */}
            <div className="h-28 bg-[#1e1e1e] flex items-stretch px-2 py-1 overflow-x-auto">
                {activeTab === 'Home' && (
                    <>
                        {/* Clipboard */}
                        <RibbonGroup label="Clipboard">
                            <RibbonButton icon={Clipboard} label="Paste" large />
                            <div className="flex flex-col justify-between h-full py-0.5">
                                <RibbonButton icon={Scissors} label="Cut" />
                                <RibbonButton icon={Copy} label="Copy" />
                                <RibbonButton icon={Paintbrush} label="Format Painter" />
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Slides */}
                        <RibbonGroup label="Slides">
                            <RibbonButton icon={PlusSquare} label="New Slide" large hasDropdown />
                            <div className="flex flex-col justify-between h-full py-0.5">
                                <RibbonButton icon={LayoutTemplate} label="Layout" hasDropdown />
                                <RibbonButton icon={RotateCcw} label="Reset" />
                                <RibbonButton icon={Columns} label="Section" hasDropdown />
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Font */}
                        <RibbonGroup label="Font">
                            <div className="flex flex-col gap-2 p-1">
                                <div className="flex gap-1">
                                    <select className="bg-[#2b2b2b] text-white text-xs border border-neutral-600 rounded px-1 w-24 h-6 outline-none">
                                        <option>Aptos Display</option>
                                        <option>Arial</option>
                                        <option>Calibri</option>
                                    </select>
                                    <select className="bg-[#2b2b2b] text-white text-xs border border-neutral-600 rounded px-1 w-12 h-6 outline-none">
                                        <option>60</option>
                                        <option>24</option>
                                        <option>12</option>
                                    </select>
                                    <button className="w-6 h-6 flex items-center justify-center hover:bg-neutral-700 rounded text-xs">A^</button>
                                    <button className="w-6 h-6 flex items-center justify-center hover:bg-neutral-700 rounded text-xs">Av</button>
                                    <button className="w-6 h-6 flex items-center justify-center hover:bg-neutral-700 rounded text-xs">Aa</button>
                                    <button className="w-6 h-6 flex items-center justify-center hover:bg-neutral-700 rounded text-xs">A<span className="text-pink-500">Eraser</span></button>
                                </div>
                                <div className="flex gap-1 items-center">
                                    <RibbonButton icon={Bold} label="" iconOnly />
                                    <RibbonButton icon={Italic} label="" iconOnly />
                                    <RibbonButton icon={Underline} label="" iconOnly />
                                    <RibbonButton icon={Strikethrough} label="" iconOnly />
                                    <div className="w-px h-4 bg-neutral-600 mx-1" />
                                    <RibbonButton icon={Highlighter} label="" iconOnly />
                                    <RibbonButton icon={Type} label="" iconOnly className="text-red-500" />
                                </div>
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Paragraph */}
                        <RibbonGroup label="Paragraph">
                            <div className="flex flex-col gap-2 p-1">
                                <div className="flex gap-1">
                                    <RibbonButton icon={List} label="" iconOnly />
                                    <RibbonButton icon={ListOrdered} label="" iconOnly />
                                    {/* Indent icons skipped for brevity */}
                                    {/* Paragraph mark */}
                                </div>
                                <div className="flex gap-1">
                                    <RibbonButton icon={AlignLeft} label="" iconOnly />
                                    <RibbonButton icon={AlignCenter} label="" iconOnly />
                                    <RibbonButton icon={AlignRight} label="" iconOnly />
                                    <RibbonButton icon={AlignJustify} label="" iconOnly />
                                    {/* Columns, Direction, Align text, Convert to SmartArt */}
                                </div>
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Drawing */}
                        <RibbonGroup label="Drawing">
                            <div className="flex flex-col h-full">
                                <div className="flex gap-1 p-1 mb-1 border border-neutral-700 rounded bg-[#2b2b2b] h-16 overflow-y-auto w-32">
                                    {/* Shapes placeholders */}
                                    <div className="w-4 h-4 border border-white bg-transparent"></div>
                                    <div className="w-4 h-4 border border-white bg-white rounded-full"></div>
                                    <div className="w-4 h-4 border border-white bg-transparent rotate-45"></div>
                                </div>
                                <div className="flex gap-1">
                                    <RibbonButton icon={Layers} label="Arrange" />
                                    <RibbonButton icon={PaintBucket} label="Quick Styles" />
                                    <div className="flex flex-col">
                                        <RibbonButton icon={PaintBucket} label="Shape Fill" />
                                        <RibbonButton icon={PenTool} label="Shape Outline" />
                                        <RibbonButton icon={Zap} label="Shape Effects" />
                                    </div>
                                </div>
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Editing */}
                        <RibbonGroup label="Editing">
                            <div className="flex flex-col justify-between h-full py-0.5">
                                <RibbonButton icon={Search} label="Find" />
                                <RibbonButton icon={Replace} label="Replace" />
                                <RibbonButton icon={MousePointer2} label="Select" />
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Voice & Designer */}
                        <RibbonGroup label="Voice">
                            <RibbonButton icon={Mic} label="Dictate" large />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        <RibbonButton icon={Zap} label="Designer" large className="text-blue-400" />

                    </>
                )}
                {activeTab !== 'Home' && (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm">
                        {activeTab} toolbar contents
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-components for internal use
const RibbonGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col items-center h-full px-1">
        <div className="flex-1 flex gap-1">{children}</div>
        <span className="text-[10px] text-neutral-400 mt-1">{label}</span>
    </div>
);

const RibbonButton: React.FC<{
    icon: any;
    label: string;
    large?: boolean;
    iconOnly?: boolean;
    hasDropdown?: boolean;
    className?: string;
}> = ({ icon: Icon, label, large, iconOnly, hasDropdown, className = '' }) => {
    if (large) {
        return (
            <button className={`flex flex-col items-center justify-center h-full min-w-[50px] px-2 hover:bg-neutral-700 rounded ${className}`}>
                <Icon className="w-8 h-8 mb-1" />
                <span className="text-[10px] whitespace-nowrap flex items-center gap-0.5">
                    {label}
                    {hasDropdown && <ChevronDown className="w-3 h-3" />}
                </span>
            </button>
        );
    }
    return (
        <button className={`flex items-center gap-1.5 px-2 py-0.5 hover:bg-neutral-700 rounded text-xs whitespace-nowrap ${className} ${iconOnly ? 'justify-center px-1' : ''}`}>
            <Icon className="w-4 h-4" />
            {!iconOnly && <span>{label}</span>}
            {hasDropdown && <ChevronDown className="w-3 h-3 ml-auto" />}
        </button>
    );
};
