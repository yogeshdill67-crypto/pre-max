import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Type, Download, Upload, Trash2, Eraser } from 'lucide-react';
import html2canvas from 'html2canvas';

interface StudioProps {
    onBack: () => void;
}

interface CanvasElement {
    id: string;
    type: 'text' | 'image';
    content: string; // text content or image URL
    x: number;
    y: number;
    width?: number; // for images
    height?: number; // for images
    fontSize?: number; // for text
    color?: string; // for text
    fontFamily?: string;
    zIndex: number;
}

export const InfographicStudio: React.FC<StudioProps> = ({ onBack }) => {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tools
    const addText = () => {
        const newEl: CanvasElement = {
            id: Date.now().toString(),
            type: 'text',
            content: 'Double click to edit',
            x: 100,
            y: 100,
            fontSize: 24,
            color: '#ffffff',
            zIndex: elements.length + 1,
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    const img = new Image();
                    img.src = ev.target.result as string;
                    img.onload = () => {
                        // Scale down if too big
                        let w = img.width;
                        let h = img.height;
                        if (w > 400) {
                            const ratio = 400 / w;
                            w = 400;
                            h = h * ratio;
                        }

                        const newEl: CanvasElement = {
                            id: Date.now().toString(),
                            type: 'image',
                            content: ev.target!.result as string,
                            x: 100,
                            y: 100,
                            width: w,
                            height: h,
                            zIndex: elements.length + 1,
                        };
                        setElements(prev => [...prev, newEl]);
                        setSelectedId(newEl.id);
                    };
                }
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGenerateImage = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}:3000`;
            const res = await fetch(`${API_BASE}/api/clipdrop/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Server error');
            }

            const data = await res.json();
            if (data.success && data.image) {
                const img = new Image();
                img.onload = () => {
                    const newEl: CanvasElement = {
                        id: Date.now().toString(),
                        type: 'image',
                        content: data.image,
                        x: 0, // Full width starts at 0
                        y: 0, // Top
                        width: 450, // Match the new 9:16 canvas width
                        height: 800, // Match the new 9:16 canvas height for full coverage
                        zIndex: elements.length + 1,
                    };
                    setElements(prev => [...prev, newEl]);
                    setSelectedId(newEl.id);
                    setPrompt('');
                };
                img.onerror = () => {
                    alert('Generated image data is invalid or could not be loaded.');
                };
                img.src = data.image;
            } else {
                alert('Generation failed: ' + (data.error || 'No image returned'));
            }
        } catch (err: any) {
            console.error('Generation Error:', err);
            alert('Generation failed: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRemoveBg = async () => {
        const selected = elements.find(el => el.id === selectedId);
        if (!selected || selected.type !== 'image') return;

        setIsRemovingBg(true);
        try {
            // Convert base64 to blob
            const res = await fetch(selected.content);
            const blob = await res.blob();
            const file = new File([blob], "image.png", { type: "image/png" });

            const formData = new FormData();
            formData.append('image_file', file);

            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}:3000`;
            const apiRes = await fetch(`${API_BASE}/api/clipdrop/remove-bg`, {
                method: 'POST',
                body: formData,
            });
            const data = await apiRes.json();
            if (data.success) {
                // Update element
                setElements(prev => prev.map(el =>
                    el.id === selectedId ? { ...el, content: data.image } : el
                ));
            } else {
                alert('Remove BG failed: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Remove BG failed');
        } finally {
            setIsRemovingBg(false);
        }
    };

    const deleteElement = () => {
        if (selectedId) {
            setElements(prev => prev.filter(el => el.id !== selectedId));
            setSelectedId(null);
        }
    };

    const handleExport = async () => {
        if (!canvasRef.current) return;
        // Deselect first to hide borders
        setSelectedId(null);
        // Wait for render
        setTimeout(async () => {
            if (!canvasRef.current) return;
            try {
                const canvas = await html2canvas(canvasRef.current, {
                    backgroundColor: null, // Transparent if needed, or set color
                    scale: 2, // High res
                    useCORS: true,
                });
                const link = document.createElement('a');
                link.download = `poster-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                console.error('Export failed', err);
                alert('Export failed');
            }
        }, 100);
    };

    // Dragging logic (simple)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        const el = elements.find(e => e.id === id);
        if (!el) return;
        e.stopPropagation();
        setSelectedId(id);
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - el.x,
            y: e.clientY - el.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && selectedId) {
            setElements(prev => prev.map(el => {
                if (el.id === selectedId) {
                    return {
                        ...el,
                        x: e.clientX - dragOffset.x,
                        y: e.clientY - dragOffset.y
                    };
                }
                return el;
            }));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Keyboard delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Don't delete if editing text (this is a simplified check)
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    deleteElement();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId]);


    return (
        <div
            className="flex h-screen bg-neutral-950 text-white overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Sidebar Tools */}
            <div className="w-64 border-r border-neutral-800 bg-neutral-900/50 p-4 flex flex-col gap-6 z-20">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400">←</button>
                    <h2 className="font-bold text-lg">Studio</h2>
                </div>

                {/* Add Text */}
                <button
                    onClick={addText}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors text-left"
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Type size={18} />
                    </div>
                    <span>Add Text</span>
                </button>

                {/* Upload Image */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors text-left"
                >
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                        <Upload size={18} />
                    </div>
                    <span>Upload Image</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />

                <hr className="border-neutral-800" />

                {/* AI Tools */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">AI Tools</h3>

                    {/* Text to Image Tool */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-800/40 to-neutral-900/40 border border-white/5 shadow-inner backdrop-blur-md">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-purple-400">
                                <Sparkles size={16} />
                                <span className="text-sm font-bold tracking-tight uppercase">AI Vision Studio</span>
                            </div>
                            <div className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                                <span className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">HD Mode</span>
                            </div>
                        </div>
                        <div className="relative mb-3">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your vision (e.g., A cybernetic heart with glowing arteries)..."
                                className="w-full bg-black/40 border border-neutral-700/50 rounded-xl px-3 py-2.5 text-sm resize-none h-24 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-neutral-600"
                            />
                        </div>
                        <button
                            onClick={handleGenerateImage}
                            disabled={isGenerating || !prompt}
                            className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${isGenerating
                                ? 'bg-neutral-800 text-neutral-500'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
                                    <span>Rendering Vision...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    <span>Generate in HD</span>
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={handleRemoveBg}
                        disabled={!selectedId || elements.find(e => e.id === selectedId)?.type !== 'image' || isRemovingBg}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                            <Eraser size={18} />
                        </div>
                        <span>Remove Background</span>
                    </button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                {/* Pattern Background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                />

                <div
                    ref={canvasRef}
                    className="relative bg-white shadow-2xl transition-all duration-300"
                    style={{
                        width: '450px', // 9:16 aspect ratio (adapted for viewport)
                        height: '800px',
                        transform: 'scale(1)',
                    }}
                    onMouseDown={() => setSelectedId(null)} // Click bg to deselect
                >
                    {elements.map(el => (
                        <div
                            key={el.id}
                            className={`absolute group ${selectedId === el.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-500/30'}`}
                            style={{
                                left: el.x,
                                top: el.y,
                                width: el.type === 'image' ? el.width : 'auto',
                                height: el.type === 'image' ? el.height : 'auto',
                                zIndex: el.zIndex,
                                cursor: isDragging && selectedId === el.id ? 'grabbing' : 'grab',
                            }}
                            onMouseDown={(e) => handleMouseDown(e, el.id)}
                        >
                            {el.type === 'image' && (
                                <img
                                    src={el.content}
                                    alt=""
                                    className="w-full h-full object-cover pointer-events-none shadow-md border border-neutral-100"
                                />
                            )}
                            {el.type === 'text' && (
                                <div
                                    contentEditable={selectedId === el.id}
                                    suppressContentEditableWarning
                                    className="outline-none min-w-[50px]"
                                    style={{
                                        fontSize: el.fontSize,
                                        color: el.color,
                                        fontFamily: el.fontFamily || 'sans-serif',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)', // Add shadow for visibility on white
                                    }}
                                    onBlur={(e) => {
                                        setElements(prev => prev.map(item =>
                                            item.id === el.id ? { ...item, content: e.currentTarget.innerText } : item
                                        ));
                                    }}
                                >
                                    {el.content}
                                </div>
                            )}

                            {/* Handles (Simplified - just corner) */}
                            {selectedId === el.id && (
                                <>
                                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border border-blue-500 rounded-full" />
                                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-blue-500 rounded-full" />
                                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border border-blue-500 rounded-full" />
                                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border border-blue-500 rounded-full" />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Properties Panel */}
            <div className="w-64 border-l border-neutral-800 bg-neutral-900/50 p-4 z-20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-lg">Properties</h2>
                    <button
                        onClick={handleExport}
                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                        title="Export PNG"
                    >
                        <Download size={18} />
                    </button>
                </div>

                {selectedId ? (
                    <div className="space-y-4">
                        {elements.find(e => e.id === selectedId)?.type === 'text' && (
                            <>
                                <div>
                                    <label className="text-xs text-neutral-500 block mb-1">Color</label>
                                    <input
                                        type="color"
                                        value={elements.find(e => e.id === selectedId)?.color || '#ffffff'}
                                        onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, color: e.target.value } : el))}
                                        className="w-full h-8 rounded bg-neutral-800 border-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 block mb-1">Size</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="120"
                                        value={elements.find(e => e.id === selectedId)?.fontSize || 24}
                                        onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontSize: parseInt(e.target.value) } : el))}
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}

                        <div className="pt-4 border-t border-neutral-800">
                            <button
                                onClick={deleteElement}
                                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                                <Trash2 size={16} />
                                <span>Delete Selected</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-neutral-500 text-sm text-center py-10">
                        Select an element to edit properties
                    </div>
                )}
            </div>
        </div>
    );
};
