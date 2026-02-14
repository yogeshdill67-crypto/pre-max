import PptxGenJS from 'pptxgenjs';
import path from 'path';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface DiagramNode {
    id: string;
    label: string;
    type: 'process' | 'decision' | 'start' | 'end' | 'data';
}

export interface DiagramConnection {
    from: string;
    to: string;
    label?: string;
}

export interface AITheme {
    name: string;
    bg: string;
    accent1: string;
    accent2: string;
    textColor: string;
    cardBg: string;
    isDark: boolean;
    fontStyle: string;
}

export interface SlideData {
    slideType?: string;
    title: string;
    content: string[];
    imageKeyword?: string;
    imageUrl?: string;
    imageData?: string;
    stats?: { value: string; label: string }[];
    columns?: { title: string; points: string[] }[];
    timeline?: { year: string; event: string }[];
    diagram?: { nodes: DiagramNode[]; connections: DiagramConnection[] };
}

export interface PresentationData {
    title: string;
    mode: string;
    theme?: AITheme;
    slides: SlideData[];
}

// ═══════════════════════════════════════════════════════
// THEME — Fallback if AI doesn't provide one
// ═══════════════════════════════════════════════════════

const DEFAULT_THEME: AITheme = {
    name: 'Default',
    bg: '0F172A',
    accent1: '3B82F6',
    accent2: '8B5CF6',
    textColor: 'F1F5F9',
    cardBg: '1E293B',
    isDark: true,
    fontStyle: 'modern',
};

const resolveTheme = (data: PresentationData): AITheme => {
    if (data.theme && data.theme.bg && data.theme.accent1) {
        // Strip any accidental # prefix
        const clean = (c: string) => c.replace(/^#/, '');
        return {
            name: data.theme.name || 'Custom',
            bg: clean(data.theme.bg),
            accent1: clean(data.theme.accent1),
            accent2: clean(data.theme.accent2 || data.theme.accent1),
            textColor: clean(data.theme.textColor || (data.theme.isDark ? 'F1F5F9' : '1E293B')),
            cardBg: clean(data.theme.cardBg || (data.theme.isDark ? '1E293B' : 'F1F5F9')),
            isDark: data.theme.isDark !== false,
            fontStyle: data.theme.fontStyle || 'modern',
        };
    }
    return DEFAULT_THEME;
};

// ═══════════════════════════════════════════════════════
// FONT MAPPING
// ═══════════════════════════════════════════════════════

const getFonts = (style: string) => {
    switch (style) {
        case 'classic': return { heading: 'Cambria', body: 'Garamond' };
        case 'playful': return { heading: 'Trebuchet MS', body: 'Verdana' };
        default: return { heading: 'Segoe UI', body: 'Calibri' };
    }
};

// Helper to lighten/darken hex colors
const adjustColor = (hex: string, percent: number): string => {
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(2.55 * percent)));
    return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
};

// ═══════════════════════════════════════════════════════
// DECORATIVE SHAPES (Gamma-style subtle accents)
// ═══════════════════════════════════════════════════════

