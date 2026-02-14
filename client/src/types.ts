export type AppMode = 'office' | 'education' | 'proposal' | 'notebook' | 'general' | null;

export interface ModeConfig {
    id: AppMode;
    title: string;
    description: string;
    icon: string;
    color: string;
}

export const MODES: ModeConfig[] = [
    {
        id: 'office',
        title: 'Office Mode',
        description: 'KPIs, Summaries, and Corporate Reports',
        icon: 'Briefcase',
        color: 'bg-blue-500',
    },
    {
        id: 'education',
        title: 'Education Mode',
        description: 'Pedagogical structures, Lessons, and Tutorials',
        icon: 'GraduationCap',
        color: 'bg-emerald-500',
    },
    {
        id: 'proposal',
        title: 'Proposal Mode',
        description: 'RFP Mapping, Problem Statements, and Solutions',
        icon: 'FileText',
        color: 'bg-purple-500',
    },
    {
        id: 'notebook',
        title: 'AI Notebook',
        description: 'AI Search, Research, Convert & Create — All in One',
        icon: 'BookMarked',
        color: 'bg-cyan-500',
    },
];

// Content types for the selection grid
export interface ContentTypeConfig {
    id: string;
    title: string;
    icon: string;
    description: string;
}

export const CONTENT_TYPES: ContentTypeConfig[] = [
    { id: 'business-report', title: 'Business Report', icon: 'BarChart3', description: 'Financial data, KPIs, quarterly reviews' },
    { id: 'sales-pitch', title: 'Sales Pitch', icon: 'TrendingUp', description: 'Product demos, value propositions' },
    { id: 'education', title: 'Education', icon: 'BookOpen', description: 'Lessons, tutorials, course material' },
    { id: 'project-plan', title: 'Project Plan', icon: 'FolderKanban', description: 'Timelines, milestones, deliverables' },
    { id: 'research', title: 'Research', icon: 'FlaskConical', description: 'Studies, findings, methodology' },
    { id: 'creative', title: 'Creative Portfolio', icon: 'Palette', description: 'Design showcases, portfolios' },
    { id: 'technical', title: 'Technical', icon: 'Code2', description: 'Architecture, system design, docs' },
    { id: 'marketing', title: 'Marketing', icon: 'Megaphone', description: 'Campaigns, strategy, analytics' },
    { id: 'case-study', title: 'Case Study', icon: 'FileSearch', description: 'Problem-solution, results analysis' },
];

export type TemplateChoice = 'upload' | 'auto';

export type AppStep = 'landing' | 'contentSelect' | 'workspace' | 'generating' | 'keyPointsSelect' | 'imageSelect' | 'preview' | 'notebook' | 'infographic';

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

export interface SlideData {
    slideType?: string;
    visualType?: string; // New: Exploded view, cutaway, etc.
    title: string;
    content: string[];
    isTitle?: boolean;
    imageKeyword?: string;
    imagePrompt?: string;
    imageUrl?: string;
    stats?: { value: string; label: string }[];
    columns?: { title: string; points: string[] }[];
    timeline?: { year: string; event: string }[];
    diagram?: {
        nodes: DiagramNode[];
        connections: DiagramConnection[];
    };
}

export interface PresentationResult {
    title: string;
    mode: string;
    theme?: {
        name: string;
        bg: string;
        accent1: string;
        accent2: string;
        textColor: string;
        cardBg: string;
        isDark: boolean;
        fontStyle: string;
    };
    slides: SlideData[];
    downloadUrl: string;
}

// Notebook types
export interface SearchResult {
    title: string;
    summary: string;
    sections: { heading: string; content: string }[];
    sources?: string[];
}

export interface KeyPoint {
    id: string;
    text: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
}

export interface InfographicData {
    title: string;
    subtitle: string;
    style: string;
    sections: {
        heading: string;
        content: string;
        icon?: string;
        stat?: { value: string; label: string };
    }[];
    colors: { primary: string; secondary: string; accent: string; bg: string };
}
