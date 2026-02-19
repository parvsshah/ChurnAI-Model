import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Sparkles, Zap, Target, AlertTriangle, DollarSign,
    FileSpreadsheet, Loader2, AlertCircle, Users, ChevronDown, ChevronUp,
    ShieldAlert, ShieldCheck, ShieldQuestion, Calendar, Tag, Download, Search, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCategory } from '@/context/CategoryContext';
import * as api from '@/services/api';

const GROUP_ICONS = {
    'Pricing & Offers': DollarSign,
    'Engagement & Loyalty': Target,
    'Customer Support': Zap,
    'Contract & Plans': FileSpreadsheet,
    'Product & Usage': Sparkles,
    'General': AlertTriangle,
};

const GROUP_COLORS = {
    'Pricing & Offers': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    'Engagement & Loyalty': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    'Customer Support': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    'Contract & Plans': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    'Product & Usage': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    'General': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

export default function Recommendations() {
    const { category } = useCategory();
    const [availableResults, setAvailableResults] = useState([]);
    const [processCode, setProcessCode] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [customerDialogGroup, setCustomerDialogGroup] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');

    useEffect(() => { loadResults(); }, [category]);

    const loadResults = async () => {
        try {
            const res = await api.listResults(category);
            const results = res.results || [];
            setAvailableResults(results);
            if (results.length > 0 && !processCode) {
                setProcessCode(results[0].process_code);
            }
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (processCode) loadRecommendations();
    }, [processCode]);

    const loadRecommendations = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.getRecommendations(processCode);
            setData(res);
            // Expand first group by default
            if (res.recommendation_groups?.length > 0) {
                setExpandedGroups({ [res.recommendation_groups[0].group]: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const riskDist = data?.risk_distribution || {};
    const totalRisk = Object.values(riskDist).reduce((a, b) => a + b, 0);
    const groups = data?.recommendation_groups || [];
    const customers = data?.high_risk_customers || [];
    const fileInfo = data?.file_info || {};

    // Filtered customers for the dialog search
    const dialogCustomers = useMemo(() => {
        if (!customerDialogGroup) return [];
        const all = customerDialogGroup.customers || [];
        if (!customerSearch.trim()) return all;
        const q = customerSearch.toLowerCase();
        return all.filter(c =>
            String(c.id).toLowerCase().includes(q) ||
            (c.risk_level || '').toLowerCase().includes(q) ||
            String((c.churn_probability * 100).toFixed(1)).includes(q)
        );
    }, [customerDialogGroup, customerSearch]);

    // Download customer data as CSV (Per Customer tab)
    const downloadCSV = useCallback(() => {
        const rows = customers.map(c => ({
            id: c.id,
            churn_probability: (c.churn_probability * 100).toFixed(1) + '%',
            risk_level: c.risk_level,
            signals: (c.signals || []).filter(Boolean).join('; '),
            recommendations: (c.recommendations || []).filter(Boolean).join('; '),
        }));
        const headers = ['Customer ID', 'Churn Probability', 'Risk Level', 'Churn Signals', 'Suggested Actions'];
        const keys = ['id', 'churn_probability', 'risk_level', 'signals', 'recommendations'];
        const csvContent = [
            headers.join(','),
            ...rows.map(r => keys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recommendations_all_${processCode}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [customers, processCode]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading recommendations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">AI-powered churn prevention strategies</p>
                </div>
                {availableResults.length > 0 && (
                    <Select value={processCode} onValueChange={setProcessCode}>
                        <SelectTrigger className="w-56 h-8 text-xs bg-muted/20 border-border/40">
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
            </div>

            {/* No data */}
            {!data && !error && (
                <Card className="border-border/30">
                    <CardContent className="py-12 text-center">
                        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-muted-foreground text-sm">No processed results yet for {category}</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Process a file to get AI recommendations</p>
                    </CardContent>
                </Card>
            )}

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
            )}

            {data && (
                <>
                    {/* File info bar */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/20 border border-border/30 rounded-lg px-4 py-2.5">
                        <span className="flex items-center gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" /> {fileInfo.file_name}</span>
                        <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> {fileInfo.category}</span>
                        {fileInfo.uploaded_at && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(fileInfo.uploaded_at).toLocaleDateString()}</span>}
                        <span className="ml-auto font-medium text-foreground">{data.total_records?.toLocaleString()} records</span>
                    </div>

                    {/* Risk Summary Row */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { key: 'critical', label: 'Critical', Icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
                            { key: 'high', label: 'High', Icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                            { key: 'medium', label: 'Medium', Icon: ShieldQuestion, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { key: 'low', label: 'Low', Icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        ].map(({ key, label, Icon, color, bg }) => (
                            <Card key={key} className="border-border/40 bg-card/60 backdrop-blur-sm">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`h-4 w-4 ${color}`} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold tabular-nums">{(riskDist[key] || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground">{label} Risk</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Tabs defaultValue="insights">
                        <TabsList className="bg-muted/30 border border-border/30">
                            <TabsTrigger value="insights" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" /> Grouped Insights
                                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px] rounded-full">{groups.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="customers" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5">
                                <Users className="h-3.5 w-3.5" /> Per Customer
                                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px] rounded-full">{customers.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        {/* ── Grouped Insights Tab ── */}
                        <TabsContent value="insights" className="mt-4 space-y-3">
                            {groups.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">No grouped recommendations available</p>
                            ) : groups.map((g) => {
                                const Icon = GROUP_ICONS[g.group] || Sparkles;
                                const colors = GROUP_COLORS[g.group] || GROUP_COLORS['General'];
                                const isExpanded = expandedGroups[g.group];

                                return (
                                    <Card key={g.group} className={`border-border/40 bg-card/60 overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}>
                                        <button
                                            className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/10 transition-colors"
                                            onClick={() => toggleGroup(g.group)}
                                        >
                                            <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                                                <Icon className={`h-5 w-5 ${colors.text}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold">{g.group}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {g.customer_count} customer{g.customer_count !== 1 ? 's' : ''} · {g.recommendations.length} action{g.recommendations.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border} text-xs`}>
                                                {g.customer_count}
                                            </Badge>
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                        </button>
                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3 animate-slide-up">
                                                {/* Actions list */}
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">Recommended Actions</p>
                                                    <div className="space-y-1.5">
                                                        {g.recommendations.map((rec, i) => (
                                                            <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/15">
                                                                <Zap className={`h-3.5 w-3.5 ${colors.text} mt-0.5 shrink-0`} />
                                                                <span className="text-xs">{rec}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Linked customers — show first 6, then View All button */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-medium text-muted-foreground">
                                                            Affected Customers <span className="text-muted-foreground/50">({g.customer_count})</span>
                                                        </p>
                                                        {g.customers.length > 6 && (
                                                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary px-2"
                                                                onClick={() => { setCustomerDialogGroup(g); setCustomerSearch(''); }}>
                                                                <Eye className="h-3 w-3" /> View All ({g.customers.length})
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {g.customers.slice(0, 6).map((c, i) => (
                                                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/20 border border-border/30">
                                                                <Avatar className="h-5 w-5">
                                                                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                                                        {String(c.id).slice(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-[11px] font-mono">{c.id}</span>
                                                                <Badge variant="outline" className={`text-[8px] h-4 ${c.risk_level === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                                    }`}>{(c.churn_probability * 100).toFixed(0)}%</Badge>
                                                            </div>
                                                        ))}
                                                        {g.customers.length > 6 && (
                                                            <button className="text-[10px] text-primary hover:text-primary/80 self-center font-medium transition-colors"
                                                                onClick={() => { setCustomerDialogGroup(g); setCustomerSearch(''); }}>
                                                                +{g.customers.length - 6} more
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </TabsContent>

                        {/* ── Per Customer Tab ── */}
                        <TabsContent value="customers" className="mt-4 space-y-3">
                            {customers.length > 0 && (
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
                                    </p>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-border/40" onClick={downloadCSV}>
                                        <Download className="h-3 w-3" /> Download CSV
                                    </Button>
                                </div>
                            )}
                            {customers.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">No high-risk customers found</p>
                            ) : customers.map((c, idx) => (
                                <Card key={idx} className="border-border/40 bg-card/60">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                                        {String(c.id).slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-semibold font-mono">{c.id}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {(c.churn_probability * 100).toFixed(1)}% churn probability
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`text-xs ${c.risk_level === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                }`}>{c.risk_level}</Badge>
                                        </div>

                                        {/* Signals */}
                                        {c.signals?.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Churn Signals</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {c.signals.filter(Boolean).map((s, i) => (
                                                        <Badge key={i} variant="outline" className="text-[10px] bg-red-500/5 text-red-300 border-red-500/15">
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Recommendations */}
                                        {c.recommendations?.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Suggested Actions</p>
                                                <div className="space-y-1">
                                                    {c.recommendations.filter(Boolean).map((r, i) => (
                                                        <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-emerald-500/5">
                                                            <Zap className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                                                            <span className="text-[11px]">{r}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>
                    </Tabs>
                </>
            )}

            {/* ── Customer List Dialog (from Grouped Insights) ── */}
            <Dialog open={!!customerDialogGroup} onOpenChange={(open) => { if (!open) setCustomerDialogGroup(null); }}>
                <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Affected Customers
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {customerDialogGroup?.group} · {customerDialogGroup?.customers?.length} customer{customerDialogGroup?.customers?.length !== 1 ? 's' : ''}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search by ID, risk level, or probability..."
                            className="pl-9 h-9 text-xs bg-muted/20 border-border/40"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Customer List */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1" style={{ maxHeight: '50vh' }}>
                        {dialogCustomers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No customers match "{customerSearch}"</p>
                        ) : dialogCustomers.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/15 hover:bg-muted/25 border border-transparent hover:border-border/30 transition-colors">
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-7 w-7">
                                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-medium">
                                            {String(c.id).slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-semibold font-mono">{c.id}</p>
                                        <p className="text-[10px] text-muted-foreground">{(c.churn_probability * 100).toFixed(1)}% churn probability</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`text-[9px] ${c.risk_level === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        c.risk_level === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                            c.risk_level === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}>{c.risk_level}</Badge>
                            </div>
                        ))}
                    </div>

                    {/* Footer count */}
                    <div className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border/20">
                        {dialogCustomers.length} of {customerDialogGroup?.customers?.length} customer{customerDialogGroup?.customers?.length !== 1 ? 's' : ''}
                        {customerSearch && ' matching'}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
