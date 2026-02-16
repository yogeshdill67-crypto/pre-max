
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon, X, MonitorPlay } from 'lucide-react';
import { RibbonToolbar } from './RibbonToolbar';
import { ImagePicker } from './ImagePicker';
import gsap from 'gsap';
import { PresentationResult, SlideData, DiagramNode, DiagramConnection } from '../types';

// ═══════════════════════════════════════════════════════
// Adaptive Theme from AI
// ═══════════════════════════════════════════════════════

interface AdaptiveTheme {
    name: string;
    bg: string;
    accent1: string;
    accent2: string;
    textColor: string;
    cardBg: string;
    isDark: boolean;
}

const DEFAULT_THEME: AdaptiveTheme = {
    name: 'Default',
    bg: '0F172A',
    accent1: '3B82F6',
    accent2: '8B5CF6',
    textColor: 'F1F5F9',
    cardBg: '1E293B',
    isDark: true,
};

const resolveTheme = (result: PresentationResult): AdaptiveTheme => {
    if (result.theme && result.theme.bg && result.theme.accent1) {
        const c = (s: string) => s.replace(/^#/, '');
        return {
            name: result.theme.name || 'AI Theme',
            bg: c(result.theme.bg),
            accent1: c(result.theme.accent1),
            accent2: c(result.theme.accent2 || result.theme.accent1),
            textColor: c(result.theme.textColor || (result.theme.isDark ? 'F1F5F9' : '1E293B')),
            cardBg: c(result.theme.cardBg || (result.theme.isDark ? '1E293B' : 'F1F5F9')),
            isDark: result.theme.isDark !== false,
        };
    }
    return DEFAULT_THEME;
};

// helper: hex to rgba
const hexRgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};



// ═══════════════════════════════════════════════════════
// SVG Diagram Renderer
// ═══════════════════════════════════════════════════════

const DiagramView: React.FC<{ nodes: DiagramNode[]; connections: DiagramConnection[]; compact?: boolean; theme: AdaptiveTheme }> = ({ nodes, connections, compact, theme }) => {
    const cols = Math.min(nodes.length, 4);
    const gapX = compact ? 80 : 160;
    const gapY = compact ? 55 : 100;
    const nodeW = compact ? 70 : 140;
    const nodeH = compact ? 30 : 50;
    const startX = compact ? 10 : 30;
    const startY = compact ? 8 : 20;
    const fs = compact ? 7 : 12;

    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => { positions[n.id] = { x: startX + (i % cols) * gapX, y: startY + Math.floor(i / cols) * gapY }; });
    const rows = Math.ceil(nodes.length / cols);
    const svgW = startX * 2 + cols * gapX;
    const svgH = startY * 2 + rows * gapY;

    const nodeColor = (t: string) => {
        switch (t) { case 'start': return '#10B981'; case 'end': return '#EF4444'; case 'decision': return '#F59E0B'; case 'data': return `#${theme.accent2} `; default: return `#${theme.accent1} `; }
    };

    return (
        <svg viewBox={`0 0 ${svgW} ${svgH} `} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
                <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={`#${theme.accent1} `} opacity="0.6" /></marker>
                <filter id="dshadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3" /></filter>
            </defs>
            {connections.map((c, i) => {
                const f = positions[c.from], t = positions[c.to]; if (!f || !t) return null;
                const isH = Math.abs(f.y - t.y) < 10;
                return (<g key={i}><line x1={isH ? f.x + nodeW : f.x + nodeW / 2} y1={isH ? f.y + nodeH / 2 : f.y + nodeH} x2={isH ? t.x : t.x + nodeW / 2} y2={isH ? t.y + nodeH / 2 : t.y} stroke={`#${theme.accent1} `} strokeWidth={compact ? 1 : 2} opacity="0.5" markerEnd="url(#arr)" strokeDasharray={compact ? "3,2" : "6,4"} />
                    {c.label && <text x={(f.x + t.x) / 2 + nodeW / 2 + 5} y={(f.y + t.y) / 2 + nodeH / 2 - 4} fontSize={compact ? 6 : 10} fill={`#${theme.accent2} `} fontStyle="italic">{c.label}</text>}</g>);
            })}
            {nodes.map(n => {
                const p = positions[n.id]; if (!p) return null;
                const cx = p.x + nodeW / 2, cy = p.y + nodeH / 2, col = nodeColor(n.type);
                return (<g key={n.id} filter="url(#dshadow)">
                    {n.type === 'start' || n.type === 'end' ? <ellipse cx={cx} cy={cy} rx={nodeW / 2} ry={nodeH / 2} fill={col} /> :
                        n.type === 'decision' ? <polygon points={`${cx},${p.y} ${p.x + nodeW},${cy} ${cx},${p.y + nodeH} ${p.x},${cy} `} fill={col} /> :
                            <rect x={p.x} y={p.y} width={nodeW} height={nodeH} rx={8} fill={col} />}
                    <text x={cx} y={cy + (compact ? 2 : 4)} textAnchor="middle" fill="white" fontSize={fs} fontWeight="bold" fontFamily="Segoe UI, sans-serif">{n.label}</text>
                </g>);
            })}
        </svg>
    );
};