const addDecoShapes = (slide: PptxGenJS.Slide, pres: PptxGenJS, theme: AITheme, variant: number) => {
    const patterns = [
        () => {
            slide.addShape(pres.ShapeType.ellipse, { x: 7.8, y: -0.8, w: 3, h: 3, fill: { color: theme.accent1, transparency: 88 } });
            slide.addShape(pres.ShapeType.ellipse, { x: -1.2, y: 5.5, w: 2.5, h: 2.5, fill: { color: theme.accent2, transparency: 88 } });
        },
        () => {
            slide.addShape(pres.ShapeType.rect, { x: 9, y: 0, w: 1, h: '100%', fill: { color: theme.accent1, transparency: 92 } });
            slide.addShape(pres.ShapeType.ellipse, { x: -0.6, y: -0.6, w: 1.8, h: 1.8, fill: { color: theme.accent2, transparency: 90 } });
        },
        () => {
            slide.addShape(pres.ShapeType.rtTriangle, { x: -0.5, y: -0.5, w: 2.2, h: 2.2, fill: { color: theme.accent1, transparency: 88 } });
            slide.addShape(pres.ShapeType.ellipse, { x: 8, y: 5, w: 2, h: 2, fill: { color: theme.accent2, transparency: 90 } });
        },
        () => {
            slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: '100%', fill: { color: theme.accent1 } });
            slide.addShape(pres.ShapeType.ellipse, { x: 8, y: 0.5, w: 1.6, h: 1.6, fill: { color: theme.accent2, transparency: 85 } });
            slide.addShape(pres.ShapeType.ellipse, { x: 8.5, y: 5.2, w: 1, h: 1, fill: { color: theme.accent1, transparency: 88 } });
        },
        () => {
            slide.addShape(pres.ShapeType.ellipse, { x: 7.5, y: -1.5, w: 4, h: 4, fill: { color: theme.accent1, transparency: 92 } });
            slide.addShape(pres.ShapeType.ellipse, { x: 8.2, y: 0.2, w: 2.5, h: 2.5, fill: { color: theme.accent2, transparency: 90 } });
            slide.addShape(pres.ShapeType.ellipse, { x: -1.5, y: 4, w: 3, h: 3, fill: { color: theme.accent1, transparency: 93 } });
        },
    ];
    patterns[variant % patterns.length]();
};

// ═══════════════════════════════════════════════════════
// DIAGRAM RENDERER
// ═══════════════════════════════════════════════════════

const getShapeForType = (pres: PptxGenJS, type: string) => {
    switch (type) {
        case 'start': case 'end': return pres.ShapeType.ellipse;
        case 'decision': return pres.ShapeType.diamond;
        case 'data': return pres.ShapeType.parallelogram;
        default: return pres.ShapeType.rect;
    }
};

const getDiagramNodeColor = (type: string, theme: AITheme) => {
    switch (type) {
        case 'start': return '10B981';
        case 'end': return 'EF4444';
        case 'decision': return 'F59E0B';
        case 'data': return theme.accent2;
        default: return theme.accent1;
    }
};

const renderDiagram = (slide: PptxGenJS.Slide, pres: PptxGenJS, diagram: { nodes: DiagramNode[]; connections: DiagramConnection[] }, theme: AITheme, fonts: ReturnType<typeof getFonts>) => {
    const nodes = diagram.nodes;
    const cols = Math.min(nodes.length, 4);
    const nodeW = 1.8, nodeH = 0.7, gapX = 2.2, gapY = 1.4, startX = 0.8, startY = 1.8;
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => { positions[n.id] = { x: startX + (i % cols) * gapX, y: startY + Math.floor(i / cols) * gapY }; });

    diagram.connections.forEach(conn => {
        const f = positions[conn.from], t = positions[conn.to];
        if (!f || !t) return;
        const isH = Math.abs(f.y - t.y) < 0.3;
        if (isH) {
            slide.addShape(pres.ShapeType.line, { x: f.x + nodeW, y: f.y + nodeH / 2, w: t.x - f.x - nodeW, h: 0, line: { color: theme.accent1, width: 2 } });
        } else {
            slide.addShape(pres.ShapeType.line, { x: f.x + nodeW / 2, y: f.y + nodeH, w: t.x + nodeW / 2 - (f.x + nodeW / 2), h: t.y - f.y - nodeH, line: { color: theme.accent1, width: 2 } });
        }
        slide.addText('▶', { x: t.x + nodeW / 2 - 0.1, y: t.y - 0.18, w: 0.2, h: 0.18, fontSize: 6, color: theme.accent1, align: 'center' });
        if (conn.label) {
            slide.addText(conn.label, { x: (f.x + t.x) / 2 + nodeW / 2 - 0.4, y: (f.y + t.y) / 2 + nodeH / 2 - 0.1, w: 0.8, h: 0.22, fontSize: 8, italic: true, color: theme.accent2, align: 'center', fontFace: fonts.body });
        }
    });

    nodes.forEach(node => {
        const pos = positions[node.id];
        if (!pos) return;
        const color = getDiagramNodeColor(node.type, theme);
        slide.addShape(getShapeForType(pres, node.type), {
            x: pos.x, y: pos.y, w: nodeW, h: nodeH,
            fill: { color }, line: { color: theme.isDark ? 'FFFFFF' : '000000', width: 1 },
            shadow: { type: 'outer', blur: 6, offset: 2, color: '00000025' },
            rectRadius: node.type === 'process' ? 0.08 : undefined,
        });
        slide.addText(node.label, {
            x: pos.x, y: pos.y, w: nodeW, h: nodeH,
            align: 'center', valign: 'middle', fontSize: 10, bold: true, color: 'FFFFFF', fontFace: fonts.body,
        });
    });
};

