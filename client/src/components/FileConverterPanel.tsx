import React, { useState, useRef } from 'react';
import { Upload, Download, Copy, Check, Loader2, FileType, AlertCircle } from 'lucide-react';

interface FileConverterPanelProps {
    onTextExtracted?: (text: string, filename: string) => void;
}

export const FileConverterPanel: React.FC<FileConverterPanelProps> = ({ onTextExtracted }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        text: string;
        filename: string;
        charCount: number;
        wordCount: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : `http://${window.location.hostname}:3000`;

    const handleFileUpload = async (file: File) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/api/convert`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setResult(data.data);
                if (onTextExtracted) {
                    onTextExtracted(data.data.text, data.data.filename);
                }
            } else {
                setError(data.error || 'Conversion failed');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDownloadTxt = () => {
        if (!result) return;
        const blob = new Blob([result.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename.replace(/\.[^.]+$/, '') + '.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 ${isLoading
                    ? 'border-cyan-500/30 bg-cyan-500/5'
                    : 'border-neutral-700 hover:border-cyan-500/50 hover:bg-neutral-800/50'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                    }}
                />
                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                        <p className="text-sm text-neutral-400">Extracting text...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center mb-3">
                            <Upload className="w-7 h-7 text-neutral-400" />
                        </div>
                        <p className="text-sm font-medium text-neutral-300 mb-1">
                            Drop a file or click to upload
                        </p>
                        <p className="text-xs text-neutral-600">
                            PDF, DOCX, TXT, MD supported
                        </p>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                        <div className="flex items-center gap-2">
                            <FileType className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm text-neutral-300">{result.filename}</span>
                        </div>
                        <div className="text-xs text-neutral-600">
                            {result.wordCount.toLocaleString()} words · {result.charCount.toLocaleString()} chars
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                            <button
                                onClick={handleCopy}
                                className="p-2 rounded-lg hover:bg-neutral-700 transition-colors"
                                title="Copy text"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-neutral-500" />
                                )}
                            </button>
                            <button
                                onClick={handleDownloadTxt}
                                className="p-2 rounded-lg hover:bg-neutral-700 transition-colors"
                                title="Download as TXT"
                            >
                                <Download className="w-4 h-4 text-neutral-500" />
                            </button>
                        </div>
                    </div>

                    {/* Text Preview */}
                    <div className="max-h-64 overflow-y-auto p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-400 leading-relaxed font-mono whitespace-pre-wrap">
                        {result.text.substring(0, 3000)}
                        {result.text.length > 3000 && (
                            <span className="text-neutral-600"> ...({result.text.length - 3000} more chars)</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
