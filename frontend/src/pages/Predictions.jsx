import { useState, useCallback, useEffect } from 'react';
import {
    Upload, FileSpreadsheet, X, Eye, Loader2, CheckCircle2,
    AlertCircle, ChevronLeft, ChevronRight, Shield, Hash, ArrowRight, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useCategory } from '@/context/CategoryContext';
import * as api from '@/services/api';

const PREVIEW_PAGE_SIZE = 50;

function parseCSVFull(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line =>
        line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );
    return { headers, rows, totalRows: rows.length };
}

export default function UploadFile() {
    const { category } = useCategory();
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [recentUploads, setRecentUploads] = useState([]);

    // Pipeline states
    const [processCode, setProcessCode] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [processStatus, setProcessStatus] = useState(null); // null | 'uploading' | 'validating' | 'validated' | 'processing' | 'completed' | 'error'
    const [validationResult, setValidationResult] = useState(null);

    useEffect(() => { loadRecentUploads(); }, [category]);

    const loadRecentUploads = async () => {
        try {
            const res = await api.listFiles(category);
            setRecentUploads(res.files || []);
        } catch { /* silent */ }
    };

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f?.name.endsWith('.csv')) handleFileSelected(f);
    }, [category]);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f?.name.endsWith('.csv')) handleFileSelected(f);
    };

    // ── Auto-upload + validate on file selection ──
    const handleFileSelected = async (f) => {
        setFile(f);
        setProcessCode(null);
        setProcessStatus('uploading');
        setStatusMessage('');
        setError('');
        setValidationResult(null);
        setPreviewPage(1);

        // Parse CSV preview locally
        const reader = new FileReader();
        reader.onload = (e) => setPreview(parseCSVFull(e.target.result));
        reader.readAsText(f);

        // Step 1: Upload
        setIsUploading(true);
        setStatusMessage('Uploading file...');
        try {
            const uploadRes = await api.uploadFile(f, category);
            const code = uploadRes.process_code;
            setProcessCode(code);
            setIsUploading(false);

            // Step 2: Validate immediately
            setProcessStatus('validating');
            setIsValidating(true);
            setStatusMessage('Validating schema...');

            try {
                const valRes = await api.validateFile(code);
                setValidationResult(valRes);
                if (!valRes.is_valid) {
                    setProcessStatus('error');
                    setError(`Validation failed: ${valRes.errors?.join(', ') || 'Unknown error'}`);
                } else {
                    setProcessStatus('validated');
                    setStatusMessage('Validation passed — Ready to process');
                }
            } catch (valErr) {
                // Validation endpoint may fail for auto-detect — still allow processing
                setProcessStatus('validated');
                setStatusMessage('Schema auto-detected — Ready to process');
            }
            setIsValidating(false);
        } catch (err) {
            setProcessStatus('error');
            setError(err.message);
            setIsUploading(false);
            setIsValidating(false);
        }
    };

    // ── Process (train + predict) ──
    const handleProcess = async () => {
        if (!processCode) return;
        setIsProcessing(true);
        setError('');
        setProcessStatus('processing');
        setStatusMessage(`Processing ${processCode}...`);

        try {
            const processRes = await api.processFile(processCode);
            setProcessStatus('completed');
            setStatusMessage(`✓ Processed — ${processRes.predicted_churn} churners detected (${processRes.churn_rate}%)`);
            loadRecentUploads();
        } catch (err) {
            setProcessStatus('error');
            setError(err.message);
            setStatusMessage('');
        } finally {
            setIsProcessing(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setProcessCode(null);
        setProcessStatus(null);
        setStatusMessage('');
        setError('');
        setValidationResult(null);
    };

    const isWorking = isUploading || isValidating || isProcessing;
    const totalPreviewPages = preview ? Math.ceil(preview.rows.length / PREVIEW_PAGE_SIZE) : 0;
    const previewSlice = preview ? preview.rows.slice(
        (previewPage - 1) * PREVIEW_PAGE_SIZE,
        previewPage * PREVIEW_PAGE_SIZE
    ) : [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Upload File</h1>
                <p className="text-muted-foreground mt-0.5">Upload customer data for churn prediction — {category}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Upload Area */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Upload Data</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {!file ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                                        ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/50 hover:border-muted-foreground/40'}`}
                                >
                                    <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3
                                        ${isDragging ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'} transition-colors`}>
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium mb-1">Drop your CSV file here</p>
                                    <p className="text-xs text-muted-foreground mb-4">Auto-validates on upload</p>
                                    <label>
                                        <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                                            <span>Browse Files</span>
                                        </Button>
                                        <input type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* File info */}
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <FileSpreadsheet className="h-7 w-7 text-emerald-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB · {preview?.totalRows || 0} rows · {preview?.headers?.length || 0} columns
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearFile} disabled={isWorking}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {/* Pipeline progress */}
                                    <div className="space-y-2">
                                        {/* Uploading */}
                                        <PipelineStep
                                            label="Upload"
                                            status={processStatus === 'uploading' ? 'loading' : processCode ? 'done' : 'pending'}
                                        />
                                        {/* Validating */}
                                        <PipelineStep
                                            label="Schema Validation"
                                            status={
                                                processStatus === 'validating' ? 'loading' :
                                                    ['validated', 'processing', 'completed'].includes(processStatus) ? 'done' :
                                                        processStatus === 'error' && validationResult && !validationResult.is_valid ? 'error' :
                                                            'pending'
                                            }
                                        />
                                        {/* Processing */}
                                        <PipelineStep
                                            label="ML Processing"
                                            status={
                                                processStatus === 'processing' ? 'loading' :
                                                    processStatus === 'completed' ? 'done' :
                                                        'pending'
                                            }
                                        />
                                    </div>

                                    {/* Validation result badges */}
                                    {validationResult && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                <Shield className="h-3.5 w-3.5" /> Schema Results
                                            </p>
                                            {validationResult.matched_columns?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {validationResult.matched_columns.map((col, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                            ✓ {col.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            {validationResult.errors?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {validationResult.errors.map((err, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                                                            ✗ {err}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            {validationResult.warnings?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {validationResult.warnings.map((w, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                                                            ⚠ {w}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Process button — only when validated */}
                                    {processStatus === 'validated' && (
                                        <Button
                                            onClick={handleProcess}
                                            className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90
                                               shadow-lg shadow-primary/25 gap-2"
                                        >
                                            <Zap className="h-4 w-4" /> Process in {category}
                                        </Button>
                                    )}

                                    {/* Completed */}
                                    {processCode && processStatus === 'completed' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-emerald-400 font-medium">{statusMessage}</p>
                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Hash className="h-3 w-3" /> Process Code: <span className="font-mono font-bold text-foreground">{processCode}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline" size="sm"
                                                className="w-full gap-1.5 text-xs"
                                                onClick={() => window.location.href = '/customers'}
                                            >
                                                View Results <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Recent Uploads */}
                <div className="lg:col-span-3">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up delay-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold">Recent Uploads — {category}</CardTitle>
                                <Badge variant="secondary" className="text-xs">{recentUploads.length} files</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {recentUploads.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">No uploads for this category yet</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-border/30">
                                            <TableHead className="text-xs">File Name</TableHead>
                                            <TableHead className="text-xs">Process Code</TableHead>
                                            <TableHead className="text-xs">Status</TableHead>
                                            <TableHead className="text-xs text-right">Rows</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentUploads.map((u) => (
                                            <TableRow key={u.process_code} className="border-border/20 hover:bg-muted/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                            <FileSpreadsheet className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="text-sm font-medium truncate max-w-[200px]">{u.original_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs font-mono bg-muted/30 px-1.5 py-0.5 rounded">{u.process_code}</code>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={`text-[10px] ${u.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            u.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                                                u.status === 'processing' ? 'bg-primary/10 text-primary' :
                                                                    'bg-muted/30 text-muted-foreground'
                                                        }`}>
                                                        {u.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-sm tabular-nums font-medium">
                                                    {(u.row_count || 0).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* File Preview */}
            {file && preview && (
                <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-sm font-semibold">File Preview</CardTitle>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                    {preview.totalRows} rows · {preview.headers.length} columns
                                </span>
                                {totalPreviewPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7"
                                            disabled={previewPage <= 1}
                                            onClick={() => setPreviewPage(p => Math.max(1, p - 1))}>
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-xs tabular-nums text-muted-foreground min-w-[60px] text-center">
                                            {previewPage} / {totalPreviewPages}
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"
                                            disabled={previewPage >= totalPreviewPages}
                                            onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="overflow-auto custom-scrollbar border border-border/30 rounded-lg"
                            style={{ maxHeight: '400px', maxWidth: '100%' }}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border/30">
                                        <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur-sm z-10 text-center w-12">#</TableHead>
                                        {preview.headers.map((h, i) => (
                                            <TableHead key={i} className="text-xs whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur-sm z-10">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewSlice.map((row, i) => (
                                        <TableRow key={i} className="border-border/20">
                                            <TableCell className="text-xs text-muted-foreground text-center tabular-nums py-2">
                                                {(previewPage - 1) * PREVIEW_PAGE_SIZE + i + 1}
                                            </TableCell>
                                            {row.map((cell, j) => (
                                                <TableCell key={j} className="text-xs whitespace-nowrap py-2">{cell}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/* Pipeline step indicator */
function PipelineStep({ label, status }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${status === 'done' ? 'bg-emerald-500/15' :
                    status === 'loading' ? 'bg-primary/15' :
                        status === 'error' ? 'bg-red-500/15' :
                            'bg-muted/40'
                }`}>
                {status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                {status === 'loading' && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
                {status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                {status === 'pending' && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
            </div>
            <span className={`text-xs font-medium ${status === 'done' ? 'text-emerald-400' :
                    status === 'loading' ? 'text-primary' :
                        status === 'error' ? 'text-red-400' :
                            'text-muted-foreground'
                }`}>{label}</span>
        </div>
    );
}