// ═══════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════

export const createPptx = async (data: PresentationData, outputDir: string, _contentType: string = 'general'): Promise<string> => {
    const pres = new PptxGenJS();
    const theme = resolveTheme(data);
    const fonts = getFonts(theme.fontStyle);
    const dividerColor = theme.isDark ? adjustColor(theme.bg, 15) : adjustColor(theme.bg, -15);

    pres.title = data.title;
    pres.subject = `Generated by Pre Max AI — ${theme.name}`;
    pres.layout = 'LAYOUT_WIDE';

    // ─── Master Slide ───
    pres.defineSlideMaster({
        title: 'CONTENT',
        background: { color: theme.bg },
        objects: [
            { rect: { x: 0, y: 6.9, w: '100%', h: 0.6, fill: { color: theme.accent1, transparency: 93 } } },
            { text: { text: `PRE MAX AI — ${theme.name}`, options: { x: 0.4, y: 7.08, fontSize: 7, color: dividerColor, fontFace: fonts.body } } },
        ],
    });

    // ═══ TITLE SLIDE ═══
    const t = pres.addSlide();
    t.background = { color: theme.accent1 };
    // Decorative orbs
    t.addShape(pres.ShapeType.ellipse, { x: -2, y: -2, w: 6, h: 6, fill: { color: theme.accent2, transparency: 65 } });
    t.addShape(pres.ShapeType.ellipse, { x: 7, y: 4, w: 4.5, h: 4.5, fill: { color: 'FFFFFF', transparency: 88 } });
    t.addShape(pres.ShapeType.ellipse, { x: 8.5, y: -1.5, w: 3.5, h: 3.5, fill: { color: theme.accent2, transparency: 75 } });
    // Title
    t.addText(data.title, {
        x: 0.8, y: 1.5, w: 8, h: 2.5,
        fontSize: 44, bold: true, color: 'FFFFFF', fontFace: fonts.heading,
        align: 'left', valign: 'middle',
        shadow: { type: 'outer', blur: 8, offset: 2, color: '00000040' },
    });
    // Subtitle line
    t.addShape(pres.ShapeType.rect, { x: 0.8, y: 4.2, w: 3.5, h: 0.06, fill: { color: 'FFFFFF', transparency: 50 } });
    t.addText(`${theme.name.toUpperCase()} THEME`, {
        x: 0.8, y: 4.5, w: 8, fontSize: 14, color: 'FFFFFF', fontFace: fonts.body, transparency: 40,
    });

    // ═══ CONTENT SLIDES ═══
    data.slides.forEach((sd, idx) => {
        const type = sd.slideType || 'bullets';
        switch (type) {
            case 'section': addSection(pres, sd, theme, fonts, idx); break;
            case 'quote': addQuote(pres, sd, theme, fonts, idx); break;
            case 'stats': addStats(pres, sd, theme, fonts, idx); break;
            case 'comparison': addComparison(pres, sd, theme, fonts, idx); break;
            case 'timeline': addTimeline(pres, sd, theme, fonts, idx); break;
            case 'diagram': addDiagramSlide(pres, sd, theme, fonts, idx); break;
            default: addBullets(pres, sd, theme, fonts, idx); break;
        }
    });

    const fileName = `PreMax_${theme.name.replace(/\s+/g, '_')}_${Date.now()}.pptx`;
    const filePath = path.join(outputDir, fileName);
    await pres.writeFile({ fileName: filePath });
    return fileName;
};

