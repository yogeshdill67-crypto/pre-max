import React, { useState } from 'react';
import {
    Clipboard, Scissors, Copy, Paintbrush,
    PlusSquare, LayoutTemplate, RotateCcw, Columns,
    Bold, Italic, Underline, Strikethrough, Type,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Layers, PaintBucket, PenTool,
    Search, Replace, MousePointer2,
    Mic, Zap, ChevronDown, MonitorPlay, Share, MessageSquare,
    Download, Edit3, Check,
    Table, Image, Camera, Album, Shapes, Smile, Box, BarChart, ZoomIn, Link, Star,
    FileText, Calendar, Hash, Calculator, Sigma, Video, Volume2, Monitor,
    Undo, Redo, Lasso, Eraser, Pen, Highlighter, Ruler, MousePointerClick, Plus,
    Palette, Ban, RefreshCw, CloudFog, ArrowUpFromLine, ArrowRightFromLine, Split, Eye, Circle, ArrowRight, ArrowLeft,
    ArrowDownRight, GalleryVerticalEnd, Wind, Activity, Minimize2, StickyNote, File, Send, Bird, Grid, Grid3x3, Menu,
    Clock, Waves, Hexagon, Sparkles, Tornado, DoorOpen, Move, Cog, RotateCw, AppWindow, Orbit, Plane, Trash2
} from 'lucide-react';

interface RibbonToolbarProps {
    onPresent: () => void;
    onBack: () => void;
    onEdit: () => void;
    onSave: () => void;
    onDownload: () => void;
    isEditing: boolean;
    title: string;
    onInsertImage?: () => void;
    onAddSlide?: () => void;
}