// ═══════════════════════════════════════════════════════
// Premium Slide Content Renderer
// ═══════════════════════════════════════════════════════

const SlideContent: React.FC<{
    slide: SlideData & { isTitle?: boolean };
    fullscreen: boolean;
    theme: AdaptiveTheme;
    isEditing?: boolean;
    onChange?: (newSlide: SlideData) => void;
    onImageEdit?: () => void;
}> = ({ slide, fullscreen, theme, isEditing, onChange, onImageEdit }) => {
    const fs = fullscreen;

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) onChange({ ...slide, title: e.target.value });
    }

    const handleContentChange = (index: number, value: string) => {
        if (onChange && slide.content) {
            const newContent = [...slide.content];
            newContent[index] = value;
            onChange({ ...slide, content: newContent });
        }
    }

    // Wrap editable elements
    const EditableTitle = ({ className, style }: any) => isEditing ? (
        <input
            value={slide.title}
            onChange={handleTitleChange}
            className={`bg-transparent border-b border-white/20 focus: border-white outline - none w-full text-center ${className} `}
            style={style}
            onClick={(e) => e.stopPropagation()}
        />
    ) : (
        <h1 className={className} style={style}>{slide.title}</h1>
    );

    const EditableH2 = ({ className, style }: any) => isEditing ? (
        <input
            value={slide.title}
            onChange={handleTitleChange}
            className={`bg-transparent border-b border-white/20 focus: border-white outline - none w-full ${className} `}
            style={style}
            onClick={(e) => e.stopPropagation()}
        />
    ) : (
        <h2 className={className} style={style}>{slide.title}</h2>
    );

    // === TITLE SLIDE ===
    if (slide.isTitle) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, #${theme.accent1}, #${theme.accent2})` }}>
                {/* Decorative orbs */}
                <div className="absolute" style={{ width: fs ? 300 : 80, height: fs ? 300 : 80, borderRadius: '50%', background: hexRgba(theme.accent2, 0.3), top: '-10%', left: '-5%', filter: fs ? 'blur(40px)' : 'blur(10px)' }} />
                <div className="absolute" style={{ width: fs ? 200 : 50, height: fs ? 200 : 50, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', bottom: '-5%', right: '5%', filter: fs ? 'blur(30px)' : 'blur(8px)' }} />
                <div className="relative z-10 text-center" style={{ padding: fs ? 48 : 12 }}>
                    <EditableTitle className="font-bold text-white mb-4 block" style={{ fontSize: fs ? 48 : 14, lineHeight: 1.2, letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }} />
                    <div className="mx-auto" style={{ width: fs ? 80 : 20, height: fs ? 3 : 1, background: 'rgba(255,255,255,0.4)', margin: fs ? '20px auto' : '6px auto', borderRadius: 2 }} />
                    <p className="text-white/50 uppercase tracking-widest mt-4" style={{ fontSize: fs ? 13 : 6, letterSpacing: '0.2em' }}>{theme.name}</p>
                </div>
            </div>
        );
    }

    const type = slide.slideType || 'bullets';

    // Shared title bar
    const TitleBar = () => (
        <div style={{
            background: `linear-gradient(90deg, #${theme.accent1}, #${theme.accent2})`,
            padding: fs ? '14px 32px' : '4px 10px',
        }}>
            <EditableH2 className="font-bold text-white truncate" style={{ fontSize: fs ? 20 : 9, letterSpacing: '-0.01em' }} />
        </div>
    );

    // === SECTION ===
    if (type === 'section') {
        return (
            <div className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden ${isEditing ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} `}
                onClick={(e) => {
                    if (isEditing && onImageEdit) {
                        e.stopPropagation();
                        onImageEdit();
                    }
                }}
                style={{
                    background: slide.imageUrl
                        ? `url(${slide.imageUrl}) center/cover no - repeat`
                        : `linear-gradient(135deg, #${theme.accent1}, #${theme.accent2})`
                }}>
                {slide.imageUrl && <div className="absolute inset-0" style={{ background: hexRgba(theme.accent1, 0.75), backdropFilter: 'blur(2px)' }} />}
                {!slide.imageUrl && (
                    <>
                        <div className="absolute" style={{ width: fs ? 400 : 100, height: fs ? 400 : 100, borderRadius: '50%', background: hexRgba(theme.accent2, 0.25), top: '-15%', left: '-10%', filter: fs ? 'blur(60px)' : 'blur(15px)' }} />
                        <div className="absolute" style={{ width: fs ? 250 : 60, height: fs ? 250 : 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', bottom: '-10%', right: '5%', filter: fs ? 'blur(40px)' : 'blur(10px)' }} />
                    </>
                )}
                {isEditing && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onImageEdit?.(); }}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full z-20 backdrop-blur-sm transition-colors border border-white/20"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                )}
                <div className="relative z-10 text-center" style={{ padding: fs ? 48 : 12 }}>
                    <h1 className="font-bold text-white" style={{ fontSize: fs ? 42 : 13, lineHeight: 1.2, textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>{slide.title}</h1>
                    {slide.content?.[0] && <>
                        <div className="mx-auto" style={{ width: fs ? 60 : 16, height: fs ? 3 : 1, background: 'rgba(255,255,255,0.5)', margin: fs ? '16px auto' : '4px auto', borderRadius: 2 }} />
                        <p className="text-white/80" style={{ fontSize: fs ? 16 : 7, fontWeight: 500 }}>{slide.content[0]}</p>
                    </>}
                </div>
            </div>
        );
    }

    // === QUOTE ===
    if (type === 'quote') {
        return (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: `#${theme.bg} ` }}>
                <TitleBar />
                <div className="flex-1 flex items-center relative overflow-hidden" style={{ padding: fs ? 32 : 8 }}>
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                        <span style={{ fontSize: fs ? 100 : 24, lineHeight: 1, color: `#${theme.accent1} `, opacity: 0.15, fontFamily: 'Georgia, serif', position: 'absolute', top: fs ? -20 : -6, left: fs ? 0 : 0 }}>"</span>
                        <p className="italic text-center relative z-10" style={{ fontSize: fs ? 24 : 8, color: `#${theme.textColor} `, lineHeight: 1.6, maxWidth: fs ? 600 : 200, fontFamily: 'Georgia, serif' }}>{slide.content?.[0]}</p>
                        {slide.content?.[1] && <>
                            <div style={{ width: fs ? 60 : 16, height: fs ? 2 : 1, background: `#${theme.accent1} `, margin: fs ? '16px 0 8px' : '4px 0 2px', borderRadius: 2 }} />
                            <p className="font-semibold" style={{ fontSize: fs ? 13 : 6, color: `#${theme.accent2} ` }}>{slide.content[1]}</p>
                        </>}
                    </div>
                    {slide.imageUrl && (
                        <div
                            className={`h-full ml - 4 rounded-lg overflow-hidden relative shadow - lg ${isEditing ? 'cursor-pointer ring-2 ring-transparent hover:ring-blue-500 transition-all' : ''} `}
                            style={{ width: '35%', marginRight: fs ? 16 : 4 }}
                            onClick={(e) => {
                                if (isEditing && onImageEdit) {
                                    e.stopPropagation();
                                    onImageEdit();
                                }
                            }}
                        >
                            <img src={slide.imageUrl} alt="Quote" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                    )}
                    {isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onImageEdit?.(); }}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full z-20 backdrop-blur-sm transition-colors border border-white/20"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // === STATS ===
    if (type === 'stats' && slide.stats) {
        return (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: `#${theme.bg} ` }}>
                <TitleBar />
                {slide.content?.[0] && (
                    <p style={{ fontSize: fs ? 13 : 5, color: `#${theme.textColor} `, opacity: 0.6, padding: fs ? '8px 32px' : '2px 10px' }}>{slide.content[0]}</p>
                )}
                <div className="flex-1 flex items-stretch" style={{ gap: fs ? 20 : 6, padding: fs ? '8px 24px 24px' : '2px 6px 6px' }}>
                    {slide.imageUrl && (
                        <div
                            className={`w - [30 %] rounded-xl overflow-hidden relative shadow - lg ${isEditing ? 'cursor-pointer ring-2 ring-transparent hover:ring-blue-500 transition-all' : ''} `}
                            style={{ marginBottom: fs ? 4 : 1 }}
                            onClick={(e) => {
                                if (isEditing && onImageEdit) {
                                    e.stopPropagation();
                                    onImageEdit();
                                }
                            }}
                        >
                            <img src={slide.imageUrl} alt="Stats" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                    )}
                    {isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onImageEdit?.(); }}
                            className="absolute z-20 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors border border-white/20"
                            style={{ top: fs ? 10 : 2, left: fs ? 10 : 2 }}
                        >
                            <ImageIcon className="w-3 h-3" />
                        </button>
                    )}
                    <div className={`flex-1 grid gap - 2 ${slide.imageUrl ? 'grid-cols-2' : 'flex items-center justify-center'} `} style={{ gap: fs ? 16 : 4 }}>
                        {slide.stats.slice(0, 4).map((s, i) => (
                            <div key={i} className="flex-1 text-center relative overflow-hidden flex flex-col justify-center" style={{
                                background: `#${theme.cardBg} `,
                                borderRadius: fs ? 14 : 6,
                                border: `1px solid ${hexRgba(theme.accent1, 0.2)} `,
                                padding: fs ? '20px 16px' : '4px 4px',
                                boxShadow: fs ? `0 4px 20px ${hexRgba(theme.accent1, 0.08)} ` : 'none',
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: fs ? 3 : 1, background: `linear-gradient(90deg, #${theme.accent1}, #${theme.accent2})` }} />
                                <p className="font-bold" style={{ fontSize: fs ? 32 : 10, color: `#${theme.accent1} `, letterSpacing: '-0.02em' }}>{s.value}</p>
                                <p style={{ fontSize: fs ? 11 : 4.5, color: `#${theme.textColor} `, opacity: 0.65, marginTop: fs ? 8 : 2 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // === COMPARISON ===
    if (type === 'comparison' && slide.columns) {
        return (
            <div className={`flex-1 flex flex-col relative overflow-hidden ${isEditing ? 'cursor-pointer' : ''} `}
                onClick={(e) => {
                    if (isEditing && onImageEdit) {
                        e.stopPropagation();
                        onImageEdit();
                    }
                }}
                style={{
                    background: slide.imageUrl
                        ? `url(${slide.imageUrl}) center/cover no - repeat`
                        : `#${theme.bg} `
                }}>
                <TitleBar />
                {slide.imageUrl && <div className="absolute inset-x-0 bottom-0 top-[20px] bg-black/60 backdrop-blur-[2px]" />}
                {isEditing && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onImageEdit?.(); }}
                        className="absolute top-12 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full z-20 backdrop-blur-sm transition-colors border border-white/20"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                )}
                <div className="flex-1 flex items-stretch relative z-10" style={{ gap: fs ? 8 : 2, padding: fs ? '12px 20px 20px' : '3px 6px 6px' }}>
                    {slide.columns.slice(0, 2).map((col, i) => {
                        const accent = i === 0 ? theme.accent1 : theme.accent2;
                        return (
                            <div key={i} className="flex-1 flex flex-col" style={{
                                background: slide.imageUrl ? hexRgba(theme.cardBg, 0.9) : `#${theme.cardBg} `,
                                borderRadius: fs ? 14 : 6,
                                border: `1px solid ${hexRgba(accent, 0.25)} `,
                                overflow: 'hidden',
                            }}>
                                <div style={{ background: `linear-gradient(90deg, #${accent}, ${hexRgba(accent, 0.7)})`, padding: fs ? '10px 16px' : '3px 6px' }}>
                                    <h3 className="font-bold text-white text-center" style={{ fontSize: fs ? 16 : 7 }}>{col.title}</h3>
                                </div>
                                <div style={{ padding: fs ? '12px 16px' : '3px 5px' }}>
                                    {col.points?.map((pt, j) => (
                                        <div key={j} className="flex items-start" style={{ gap: fs ? 8 : 3, marginBottom: fs ? 8 : 2 }}>
                                            <span className="flex-shrink-0 rounded-full" style={{ width: fs ? 6 : 2.5, height: fs ? 6 : 2.5, marginTop: fs ? 6 : 2.5, background: `#${accent} ` }} />
                                            <span style={{ fontSize: fs ? 13 : 5.5, color: `#${theme.textColor} `, lineHeight: 1.5 }}>{pt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {/* VS badge */}
                    <div className="absolute flex items-center justify-center" style={{
                        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: fs ? 44 : 16, height: fs ? 44 : 16, borderRadius: '50%',
                        background: `linear-gradient(135deg, #${theme.accent1}, #${theme.accent2})`,
                        boxShadow: `0 4px 15px ${hexRgba(theme.accent1, 0.3)} `,
                        zIndex: 10,
                    }}>
                        <span className="font-bold text-white" style={{ fontSize: fs ? 12 : 5 }}>VS</span>
                    </div>
                </div>
            </div>
        );
    }

    // === TIMELINE ===
    if (type === 'timeline' && slide.timeline) {
        return (
            <div className={`flex-1 flex flex-col ${isEditing ? 'cursor-pointer' : ''} `}
                onClick={(e) => {
                    if (isEditing && onImageEdit) {
                        e.stopPropagation();
                        onImageEdit();
                    }
                }}
                style={{
                    background: slide.imageUrl
                        ? `url(${slide.imageUrl}) center/cover no - repeat`
                        : `#${theme.bg} `
                }}>
                <TitleBar />
                {slide.imageUrl && <div className="absolute inset-x-0 bottom-0 top-[20px] bg-black/60 backdrop-blur-[2px]" />}
                {isEditing && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onImageEdit?.(); }}
                        className="absolute top-12 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full z-20 backdrop-blur-sm transition-colors border border-white/20"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                )}
                <div className="flex-1 flex items-center relative z-10" style={{ padding: fs ? '0 40px' : '0 8px' }}>
                    {/* Timeline line */}
                    <div className="absolute" style={{
                        left: fs ? 50 : 12, right: fs ? 50 : 12,
                        top: '50%', height: fs ? 3 : 1,
                        background: `linear-gradient(90deg, #${theme.accent1}, #${theme.accent2})`,
                        borderRadius: 2,
                    }} />
                    <div className="flex w-full justify-between relative z-10">
                        {slide.timeline.slice(0, 6).map((it, i) => {
                            const isAbove = i % 2 === 0;
                            return (
                                <div key={i} className="flex flex-col items-center" style={{ flex: 1 }}>
                                    {isAbove ? (
                                        <>
                                            <div className="text-center" style={{ marginBottom: fs ? 8 : 2 }}>
                                                <span className="font-bold" style={{ fontSize: fs ? 11 : 5, color: `#${theme.accent1} `, display: 'block', background: `#${theme.cardBg} `, borderRadius: fs ? 6 : 3, padding: fs ? '4px 10px' : '1px 3px', border: `1px solid ${hexRgba(theme.accent1, 0.3)} ` }}>{it.year}</span>
                                                <span style={{ fontSize: fs ? 10 : 4, color: slide.imageUrl ? 'white' : `#${theme.textColor} `, opacity: 0.85, display: 'block', marginTop: fs ? 4 : 1, maxWidth: fs ? 120 : 40 }}>{it.event}</span>
                                            </div>
                                            <div style={{ width: fs ? 4 : 2, height: fs ? 20 : 6, background: hexRgba(theme.accent1, 0.4) }} />
                                            <div style={{ width: fs ? 12 : 5, height: fs ? 12 : 5, borderRadius: '50%', background: `#${theme.accent1} `, border: `2px solid #${theme.bg} `, boxShadow: `0 0 10px ${hexRgba(theme.accent1, 0.4)} ` }} />
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ width: fs ? 12 : 5, height: fs ? 12 : 5, borderRadius: '50%', background: `#${theme.accent2} `, border: `2px solid #${theme.bg} `, boxShadow: `0 0 10px ${hexRgba(theme.accent2, 0.4)} ` }} />
                                            <div style={{ width: fs ? 4 : 2, height: fs ? 20 : 6, background: hexRgba(theme.accent2, 0.3) }} />
                                            <div className="text-center" style={{ marginTop: fs ? 8 : 2 }}>
                                                <span className="font-bold" style={{ fontSize: fs ? 11 : 5, color: `#${theme.accent2} `, display: 'block', background: `#${theme.cardBg} `, borderRadius: fs ? 6 : 3, padding: fs ? '4px 10px' : '1px 3px', border: `1px solid ${hexRgba(theme.accent2, 0.3)} ` }}>{it.year}</span>
                                                <span style={{ fontSize: fs ? 10 : 4, color: slide.imageUrl ? 'white' : `#${theme.textColor} `, opacity: 0.85, display: 'block', marginTop: fs ? 4 : 1, maxWidth: fs ? 120 : 40 }}>{it.event}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // === EXPLODED VIEW/CUTAWAY ===
    if (type === 'exploded_view' || type === 'cutaway') {
        const isCutaway = type === 'cutaway';
        return (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: `#${theme.bg} ` }}>
                <TitleBar />
                <div className="flex-1 flex" style={{ padding: fs ? 24 : 6 }}>
                    {/* Hero Image Container */}
                    {/* Hero Image Container */}
                    <div
                        className={`relative flex-1 rounded-2xl overflow-hidden border border-white/10 shadow - 2xl group ${isEditing ? 'cursor-pointer ring-2 ring-transparent hover:ring-blue-500 transition-all' : ''} `}
                        onClick={(e) => {
                            if (isEditing && onImageEdit) {
                                e.stopPropagation();
                                onImageEdit();
                            }
                        }}
                    >
                        {slide.imageUrl ? (
                            <img src={slide.imageUrl} alt={type} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
                                <span className="text-neutral-700 text-xs font-mono uppercase tracking-[0.2em] group-hover:text-neutral-500">
                                    {isEditing ? "Click to Add Image" : "Technical Visual Placeholder"}
                                </span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {isEditing && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onImageEdit?.(); }}
                                className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full z-20 backdrop-blur-sm transition-colors border border-white/20"
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                        )}

                        {/* Technical Overlays */}
                        <div className="absolute top-4 left-4 flex flex-col gap-1 opacity-60">
                            <div className="h-0.5 bg-white mb-1" style={{ width: fs ? 40 : 10 }} />
                            <span className="text-[6px] md:text-[8px] font-mono text-white/70 uppercase tracking-widest">{isCutaway ? 'Cross Section' : 'Exploded Structure'}</span>
                            <span className="text-[6px] md:text-[8px] font-mono text-white/40">REF: PM/TX392-A</span>
                        </div>
                    </div>

                    {/* Content Sidebar */}
                    <div className="w-[35%] ml-6 flex flex-col justify-center gap-4">
                        <div className="space-y-4">
                            {slide.content?.slice(0, 3).map((pt, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: `#${theme.accent1} ` }} />
                                    <p style={{ fontSize: fs ? 14 : 5.5, color: `#${theme.textColor} `, lineHeight: 1.5, opacity: 0.8 }}>{pt}</p>
                                </div>
                            ))}
                        </div>
                        {/* Metric/Callout */}
                        <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
                            <span className="text-[8px] md:text-[10px] font-bold text-white/40 uppercase mb-1 block">Component Analysis</span>
                            <span className="text-[10px] md:text-[12px] font-semibold text-white">Advanced structural mapping with AI precision.</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // === DIAGRAM ===
    if (type === 'diagram' && slide.diagram?.nodes?.length) {
        return (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: `#${theme.bg} ` }}>
                <TitleBar />
                <div className="flex-1" style={{ padding: fs ? 12 : 3 }}>
                    <div className="h-full" style={{ background: hexRgba(theme.cardBg, 0.5), borderRadius: fs ? 12 : 5, border: `1px solid ${hexRgba(theme.accent1, 0.15)} `, padding: fs ? 8 : 2 }}>
                        <DiagramView nodes={slide.diagram.nodes} connections={slide.diagram.connections} compact={!fullscreen} theme={theme} />
                    </div>
                </div>
                {slide.content?.[0] && (
                    <p className="italic text-center" style={{ fontSize: fs ? 10 : 4, color: `#${theme.textColor} `, opacity: 0.5, padding: fs ? '0 16px 8px' : '0 4px 2px' }}>{slide.content[0]}</p>
                )}
            </div>
        );
    }

    // === DEFAULT: BULLETS === (Premium card layout)
    return (
        <div className="flex-1 flex flex-col" style={{ backgroundColor: `#${theme.bg} ` }}>
            <TitleBar />
            <div className="flex-1 flex overflow-hidden" style={{ padding: fs ? '12px 24px 20px' : '3px 6px 6px' }}>
                <div className="flex-1 h-full flex flex-col" style={{
                    background: hexRgba(theme.cardBg, 0.6),
                    borderRadius: fs ? 14 : 6,
                    border: `1px solid ${hexRgba(theme.accent1, 0.12)} `,
                    padding: fs ? '16px 20px' : '4px 6px',
                }}>
                    {(fs ? slide.content : slide.content.slice(0, 4)).map((pt, i) => (
                        <div key={i} className="flex items-start" style={{ gap: fs ? 10 : 3, marginBottom: fs ? 10 : 2.5 }}>
                            <span className="flex-shrink-0 rounded-full" style={{
                                width: fs ? 8 : 3, height: fs ? 8 : 3, marginTop: fs ? 7 : 2.5,
                                background: `linear-gradient(135deg, #${theme.accent1}, #${theme.accent2})`,
                                boxShadow: fs ? `0 0 6px ${hexRgba(theme.accent1, 0.3)} ` : 'none',
                            }} />
                            {isEditing ? (
                                <textarea
                                    value={pt}
                                    onChange={(e) => handleContentChange(i, e.target.value)}
                                    className="bg-transparent border-b border-white/10 focus:border-white/50 outline-none w-full resize-none"
                                    style={{ fontSize: fs ? 15 : 6, color: `#${theme.textColor} `, lineHeight: 1.6 }}
                                    rows={2}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span style={{ fontSize: fs ? 15 : 6, color: `#${theme.textColor} `, lineHeight: 1.6, opacity: 0.9 }}>{pt}</span>
                            )}
                        </div>
                    ))}
                    {!fs && slide.content.length > 4 && (
                        <p style={{ fontSize: 5, color: `#${theme.textColor} `, opacity: 0.35, marginTop: 1 }}>+{slide.content.length - 4} more</p>
                    )}
                </div>

                {/* Content Placeholder with Quick Insert Icons - REMOVED for clean UI per user request */}
                {isEditing && (!slide.content || slide.content.length === 0 || (slide.content.length === 1 && !slide.content[0])) && (
                    <div className="absolute inset-0 top-[60px] flex flex-col items-center justify-center pointer-events-none">
                        <div className="opacity-30 hover:opacity-100 transition-opacity pointer-events-auto">
                            <p className="text-center mb-8 font-medium text-neutral-400" style={{ fontSize: fs ? 24 : 14 }}>Click to add text</p>
                        </div>
                    </div>
                )}

                {slide.imageUrl && (
                    <div
                        className={`ml - 4 h-full rounded-xl overflow-hidden shadow - lg relative ${isEditing ? 'cursor-pointer ring-2 ring-transparent hover:ring-blue-500 transition-all' : ''} `}
                        style={{ width: '40%', marginRight: fs ? 8 : 2 }}
                        onClick={(e) => {
                            if (isEditing && onImageEdit) {
                                e.stopPropagation();
                                onImageEdit();
                            }
                        }}
                    >
                        <img src={slide.imageUrl} alt="Slide visual" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                )}
                {isEditing && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onImageEdit?.(); }}
                        className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full z-20 backdrop-blur-sm transition-colors border border-white/20"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// Slide Type Badge
// ═══════════════════════════════════════════════════════

const badgeColors: Record<string, string> = {
    section: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    quote: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    stats: 'bg-green-500/20 text-green-400 border-green-500/30',
    comparison: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    timeline: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    diagram: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

// ═══════════════════════════════════════════════════════
// Fit To Screen Wrapper
// ═══════════════════════════════════════════════════════

const FitToScreen: React.FC<{ children: React.ReactNode; padding?: number }> = ({ children, padding = 40 }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const { clientWidth, clientHeight } = containerRef.current;

            // Safety check for zero dimensions
            if (clientWidth === 0 || clientHeight === 0) return;

            const availableW = Math.max(0, clientWidth - padding);
            const availableH = Math.max(0, clientHeight - padding);

            // Base resolution: 1920x1080
            const scaleX = availableW / 1920;
            const scaleY = availableH / 1080;
            const newScale = Math.min(scaleX, scaleY);

            // Clamp scale to reasonable limits (min 10% size)
            setScale(Math.max(0.1, newScale));
        };

        updateScale();
        window.addEventListener('resize', updateScale);

        // Also observe container resize
        const observer = new ResizeObserver(updateScale);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', updateScale);
            observer.disconnect();
        };
    }, [padding]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden relative">
            <div
                className="flex flex-col" // Added flex flex-col to force children (SlideContent) to expand
                style={{
                    width: 1920,
                    height: 1080,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    flexShrink: 0
                }}
            >
                {children}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════

interface SlidePreviewProps {
    result: PresentationResult;
    onBack: () => void;
    onUpdate?: (newResult: PresentationResult) => void;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ result, onBack, onUpdate }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPresenting, setIsPresenting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'normal'>('grid');
    const [editedResult, setEditedResult] = useState(result);
    const [pickingImageFor, setPickingImageFor] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        setEditedResult(result);
        if (result.slides.length > 0) setCurrentSlide(0);
    }, [result]);

    const handleImageSelect = (url: string) => {
        if (pickingImageFor !== null) {
            handleSlideUpdate(pickingImageFor, { ...allSlides[pickingImageFor], imageUrl: url });
            setPickingImageFor(null);
        }
    };
    const theme = resolveTheme(editedResult); // Use edited result theme

    // Sync if prop result changes (e.g. after regeneration)
    useEffect(() => {
        setEditedResult(result);
    }, [result]);

    const handleSave = () => {
        setIsEditing(false);
        if (onUpdate) onUpdate(editedResult);
    };

    const handleSlideUpdate = (index: number, newSlideData: SlideData) => {
        const newSlides = [...editedResult.slides];
        // Handle title slide separate logic if needed, but here assuming index 0 is title slide in allSlides array
        // Wait, allSlides constructs [titleSlide, ...slides].
        // If we edit title slide (index 0), we update result.title
        // If we edit others, we update result.slides[index-1]

        if (index === 0) {
            setEditedResult({ ...editedResult, title: newSlideData.title });
        } else {
            newSlides[index - 1] = newSlideData;
            setEditedResult({ ...editedResult, slides: newSlides });
        }
    };

    const allSlides = [
        { title: editedResult.title, content: [theme.name], isTitle: true },
        ...editedResult.slides
    ];

    useLayoutEffect(() => {
        if (!isPresenting) gsap.from('.slide-card', { y: 30, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' });
    }, [isPresenting]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isPresenting) return;
        if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlide(p => Math.min(p + 1, allSlides.length - 1));
        else if (e.key === 'ArrowLeft') setCurrentSlide(p => Math.max(p - 1, 0));
        else if (e.key === 'Escape') setIsPresenting(false);
    }, [isPresenting, allSlides.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // ─── Fullscreen Presentation ───
    if (isPresenting) {
        const slide = allSlides[currentSlide];
        const progress = ((currentSlide + 1) / allSlides.length) * 100;
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                {/* Progress bar */}
                <div className="h-0.5 bg-neutral-900">
                    <div className="h-full transition-all duration-300" style={{ width: `${progress}% `, background: `linear-gradient(90deg, #${theme.accent1}, #${theme.accent2})` }} />
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-5xl aspect-[16/9] rounded-xl overflow-hidden flex flex-col"
                        style={{ backgroundColor: `#${theme.bg} `, boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${hexRgba(theme.accent1, 0.1)} ` }}>
                        <SlideContent slide={slide} fullscreen={true} theme={theme} />
                    </div>
                </div>
                <div className="flex items-center justify-between px-8 py-3 bg-neutral-900/90 backdrop-blur-sm border-t border-neutral-800/50">
                    <button onClick={() => setIsPresenting(false)} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm">
                        <X className="w-4 h-4" /> Exit
                    </button>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setCurrentSlide(p => Math.max(0, p - 1))} disabled={currentSlide === 0} className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                        <span className="text-sm text-neutral-300 min-w-[80px] text-center font-medium">{currentSlide + 1}/{allSlides.length}</span>
                        <button onClick={() => setCurrentSlide(p => Math.min(allSlides.length - 1, p + 1))} disabled={currentSlide === allSlides.length - 1} className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 transition-all"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                    <span className="text-xs text-neutral-500">← → Space • Esc to exit</span>
                </div>
            </div>
        );
    }

    // ─── Grid View ───
    return (
        <div ref={containerRef} className="min-h-screen bg-neutral-950 text-white">
            {/* Ribbon Toolbar */}
            <div className="sticky top-0 z-20">
                <RibbonToolbar
                    title={editedResult.title}
                    onBack={onBack}
                    onPresent={() => { setCurrentSlide(0); setIsPresenting(true); }}
                    onEdit={() => setIsEditing(true)}
                    onSave={handleSave}
                    onDownload={() => { if (editedResult.downloadUrl) window.open(editedResult.downloadUrl, '_blank'); }}
                    isEditing={isEditing}
                    onAddSlide={() => {
                        const newSlide = {
                            title: "New Slide",
                            content: ["Click to add text"],
                            slideType: "bullets"
                        };
                        setEditedResult({
                            ...editedResult,
                            slides: [...editedResult.slides, newSlide as any]
                        });
                        // Select the new slide (which will be at the end)
                        // allSlides = [title, ...slides]. Length increases by 1.
                        // New index is allSlides.length (current length is N, new length N+1, index is N).
                        setTimeout(() => setCurrentSlide(allSlides.length), 0);
                    }}
                    onInsertImage={() => setPickingImageFor(currentSlide)}
                />
            </div>

            <main className="flex-1 flex overflow-hidden">
                {viewMode === 'normal' ? (
                    <div className="flex w-full h-[calc(100vh-140px)]">
                        {/* Sidebar Thumbnails */}
                        <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="p-4 space-y-4">
                                {allSlides.map((slide, index) => (
                                    <div key={index}
                                        className={`flex gap-3 group cursor-pointer ${currentSlide === index ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                                        onClick={() => setCurrentSlide(index)}
                                    >
                                        <div className="text-xs text-neutral-500 font-medium w-4 text-right pt-2">{index + 1}</div>
                                        <div className={`flex-1 aspect-[16/9] rounded border-2 overflow-hidden relative ${currentSlide === index ? 'border-[#d04423]' : 'border-transparent group-hover:border-neutral-600'}`}>
                                            <FitToScreen padding={0}>
                                                <SlideContent
                                                    slide={slide as any}
                                                    fullscreen={true}
                                                    theme={theme}
                                                    isEditing={false}
                                                />
                                            </FitToScreen>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Main Canvas */}
                        <div className="flex-1 bg-neutral-950 flex flex-col relative overflow-hidden">
                            <div className="flex-1 overflow-hidden relative">
                                <FitToScreen>
                                    <SlideContent
                                        slide={allSlides[currentSlide] as any}
                                        fullscreen={true}
                                        theme={theme}
                                        isEditing={true} // Always allow editing in Normal view
                                        onChange={(newData) => handleSlideUpdate(currentSlide, newData)}
                                        onImageEdit={() => setPickingImageFor(currentSlide)}
                                    />
                                </FitToScreen>
                            </div>

                            {/* Bottom Status Bar */}
                            <div className="h-6 bg-[#2b2b2b] border-t border-neutral-700 flex items-center justify-between px-4 text-[10px] text-neutral-400 select-none">
                                <div className="flex items-center gap-4">
                                    <span>Slide {currentSlide + 1} of {allSlides.length}</span>
                                    <span>{theme.name}</span>
                                    <span>English (United States)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="hover:text-white cursor-pointer" onClick={() => setViewMode('grid')}>Grid View</span>
                                    <div className="w-px h-3 bg-neutral-600"></div>
                                    <span>Notes</span>
                                    <span>Comments</span>
                                    <div className="flex items-center gap-2 ml-4">
                                        <span className="cursor-pointer hover:text-white">-</span>
                                        <div className="w-24 h-1 bg-neutral-600 rounded-full overflow-hidden">
                                            <div className="w-1/2 h-full bg-neutral-400"></div>
                                        </div>
                                        <span className="cursor-pointer hover:text-white">+</span>
                                        <span className="ml-1">64%</span>
                                    </div>
                                    <div className="w-px h-3 bg-neutral-600 mx-2"></div>
                                    <button onClick={() => setIsPresenting(true)} className="hover:text-white" title="Slide Show">
                                        <MonitorPlay className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div >
                    </div >
                ) : (
                    /* Grid View */
                    <div className="p-8 max-w-7xl mx-auto w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {allSlides.map((slide, index) => {
                                const st = slide.isTitle ? undefined : slide.slideType;
                                const bc = st ? badgeColors[st] : undefined;
                                return (
                                    <div key={index}
                                        onClick={() => { setCurrentSlide(index); setViewMode('normal'); }}
                                        className={`slide-card group relative cursor-pointer`}
                                    >
                                        <div className={`aspect-[16/9] rounded-xl overflow-hidden border flex flex-col transition-all duration-300 ${isEditing ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-neutral-800/50 group-hover:border-opacity-100 group-hover:scale-[1.03]'}`}
                                            style={{ backgroundColor: `#${theme.bg}` }}
                                        >
                                            <div className="pointer-events-none w-full h-full">
                                                <SlideContent
                                                    slide={slide as any}
                                                    fullscreen={false}
                                                    theme={theme}
                                                    isEditing={false}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <p className="text-xs text-neutral-500">{index === 0 ? 'Title' : `Slide ${index}`} </p>
                                            {bc && st && st !== 'bullets' && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${bc}`}>{st}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main >

            {/* Image Picker Modal */}
            {
                pickingImageFor !== null && (
                    <ImagePicker
                        onSelect={handleImageSelect}
                        onClose={() => setPickingImageFor(null)}
                        initialKeyword={allSlides[pickingImageFor].imageKeyword || allSlides[pickingImageFor].title}
                        initialPrompt={allSlides[pickingImageFor].imagePrompt}
                    />
                )
            }
        </div >
    );
};