// ═══════════════════════════════════════════════════════
// SLIDE BUILDERS
// ═══════════════════════════════════════════════════════

// Shared: title bar at top
function titleBar(slide: PptxGenJS.Slide, title: string, theme: AITheme, fonts: ReturnType<typeof getFonts>) {
    slide.addShape('rect' as any, { x: 0, y: 0, w: '100%', h: 1.05, fill: { color: theme.accent1 } });
    slide.addText(title, { x: 0.6, y: 0.12, w: 8.5, h: 0.8, fontSize: 24, bold: true, color: 'FFFFFF', fontFace: fonts.heading });
}

// Shared: slide number badge
function slideNum(slide: PptxGenJS.Slide, idx: number, theme: AITheme) {
    slide.addShape('ellipse' as any, { x: 9.15, y: 6.45, w: 0.5, h: 0.5, fill: { color: theme.accent1 } });
    slide.addText(`${idx + 1}`, { x: 9.15, y: 6.45, w: 0.5, h: 0.5, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
}

// ─── BULLETS ───
function addBullets(pres: PptxGenJS, sd: SlideData, theme: AITheme, fonts: ReturnType<typeof getFonts>, idx: number) {
    const s = pres.addSlide({ masterName: 'CONTENT' });
    addDecoShapes(s, pres, theme, idx);
    titleBar(s, sd.title, theme, fonts);

    const hasImage = !!sd.imageData;
    const contentW = hasImage ? 5.5 : 9;
    const imgX = 6.2;
    const imgW = 3.5;
    const imgH = 4.0;

    // Content card
    s.addShape(pres.ShapeType.roundRect, {
        x: 0.5, y: 1.3, w: contentW, h: 5.3,
        fill: { color: theme.cardBg, transparency: theme.isDark ? 30 : 15 },
        line: { color: adjustColor(theme.cardBg, theme.isDark ? 20 : -20), width: 0.5 },
        rectRadius: 0.12,
    });

    const bullets = sd.content.map((text, i) => ({
        text: `  ${text}`,
        options: {
            fontSize: hasImage ? 14 : 16, breakLine: true, color: theme.textColor, fontFace: fonts.body,
            bullet: { type: 'number' as const, numberType: 'arabicPeriod' as const, startAt: i + 1 },
            paraSpaceAfter: 10,
        }
    }));
    s.addText(bullets, { x: 0.9, y: 1.6, w: contentW - 0.8, h: 4.7, valign: 'top' });

    // Add image if available
    if (hasImage) {
        // Image container with rounded border effect
        s.addShape(pres.ShapeType.roundRect, {
            x: imgX - 0.1, y: 1.7, w: imgW + 0.2, h: imgH + 0.2,
            fill: { color: theme.accent1, transparency: 80 },
            line: { color: theme.accent1, width: 1 },
            rectRadius: 0.15,
        });
        s.addImage({
            data: sd.imageData!,
            x: imgX, y: 1.8, w: imgW, h: imgH,
            rounding: true,
        });
    }

    slideNum(s, idx, theme);
}

// ─── SECTION ───
function addSection(pres: PptxGenJS, sd: SlideData, theme: AITheme, fonts: ReturnType<typeof getFonts>, _idx: number) {
    const s = pres.addSlide();
    s.background = { color: theme.accent1 };

    // If we have an image, use it as a background with overlay
    if (sd.imageData) {
        s.addImage({
            data: sd.imageData,
            x: 0, y: 0, w: 10, h: 7.5,
        });
        // Dark overlay for text readability
        s.addShape(pres.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: theme.accent1, transparency: 30 },
        });
    } else {
        s.addShape(pres.ShapeType.ellipse, { x: -3, y: -3, w: 8, h: 8, fill: { color: theme.accent2, transparency: 68 } });
        s.addShape(pres.ShapeType.ellipse, { x: 6, y: 3.5, w: 5.5, h: 5.5, fill: { color: 'FFFFFF', transparency: 90 } });
        s.addShape(pres.ShapeType.ellipse, { x: 8, y: -2, w: 4, h: 4, fill: { color: theme.accent2, transparency: 75 } });
    }

    s.addText(sd.title, {
        x: 1, y: 1.8, w: 8, h: 2.5,
        fontSize: 42, bold: true, color: 'FFFFFF', fontFace: fonts.heading,
        align: 'center', valign: 'middle',
        shadow: { type: 'outer', blur: 6, offset: 2, color: '00000060' },
    });
    if (sd.content?.[0]) {
        s.addShape(pres.ShapeType.rect, { x: 3.5, y: 4.3, w: 3, h: 0.04, fill: { color: 'FFFFFF', transparency: 50 } });
        s.addText(sd.content[0], { x: 1, y: 4.5, w: 8, h: 0.8, fontSize: 16, color: 'FFFFFF', fontFace: fonts.body, align: 'center', transparency: 20 });
    }
}