const TABS = ['File', 'Home', 'Insert', 'Draw', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Record', 'Review', 'View', 'Help'];

export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
    onPresent, onBack, onEdit, onSave, onDownload, isEditing, title,
    onInsertImage, onAddSlide
}) => {
    const [activeTab, setActiveTab] = useState('Home');

    return (
        <div className="flex flex-col bg-[#111111] text-white border-b border-neutral-800 select-none">
            {/* ... (Top Bar omitted for brevity, assuming generic replacement matches) */}

            {/* Top Bar (Title & Quick Actions) */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a] text-xs">
                {/* ... Keep existing top bar content ... */}
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
                            <RibbonButton icon={PlusSquare} label="New Slide" large hasDropdown onClick={onAddSlide} />
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
                {activeTab === 'Insert' && (
                    <>
                        {/* Slides */}
                        <RibbonGroup label="Slides">
                            <RibbonButton icon={PlusSquare} label="New Slide" large hasDropdown onClick={onAddSlide} />
                            <RibbonButton icon={LayoutTemplate} label="Reuse Slides" large />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Tables */}
                        <RibbonGroup label="Tables">
                            <RibbonButton icon={Table} label="Table" large hasDropdown />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Images */}
                        <RibbonGroup label="Images">
                            <RibbonButton icon={Image} label="Pictures" large hasDropdown onClick={onInsertImage} />
                            <RibbonButton icon={Camera} label="Screenshot" large hasDropdown />
                            <RibbonButton icon={Album} label="Photo Album" large hasDropdown />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Illustrations */}
                        <RibbonGroup label="Illustrations">
                            <div className="flex flex-col justify-between h-full py-0.5">
                                <RibbonButton icon={Shapes} label="Shapes" hasDropdown />
                                <RibbonButton icon={Smile} label="Icons" />
                                <RibbonButton icon={Box} label="3D Models" hasDropdown />
                            </div>
                            <div className="flex flex-col justify-between h-full py-0.5 ml-1">
                                <RibbonButton icon={LayoutTemplate} label="SmartArt" />
                                <RibbonButton icon={BarChart} label="Chart" />
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Links */}
                        <RibbonGroup label="Links">
                            <div className="flex flex-col justify-between h-full py-0.5">
                                <RibbonButton icon={ZoomIn} label="Zoom" hasDropdown />
                                <RibbonButton icon={Link} label="Link" />
                                <RibbonButton icon={Star} label="Action" />
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Comments */}
                        <RibbonGroup label="Comments">
                            <RibbonButton icon={MessageSquare} label="Comment" large />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Text */}
                        <RibbonGroup label="Text">
                            <RibbonButton icon={Type} label="Text Box" large />
                            <div className="flex flex-col justify-between h-full py-0.5">
                                <RibbonButton icon={FileText} label="Header & Footer" />
                                <RibbonButton icon={Type} label="WordArt" />
                                <RibbonButton icon={Calendar} label="Date & Time" />
                            </div>
                            <div className="flex flex-col justify-between h-full py-0.5 ml-1">
                                <RibbonButton icon={Hash} label="Slide Number" />
                                <RibbonButton icon={Box} label="Object" />
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Symbols */}
                        <RibbonGroup label="Symbols">
                            <div className="flex flex-col justify-between h-full py-0.5">
                                <RibbonButton icon={Calculator} label="Equation" hasDropdown />
                                <RibbonButton icon={Sigma} label="Symbol" />
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Media */}
                        <RibbonGroup label="Media">
                            <RibbonButton icon={Video} label="Video" large hasDropdown />
                            <RibbonButton icon={Volume2} label="Audio" large hasDropdown />
                            <RibbonButton icon={Monitor} label="Screen Recording" large />
                        </RibbonGroup>
                    </>
                )}
                {activeTab === 'Draw' && (
                    <>
                        {/* Undo */}
                        <div className="flex flex-col justify-center px-1 border-r border-neutral-700 mx-1">
                            <RibbonButton icon={Undo} label="Undo" iconOnly />
                            <RibbonButton icon={Redo} label="Redo" iconOnly />
                        </div>

                        {/* Drawing Tools */}
                        <RibbonGroup label="Drawing Tools">
                            <RibbonButton icon={MousePointer2} label="Select" large />
                            <RibbonButton icon={Lasso} label="Lasso Select" large />
                            <RibbonButton icon={Eraser} label="Eraser" large hasDropdown />

                            {/* Pens */}
                            <div className="flex gap-1 items-center px-2">
                                <RibbonButton icon={Pen} label="" large className="text-black bg-white/10" />
                                <RibbonButton icon={Pen} label="" large className="text-red-500" />
                                <RibbonButton icon={Pen} label="" large className="text-blue-500" />
                                <RibbonButton icon={Pen} label="" large className="text-green-500" />
                                <RibbonButton icon={Highlighter} label="" large className="text-yellow-400" />
                                <RibbonButton icon={Pen} label="" large className="text-purple-500" />
                            </div>

                            <RibbonButton icon={Plus} label="Add Pen" large hasDropdown />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Stencils */}
                        <RibbonGroup label="Stencils">
                            <RibbonButton icon={Ruler} label="Ruler" large />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Convert */}
                        <RibbonGroup label="Convert">
                            <RibbonButton icon={MousePointerClick} label="Ink to Shape" large />
                            <RibbonButton icon={Sigma} label="Ink to Math" large hasDropdown />
                        </RibbonGroup>
                    </>
                )}
                {activeTab === 'Design' && (
                    <>
                        {/* Themes */}
                        <RibbonGroup label="Themes">
                            <div className="flex items-center gap-1 overflow-y-hidden overflow-x-auto h-full px-1 max-w-[400px]">
                                {/* Theme 1 (Default/Office) */}
                                <div className="flex flex-col items-center justify-center p-1 hover:bg-neutral-700 rounded cursor-pointer min-w-[50px]">
                                    <div className="w-12 h-8 bg-white border border-neutral-500 relative mb-1 shadow-sm">
                                        <span className="absolute top-1 left-1 text-[10px] text-black font-serif">Aa</span>
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
                                            <div className="bg-red-500 w-1/4 h-full"></div>
                                            <div className="bg-orange-500 w-1/4 h-full"></div>
                                            <div className="bg-green-500 w-1/4 h-full"></div>
                                            <div className="bg-blue-500 w-1/4 h-full"></div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-neutral-300">Office</span>
                                </div>

                                {/* Theme 2 (Dark) */}
                                <div className="flex flex-col items-center justify-center p-1 hover:bg-neutral-700 rounded cursor-pointer min-w-[50px]">
                                    <div className="w-12 h-8 bg-neutral-800 border border-neutral-600 relative mb-1 shadow-sm">
                                        <span className="absolute top-1 left-1 text-[10px] text-white font-sans">Aa</span>
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
                                            <div className="bg-purple-500 w-1/4 h-full"></div>
                                            <div className="bg-pink-500 w-1/4 h-full"></div>
                                            <div className="bg-indigo-500 w-1/4 h-full"></div>
                                            <div className="bg-blue-500 w-1/4 h-full"></div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-neutral-300">Dark</span>
                                </div>

                                {/* Theme 3 (Facet) */}
                                <div className="flex flex-col items-center justify-center p-1 hover:bg-neutral-700 rounded cursor-pointer min-w-[50px]">
                                    <div className="w-12 h-8 bg-[#f0f9ff] border border-neutral-500 relative mb-1 shadow-sm overflow-hidden">
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-green-200 rounded-bl-full opacity-50"></div>
                                        <span className="absolute top-1 left-1 text-[10px] text-black font-bold">Aa</span>
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
                                            <div className="bg-emerald-400 w-1/4 h-full"></div>
                                            <div className="bg-teal-500 w-1/4 h-full"></div>
                                            <div className="bg-cyan-600 w-1/4 h-full"></div>
                                            <div className="bg-sky-700 w-1/4 h-full"></div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-neutral-300">Facet</span>
                                </div>

                                {/* Theme 4 (Gallery) */}
                                <div className="flex flex-col items-center justify-center p-1 hover:bg-neutral-700 rounded cursor-pointer min-w-[50px]">
                                    <div className="w-12 h-8 bg-white border border-neutral-500 relative mb-1 shadow-sm">
                                        <span className="absolute top-1 left-1 text-[10px] text-black font-serif">Aa</span>
                                        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-red-100 border border-red-300"></div>
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
                                            <div className="bg-red-400 w-full h-full"></div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-neutral-300">Gallery</span>
                                </div>

                                {/* More Button */}
                                <div className="flex flex-col items-center justify-center p-1 hover:bg-neutral-700 rounded cursor-pointer h-full">
                                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                                </div>
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Variants */}
                        <RibbonGroup label="Variants">
                            <div className="flex gap-1 items-center px-1">
                                <div className="flex flex-col gap-1">
                                    <div className="flex gap-1">
                                        <div className="w-4 h-4 bg-blue-500 hover:ring-1 ring-white cursor-pointer shadow-sm"></div>
                                        <div className="w-4 h-4 bg-red-500 hover:ring-1 ring-white cursor-pointer shadow-sm"></div>
                                        <div className="w-4 h-4 bg-green-500 hover:ring-1 ring-white cursor-pointer shadow-sm"></div>
                                        <div className="w-4 h-4 bg-purple-500 hover:ring-1 ring-white cursor-pointer shadow-sm"></div>
                                    </div>
                                    <div className="flex gap-1">
                                        <RibbonButton icon={Palette} label="Colors" iconOnly />
                                        <RibbonButton icon={Type} label="Fonts" iconOnly />
                                        <RibbonButton icon={Layers} label="Effects" iconOnly />
                                    </div>
                                </div>
                                <RibbonButton icon={ChevronDown} label="" iconOnly />
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Customize */}
                        <RibbonGroup label="Customize">
                            <RibbonButton icon={Monitor} label="Slide Size" large hasDropdown />
                            <RibbonButton icon={PaintBucket} label="Format Background" large />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Designer */}
                        <RibbonButton icon={Zap} label="Designer" large className="text-blue-400" />
                    </>
                )}
                {activeTab === 'Transitions' && (
                    <>
                        {/* Preview */}
                        <RibbonGroup label="Preview">
                            <RibbonButton icon={MonitorPlay} label="Preview" large />
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Transition to This Slide */}
                        <RibbonGroup label="Transition to This Slide">
                            <div className="flex flex-col h-full w-[600px]">
                                <div className="flex items-center gap-1 overflow-x-auto h-full px-1 pb-4 no-scrollbar">
                                    {/* Subtle */}
                                    <div className="flex gap-1 border-r border-neutral-700 pr-2 mr-2">
                                        <RibbonButton icon={Ban} label="None" large />
                                        <RibbonButton icon={RefreshCw} label="Morph" large />
                                        <RibbonButton icon={CloudFog} label="Fade" large />
                                        <RibbonButton icon={ArrowUpFromLine} label="Push" large />
                                        <RibbonButton icon={ArrowRightFromLine} label="Wipe" large />
                                        <RibbonButton icon={Split} label="Split" large />
                                        <RibbonButton icon={Eye} label="Reveal" large />
                                        <RibbonButton icon={Scissors} label="Cut" large />
                                        <RibbonButton icon={Grid} label="Random Bars" large />
                                        <RibbonButton icon={Circle} label="Shape" large />
                                        <RibbonButton icon={ArrowRight} label="Uncover" large />
                                        <RibbonButton icon={ArrowLeft} label="Cover" large />
                                        <RibbonButton icon={Zap} label="Flash" large />
                                    </div>

                                    {/* Exciting */}
                                    <div className="flex gap-1 border-r border-neutral-700 pr-2 mr-2">
                                        <RibbonButton icon={ArrowDownRight} label="Fall Over" large />
                                        <RibbonButton icon={GalleryVerticalEnd} label="Drape" large />
                                        <RibbonButton icon={Columns} label="Curtains" large />
                                        <RibbonButton icon={Wind} label="Wind" large />
                                        <RibbonButton icon={Activity} label="Fracture" large />
                                        <RibbonButton icon={Minimize2} label="Crush" large />
                                        <RibbonButton icon={StickyNote} label="Peel Off" large />
                                        <RibbonButton icon={File} label="Page Curl" large />
                                        <RibbonButton icon={Send} label="Airplane" large />
                                        <RibbonButton icon={Bird} label="Origami" large />
                                        <RibbonButton icon={Grid3x3} label="Checkerboard" large />
                                        <RibbonButton icon={Menu} label="Blinds" large />
                                        <RibbonButton icon={Clock} label="Clock" large />
                                        <RibbonButton icon={Waves} label="Ripple" large />
                                        <RibbonButton icon={Hexagon} label="Honeycomb" large />
                                        <RibbonButton icon={Sparkles} label="Glitter" large />
                                        <RibbonButton icon={Tornado} label="Vortex" large />
                                        <RibbonButton icon={Trash2} label="Shred" large />
                                        <RibbonButton icon={RefreshCw} label="Switch" large />
                                        <RibbonButton icon={Image} label="Gallery" large />
                                        <RibbonButton icon={Box} label="Cube" large />
                                        <RibbonButton icon={DoorOpen} label="Doors" large />
                                        <RibbonButton icon={ZoomIn} label="Zoom" large />
                                    </div>

                                    {/* Dynamic Content */}
                                    <div className="flex gap-1">
                                        <RibbonButton icon={Move} label="Pan" large />
                                        <RibbonButton icon={Cog} label="Ferris Wheel" large />
                                        <RibbonButton icon={RotateCw} label="Rotate" large />
                                        <RibbonButton icon={AppWindow} label="Window" large />
                                        <RibbonButton icon={Orbit} label="Orbit" large />
                                        <RibbonButton icon={Plane} label="Fly Through" large />
                                    </div>
                                </div>
                                <div className="flex justify-center border-t border-neutral-700 pt-0.5">
                                    <ChevronDown className="w-4 h-4 text-neutral-400 hover:bg-neutral-700 rounded cursor-pointer" />
                                </div>
                            </div>
                        </RibbonGroup>

                        <div className="w-px h-20 bg-neutral-700 my-auto mx-1" />

                        {/* Timing */}
                        <RibbonGroup label="Timing">
                            <div className="flex flex-col gap-2 p-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs w-16">Sound:</span>
                                    <select className="bg-[#2b2b2b] text-white text-xs border border-neutral-600 rounded px-1 w-28 h-6 outline-none">
                                        <option>[No Sound]</option>
                                        <option>Applause</option>
                                        <option>Drum Roll</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs w-16">Duration:</span>
                                    <input type="number" defaultValue="02.00" className="bg-[#2b2b2b] text-white text-xs border border-neutral-600 rounded px-1 w-16 h-6 outline-none" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-1 hover:bg-neutral-700 px-1 rounded">
                                        <MousePointerClick className="w-3 h-3" />
                                        <span className="text-xs">Apply To All</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 p-1 ml-2 border-l border-neutral-700 pl-2">
                                <span className="text-[10px] font-bold text-neutral-400 mb-1">Advance Slide</span>
                                <label className="flex items-center gap-2 text-xs">
                                    <input type="checkbox" defaultChecked className="rounded bg-[#2b2b2b] border-neutral-600" />
                                    On Mouse Click
                                </label>
                                <label className="flex items-center gap-2 text-xs">
                                    <input type="checkbox" className="rounded bg-[#2b2b2b] border-neutral-600" />
                                    After: <input type="number" defaultValue="00:00.00" className="bg-[#2b2b2b] text-white text-[10px] border border-neutral-600 rounded px-1 w-12 h-5 outline-none ml-1" />
                                </label>
                            </div>
                        </RibbonGroup>
                    </>
                )}
                {activeTab !== 'Home' && activeTab !== 'Insert' && activeTab !== 'Draw' && activeTab !== 'Design' && activeTab !== 'Transitions' && (
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
    onClick?: () => void;
}> = ({ icon: Icon, label, large, iconOnly, hasDropdown, className = '', onClick }) => {
    if (large) {
        return (
            <button
                onClick={onClick}
                className={`flex flex-col items-center justify-center h-full min-w-[50px] px-2 hover:bg-neutral-700 rounded ${className}`}
            >
                <Icon className="w-8 h-8 mb-1" />
                <span className="text-[10px] whitespace-nowrap flex items-center gap-0.5">
                    {label}
                    {hasDropdown && <ChevronDown className="w-3 h-3" />}
                </span>
            </button>
        );
    }
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2 py-0.5 hover:bg-neutral-700 rounded text-xs whitespace-nowrap ${className} ${iconOnly ? 'justify-center px-1' : ''}`}
        >
            <Icon className="w-4 h-4" />
            {!iconOnly && <span>{label}</span>}
            {hasDropdown && <ChevronDown className="w-3 h-3 ml-auto" />}
        </button>
    );
};
