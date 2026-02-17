import { useState, useEffect } from 'react';
import {
    Search, Download, Filter, X, Columns3, ChevronLeft, ChevronRight,
    FileSpreadsheet, AlertCircle, Loader2, CheckSquare, Square
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
    DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategory } from '@/context/CategoryContext';
import * as api from '@/services/api';

const PAGE_SIZE = 50;

export default function Customers() {
    const { category } = useCategory();

    // Data
    const [processCode, setProcessCode] = useState('');
    const [availableResults, setAvailableResults] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [totalRows, setTotalRows] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRisk, setFilterRisk] = useState('all');
    const [predictionFilter, setPredictionFilter] = useState('all'); // 'all' | 'churn' | 'stay'
    const [showFilters, setShowFilters] = useState(false);
    const [probRange, setProbRange] = useState([0, 100]);
    const [probMin, setProbMin] = useState('0');
    const [probMax, setProbMax] = useState('100');

    // Column visibility
    const [visibleCols, setVisibleCols] = useState([]);

    // Export modal
    const [showExport, setShowExport] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [exportCols, setExportCols] = useState([]);
    const [exportFilename, setExportFilename] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => { loadAvailableResults(); }, [category]);

    const loadAvailableResults = async () => {
        try {
            const res = await api.listResults(category);
            setAvailableResults(res.results || []);
            if (res.results?.length > 0 && !processCode) {
                setProcessCode(res.results[0].process_code);
            }
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (processCode) loadResults();
    }, [processCode, page, filterRisk, searchTerm, probRange, predictionFilter]);

    const loadResults = async () => {
        if (!processCode) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.getResults(processCode, {
                page,
                pageSize: PAGE_SIZE,
                riskLevel: filterRisk !== 'all' ? filterRisk : undefined,
                search: searchTerm || undefined,
                minProbability: probRange[0] / 100,
                maxProbability: probRange[1] / 100,
                prediction: predictionFilter !== 'all' ? predictionFilter : undefined,
            });
            setHeaders(res.headers || []);
            setData(res.data || []);
            setTotalRows(res.total_rows || 0);
            setTotalPages(res.total_pages || 1);
            setSummary(res.summary || null);
            if (visibleCols.length === 0 && res.headers?.length > 0) {
                setVisibleCols(res.headers);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Slider sync
    const handleProbSliderChange = (val) => {
        setProbRange(val);
        setProbMin(String(val[0]));
        setProbMax(String(val[1]));
    };
    const handleProbMinInput = (e) => {
        const v = e.target.value; setProbMin(v);
        const n = parseInt(v);
        if (!isNaN(n) && n >= 0 && n <= probRange[1]) setProbRange([n, probRange[1]]);
    };
    const handleProbMaxInput = (e) => {
        const v = e.target.value; setProbMax(v);
        const n = parseInt(v);
        if (!isNaN(n) && n >= probRange[0] && n <= 100) setProbRange([probRange[0], n]);
    };

    const toggleCol = (col) => setVisibleCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    const toggleSelectAllVisible = () => {
        setVisibleCols(visibleCols.length === headers.length ? headers.slice(0, 3) : [...headers]);
    };

    const activeFilterCount = [
        filterRisk !== 'all',
        predictionFilter !== 'all',
        probRange[0] > 0 || probRange[1] < 100,
        searchTerm.length > 0,
    ].filter(Boolean).length;

    const clearFilters = () => {
        setFilterRisk('all');
        setPredictionFilter('all');
        setProbRange([0, 100]);
        setProbMin('0');
        setProbMax('100');
        setSearchTerm('');
        setPage(1);
    };

    // Export
    const openExportModal = () => {
        setExportCols([...headers]);
        setExportFilename(`churnai_${processCode}_${new Date().toISOString().split('T')[0]}`);
        setShowExport(true);
    };
    const toggleExportCol = (col) => setExportCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    const toggleExportSelectAll = () => setExportCols(exportCols.length === headers.length ? [] : [...headers]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await api.exportResults(processCode, exportFormat, exportCols, exportFilename);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportFilename}.${exportFormat}`;
            a.click();
            URL.revokeObjectURL(url);
            setShowExport(false);
        } catch (err) {
            setError(`Export failed: ${err.message}`);
        } finally {
            setExporting(false);
        }
    };

    const displayCols = headers.filter(h => visibleCols.includes(h));

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Results</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        {totalRows} records — {category}
                        {processCode && <span className="ml-2 font-mono text-[11px] text-foreground bg-muted/30 px-1.5 py-0.5 rounded">#{processCode}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {availableResults.length > 1 && (
                        <Select value={processCode} onValueChange={(v) => { setProcessCode(v); setPage(1); }}>
                            <SelectTrigger className="w-40 h-8 text-xs bg-muted/20 border-border/40">
                                <SelectValue placeholder="Select result" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableResults.map(r => (
                                    <SelectItem key={r.process_code} value={r.process_code}>
                                        <span className="font-mono">{r.process_code}</span>
                                        <span className="text-muted-foreground ml-1.5">· {r.original_name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <Columns3 className="h-3.5 w-3.5" /> Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-auto">
                            <DropdownMenuLabel className="text-xs">Visible Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={visibleCols.length === headers.length} onCheckedChange={toggleSelectAllVisible} className="text-xs font-medium">
                                Select All
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            {headers.map(col => (
                                <DropdownMenuCheckboxItem key={col} checked={visibleCols.includes(col)} onCheckedChange={() => toggleCol(col)} className="text-xs">
                                    {col}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={openExportModal} disabled={!processCode || data.length === 0}>
                        <Download className="h-3.5 w-3.5" /> Export
                    </Button>
                </div>
            </div>

            {/* Prediction Tabs: All | Churn | Stay */}
            <Tabs value={predictionFilter} onValueChange={(v) => { setPredictionFilter(v); setPage(1); }}>
                <div className="flex items-center gap-3 flex-wrap">
                    <TabsList className="bg-muted/30 border border-border/30">
                        <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                            All Records
                            {summary && <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[9px] rounded-full">{summary.total_records?.toLocaleString()}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="churn" className="text-xs data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400">
                            Likely to Churn
                            {summary && <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[9px] rounded-full bg-red-500/10 text-red-400">{summary.predicted_churn?.toLocaleString()}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="stay" className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
                            Likely to Stay
                            {summary && <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[9px] rounded-full bg-emerald-500/10 text-emerald-400">{summary.predicted_stay?.toLocaleString()}</Badge>}
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 ml-auto">
                        <Button variant={showFilters ? 'secondary' : 'outline'} size="sm" className="gap-1.5 text-xs" onClick={() => setShowFilters(!showFilters)}>
                            <Filter className="h-3.5 w-3.5" /> Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="default" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] rounded-full">{activeFilterCount}</Badge>
                            )}
                        </Button>
                        {activeFilterCount > 0 && (
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={clearFilters}>
                                <X className="h-3 w-3" /> Clear
                            </Button>
                        )}
                    </div>
                </div>
            </Tabs>

            {/* Filters Panel — Compact 2-column grid */}
            {showFilters && (
                <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Search + Risk */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search records…"
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                            className="pl-8 h-8 text-xs bg-muted/20 border-border/40"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Risk Level</label>
                                    <Select value={filterRisk} onValueChange={(v) => { setFilterRisk(v); setPage(1); }}>
                                        <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/40">
                                            <SelectValue placeholder="Risk Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Risks</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Right: Probability Slider (compact) */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                    Churn Probability Range
                                </label>
                                <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                                    <Slider
                                        min={0} max={100} step={1}
                                        value={probRange}
                                        onValueChange={handleProbSliderChange}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number" min={0} max={100}
                                            value={probMin} onChange={handleProbMinInput}
                                            className="h-7 text-xs bg-background border-border/40 tabular-nums text-center"
                                            placeholder="Min"
                                        />
                                        <span className="text-xs text-muted-foreground">to</span>
                                        <Input
                                            type="number" min={0} max={100}
                                            value={probMax} onChange={handleProbMaxInput}
                                            className="h-7 text-xs bg-background border-border/40 tabular-nums text-center"
                                            placeholder="Max"
                                        />
                                        <span className="text-xs text-muted-foreground">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
            )}

            {/* No results */}
            {!processCode && !loading && (
                <Card className="border-border/30">
                    <CardContent className="py-12 text-center">
                        <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-muted-foreground text-sm">No processed results yet for {category}</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Upload and process a file first</p>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {loading && (
                <div className="py-16 text-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading results...</p>
                </div>
            )}

            {/* Results Table */}
            {!loading && processCode && data.length > 0 && (
                <>
                    <div className="border border-border/40 rounded-lg overflow-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-muted/60 backdrop-blur-sm border-b border-border/40">
                                    <th className="text-left font-medium text-muted-foreground px-3 py-2 whitespace-nowrap">#</th>
                                    {displayCols.map(col => (
                                        <th key={col} className="text-left font-medium text-muted-foreground px-3 py-2 whitespace-nowrap">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => (
                                    <tr key={i} className="border-b border-border/20 hover:bg-muted/15 transition-colors">
                                        <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground tabular-nums">
                                            {(page - 1) * PAGE_SIZE + i + 1}
                                        </td>
                                        {displayCols.map(col => (
                                            <td key={col} className={`px-3 py-1.5 whitespace-nowrap ${col === 'Churn_Probability' ? 'tabular-nums' : ''}`}>
                                                {col === 'Risk_Level' ? (
                                                    <Badge variant="outline" className={`text-[10px] ${row[col] === 'critical' ? 'badge-critical' :
                                                            row[col] === 'high' ? 'badge-high' :
                                                                row[col] === 'medium' ? 'badge-medium' : 'badge-low'
                                                        }`}>{row[col]}</Badge>
                                                ) : col === 'Churn_Prediction' ? (
                                                    <Badge variant="outline" className={`text-[10px] ${row[col] === 'Yes' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        }`}>{row[col]}</Badge>
                                                ) : col === 'Churn_Probability' ? (
                                                    `${(parseFloat(row[col]) * 100).toFixed(1)}%`
                                                ) : String(row[col] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalRows)} of {totalRows}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs tabular-nums text-muted-foreground min-w-[60px] text-center">{page} / {totalPages}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Export Modal */}
            <Dialog open={showExport} onOpenChange={setShowExport}>
                <DialogContent className="sm:max-w-md bg-card border-border/40">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Export Results</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Choose format, columns, and file name
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Format</label>
                            <div className="flex gap-2">
                                <Button variant={exportFormat === 'csv' ? 'default' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => setExportFormat('csv')}>CSV</Button>
                                <Button variant={exportFormat === 'json' ? 'default' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => setExportFormat('json')}>JSON</Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">File Name</label>
                            <div className="flex items-center gap-1">
                                <Input value={exportFilename} onChange={(e) => setExportFilename(e.target.value)} className="h-8 text-xs bg-muted/20 border-border/40" />
                                <span className="text-xs text-muted-foreground">.{exportFormat}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground">Columns</label>
                                <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2" onClick={toggleExportSelectAll}>
                                    {exportCols.length === headers.length ? <><CheckSquare className="h-3 w-3" /> Deselect All</> : <><Square className="h-3 w-3" /> Select All</>}
                                </Button>
                            </div>
                            <div className="border border-border/30 rounded-lg p-2 max-h-40 overflow-auto custom-scrollbar">
                                <div className="flex flex-wrap gap-1.5">
                                    {headers.map(col => (
                                        <Badge key={col} variant="outline"
                                            className={`text-[10px] cursor-pointer transition-colors ${exportCols.includes(col) ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground border-border/40 opacity-50'}`}
                                            onClick={() => toggleExportCol(col)}>
                                            {exportCols.includes(col) ? '✓' : '○'} {col}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{exportCols.length} of {headers.length} columns · {totalRows} rows</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setShowExport(false)}>Cancel</Button>
                        <Button size="sm" disabled={exporting || exportCols.length === 0} className="gap-1.5 bg-gradient-to-r from-primary to-purple-500" onClick={handleExport}>
                            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            {exporting ? 'Exporting...' : `Download .${exportFormat}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