// ─── QUOTE ───
function addQuote(pres: PptxGenJS, sd: SlideData, theme: AITheme, fonts: ReturnType<typeof getFonts>, idx: number) {
    const s = pres.addSlide({ masterName: 'CONTENT' });
    addDecoShapes(s, pres, theme, idx);

    const hasImage = !!sd.imageData;
    const textW = hasImage ? 6 : 8;

    s.addText('\u201C', {
        x: 0.5, y: 0.2, w: 2, h: 2.2,
        fontSize: 130, color: theme.accent1, fontFace: 'Georgia', transparency: 25,
    });
    const quote = sd.content?.[0] || sd.title;
    s.addText(quote, {
        x: 1.2, y: 1.8, w: textW, h: 3.2,
        fontSize: hasImage ? 22 : 26, italic: true, color: theme.textColor, fontFace: 'Georgia',
        align: 'center', valign: 'middle',
        lineSpacingMultiple: 1.5,
    });
    const author = sd.content?.[1] || '';
    if (author) {
        s.addShape(pres.ShapeType.rect, { x: 3.5, y: 5.15, w: 3, h: 0.04, fill: { color: theme.accent1 } });
        s.addText(author, { x: 1, y: 5.35, w: 8, h: 0.5, fontSize: 13, color: theme.accent2, fontFace: fonts.body, align: 'center', bold: true });
    }
    // Add image on the right side if available
    if (hasImage) {
        s.addImage({
            data: sd.imageData!,
            x: 7.2, y: 1.6, w: 2.5, h: 3.5,
            rounding: true,
        });
    }
    slideNum(s, idx, theme);
}

// ─── STATS ───
function addStats(pres: PptxGenJS, sd: SlideData, theme: AITheme, fonts: ReturnType<typeof getFonts>, idx: number) {
    const s = pres.addSlide({ masterName: 'CONTENT' });
    addDecoShapes(s, pres, theme, idx);
    titleBar(s, sd.title, theme, fonts);

    const hasImage = !!sd.imageData;
    const stats = sd.stats || [];
    const n = Math.min(stats.length, 4);

    if (hasImage) {
        // Image on left (30%)
        const imgW = 3.0;
        const imgH = 4.5;
        const imgX = 0.5;
        s.addShape(pres.ShapeType.roundRect, {
            x: imgX - 0.1, y: 1.7, w: imgW + 0.2, h: imgH + 0.2,
            fill: { color: theme.accent1, transparency: 80 },
            line: { color: theme.accent1, width: 1 },
            rectRadius: 0.15,
        });
        s.addImage({
            data: sd.imageData!,
            x: imgX, y: 1.8, w: imgW, h: imgH,
            rounding: true,
        });

        // Grid on right (2x2 or 1x2 etc)
        const startX = 4.0;
        const gridW = 5.5;
        // 2 columns
        const colW = (gridW - 0.2) / 2;
        const rowH = 2.1;

        stats.slice(0, 4).forEach((stat, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const cx = startX + col * (colW + 0.2);
            const cy = 1.8 + row * (rowH + 0.2);

            addStatCard(s, pres, theme, fonts, stat, cx, cy, colW, rowH);
        });

    } else {
        // Centered row (original layout)
        const cw = n <= 2 ? 3.8 : n === 3 ? 2.7 : 2.05;
        const totalW = n * cw + (n - 1) * 0.3;
        const sx = (10 - totalW) / 2;

        stats.slice(0, 4).forEach((stat, i) => {
            const cx = sx + i * (cw + 0.3);
            addStatCard(s, pres, theme, fonts, stat, cx, 1.8, cw, 4.3);
        });
    }
    slideNum(s, idx, theme);
}

function addStatCard(s: any, pres: PptxGenJS, theme: AITheme, fonts: any, stat: { value: string, label: string }, x: number, y: number, w: number, h: number) {
    s.addShape(pres.ShapeType.roundRect, {
        x, y, w, h,
        fill: { color: theme.cardBg, transparency: theme.isDark ? 20 : 10 },
        line: { color: theme.accent1, width: 1.5 },
        rectRadius: 0.12,
        shadow: { type: 'outer', blur: 5, offset: 2, color: '00000012' },
    });
    s.addShape(pres.ShapeType.rect, { x, y: y, w, h: 0.07, fill: { color: theme.accent1 } });
    s.addText(stat.value, {
        x, y: y + h * 0.15, w, h: h * 0.4,
        fontSize: 32, bold: true, color: theme.accent1, fontFace: fonts.heading, align: 'center', valign: 'middle',
    });
    s.addText(stat.label, {
        x: x + 0.1, y: y + h * 0.6, w: w - 0.2, h: h * 0.3,
        fontSize: 12, color: theme.textColor, fontFace: fonts.body, align: 'center', valign: 'top',
    });
}

// ─── COMPARISON ───
function addComparison(pres: PptxGenJS, sd: SlideData, theme: AITheme, fonts: ReturnType<typeof getFonts>, idx: number) {
    const s = pres.addSlide({ masterName: 'CONTENT' });

    if (sd.imageData) {
        s.background = { data: sd.imageData };
        s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 60 } });
    } else {
        addDecoShapes(s, pres, theme, idx);
    }

    titleBar(s, sd.title, theme, fonts);

    const cols = sd.columns || [];
    const c1 = cols[0] || { title: 'A', points: [] };
    const c2 = cols[1] || { title: 'B', points: [] };

    // VS badge
    s.addShape(pres.ShapeType.rect, { x: 4.85, y: 1.3, w: 0.3, h: 5.3, fill: { color: adjustColor(theme.bg, theme.isDark ? 15 : -10), transparency: 60 } });
    s.addShape(pres.ShapeType.ellipse, { x: 4.5, y: 3.4, w: 1, h: 1, fill: { color: theme.accent1 } });
    s.addText('VS', { x: 4.5, y: 3.4, w: 1, h: 1, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: fonts.heading });

    // Col 1
    s.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 1.3, w: 4.3, h: 5.3, fill: { color: theme.cardBg, transparency: theme.isDark ? 35 : 15 }, line: { color: theme.accent1, width: 1 }, rectRadius: 0.1 });
    s.addText(c1.title, { x: 0.6, y: 1.5, w: 3.9, h: 0.6, fontSize: 18, bold: true, color: theme.accent1, fontFace: fonts.heading, align: 'center' });
    const b1 = c1.points.map(p => ({ text: `  ${p}`, options: { fontSize: 13, breakLine: true, bullet: { code: '2022' }, color: theme.textColor, paraSpaceAfter: 7, fontFace: fonts.body } }));
    s.addText(b1, { x: 0.8, y: 2.3, w: 3.5, h: 3.8, valign: 'top' });

    // Col 2
    s.addShape(pres.ShapeType.roundRect, { x: 5.3, y: 1.3, w: 4.3, h: 5.3, fill: { color: theme.cardBg, transparency: theme.isDark ? 35 : 15 }, line: { color: theme.accent2, width: 1 }, rectRadius: 0.1 });
    s.addText(c2.title, { x: 5.5, y: 1.5, w: 3.9, h: 0.6, fontSize: 18, bold: true, color: theme.accent2, fontFace: fonts.heading, align: 'center' });
    const b2 = c2.points.map(p => ({ text: `  ${p}`, options: { fontSize: 13, breakLine: true, bullet: { code: '2022' }, color: theme.textColor, paraSpaceAfter: 7, fontFace: fonts.body } }));
    s.addText(b2, { x: 5.7, y: 2.3, w: 3.5, h: 3.8, valign: 'top' });
    slideNum(s, idx, theme);
}

// ─── TIMELINE ───
function addTimeline(pres: PptxGenJS, sd: SlideData, theme: AITheme, fonts: ReturnType<typeof getFonts>, idx: number) {
    const s = pres.addSlide({ masterName: 'CONTENT' });

    if (sd.imageData) {
        s.background = { data: sd.imageData };
        s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 60 } });
    } else {
        addDecoShapes(s, pres, theme, idx);
    }

    titleBar(s, sd.title, theme, fonts);

    const items = sd.timeline || [];
    const n = Math.min(items.length, 6);
    const lineY = 3.8;
    s.addShape(pres.ShapeType.rect, { x: 0.8, y: lineY, w: 8.4, h: 0.05, fill: { color: theme.accent1 } });

    items.slice(0, 6).forEach((item, i) => {
        const cx = 1.2 + i * (8 / n);
        const above = i % 2 === 0;

        s.addShape(pres.ShapeType.ellipse, { x: cx - 0.2, y: lineY - 0.15, w: 0.4, h: 0.4, fill: { color: theme.accent1 }, line: { color: theme.isDark ? 'FFFFFF' : theme.bg, width: 2 }, shadow: { type: 'outer', blur: 3, offset: 1, color: '00000018' } });
        s.addShape(pres.ShapeType.rect, { x: cx - 0.01, y: above ? lineY - 1 : lineY + 0.3, w: 0.02, h: 0.85, fill: { color: adjustColor(theme.bg, theme.isDark ? 25 : -20) } });

        const badgeY = above ? lineY - 1.7 : lineY + 1.2;
        s.addShape(pres.ShapeType.roundRect, { x: cx - 0.55, y: badgeY, w: 1.1, h: 0.45, fill: { color: theme.accent1 }, rectRadius: 0.06 });
        s.addText(item.year, { x: cx - 0.55, y: badgeY, w: 1.1, h: 0.45, fontSize: 10, bold: true, color: 'FFFFFF', fontFace: fonts.heading, align: 'center', valign: 'middle' });

        const evY = above ? badgeY + 0.5 : badgeY - 0.6;
        s.addText(item.event, { x: cx - 0.7, y: evY, w: 1.4, h: 0.6, fontSize: 9, color: theme.textColor, fontFace: fonts.body, align: 'center', valign: 'top' });
    });
    slideNum(s, idx, theme);
}

// ─── DIAGRAM ───
function addDiagramSlide(pres: PptxGenJS, sd: SlideData, theme: AITheme, fonts: ReturnType<typeof getFonts>, idx: number) {
    const s = pres.addSlide({ masterName: 'CONTENT' });
    addDecoShapes(s, pres, theme, idx);
    titleBar(s, sd.title, theme, fonts);

    s.addShape(pres.ShapeType.roundRect, {
        x: 0.3, y: 1.2, w: 9.4, h: 5.3,
        fill: { color: theme.isDark ? adjustColor(theme.bg, 8) : 'FFFFFF', transparency: 15 },
        line: { color: adjustColor(theme.bg, theme.isDark ? 20 : -15), width: 0.5 },
        rectRadius: 0.08,
    });

    if (sd.diagram?.nodes?.length) {
        renderDiagram(s, pres, sd.diagram, theme, fonts);
    }
    if (sd.content?.[0]) {
        s.addText(sd.content[0], { x: 0.5, y: 6.25, w: 9, h: 0.35, fontSize: 9, italic: true, color: theme.textColor, fontFace: fonts.body, align: 'center' });
    }
    slideNum(s, idx, theme);
}
