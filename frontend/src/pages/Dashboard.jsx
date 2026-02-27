import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Users, AlertTriangle, TrendingUp, FileSpreadsheet, Loader2,
    Upload, Sparkles, ArrowRight, BarChart3, Activity, Clock,
    ShieldAlert, ShieldCheck, ShieldQuestion, Zap, CheckCircle2,
    XCircle, AlertCircle, Info, Plus, Database, Tag, BookOpen,
    Brain, Target, Layers, LineChart, Eye, Lightbulb, ArrowUpRight,
    ChevronRight, Shield, Cpu, PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCategory } from '@/context/CategoryContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as api from '@/services/api';

/* ── Animated counter hook ── */
function useAnimatedNumber(target, duration = 1200) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!target) return;
        let start = 0;
        const startTime = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);
    return value;
}

export default function Dashboard() {
    const { category, setCategory } = useCategory();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Category selection
    const [categories, setCategories] = useState([]);
    const [selectedCat, setSelectedCat] = useState('');

    // Schema validation
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [validationError, setValidationError] = useState('');

    const hasNoCategory = !category && !user?.active_category;

    useEffect(() => {
        if (hasNoCategory) {
            loadCategories();
        } else {
            loadStats();
        }
    }, [category]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await api.getDashboardStats(category);
            setStats(data);
        } catch {
            setStats(null);
        }
        setLoading(false);
    };

    const loadCategories = async () => {
        try {
            const res = await api.listCategories();
            setCategories(res.categories || []);
        } catch { /* silent */ }
        setLoading(false);
    };

    const handleSelectCategory = async () => {
        if (!selectedCat) return;
        await setCategory(selectedCat);
        await refreshUser();
        loadStats();
    };

    const handleValidateFile = useCallback(async (file) => {
        if (!file || !file.name.endsWith('.csv')) {
            setValidationError('Please select a valid CSV file');
            return;
        }
        setValidating(true);
        setValidationError('');
        setValidationResult(null);
        try {
            const result = await api.validateSchema(file, category);
            setValidationResult(result);
        } catch (err) {
            setValidationError(err.message);
        }
        setValidating(false);
    }, [category]);

    const resetValidation = () => {
        setValidationResult(null);
        setValidationError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const hasData = stats && stats.total_processed > 0;
    const riskDist = stats?.risk_distribution || {};
    const totalRiskRecords = Object.values(riskDist).reduce((a, b) => a + b, 0);

    // Animated counters for stats
    const animRecords = useAnimatedNumber(stats?.total_records || 0);
    const animChurners = useAnimatedNumber(stats?.total_churners || 0);
    const animProcessed = useAnimatedNumber(stats?.total_processed || 0);

    const riskLevels = [
        { key: 'critical', label: 'Critical', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', bar: 'from-red-500 to-rose-600', ring: 'ring-red-500/20' },
        { key: 'high', label: 'High', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', bar: 'from-orange-500 to-amber-600', ring: 'ring-orange-500/20' },
        { key: 'medium', label: 'Medium', icon: ShieldQuestion, color: 'text-amber-400', bg: 'bg-amber-500/10', bar: 'from-amber-500 to-yellow-600', ring: 'ring-amber-500/20' },
        { key: 'low', label: 'Low', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'from-emerald-500 to-green-600', ring: 'ring-emerald-500/20' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <div className="relative h-14 w-14 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-purple-500 animate-spin opacity-20" />
                        <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                            <Brain className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════
       NO CATEGORY — Onboarding
    ════════════════════════════════════════════════════════════ */
    if (hasNoCategory) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Welcome, <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'there'}</span>!
                    </h1>
                    <p className="text-muted-foreground mt-0.5">Set up your industry category to unlock churn predictions</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-3 border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/8 to-transparent rounded-bl-full" />
                        <CardContent className="p-8 relative">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-6 shadow-xl shadow-primary/25">
                                <Tag className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Select Your Industry Category</h2>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                Choose the industry domain that best matches your customer data.
                                This determines which ML model and schema validation rules ChurnAI uses.
                            </p>
                            {categories.length > 0 ? (
                                <div className="space-y-4">
                                    <Select value={selectedCat} onValueChange={setSelectedCat}>
                                        <SelectTrigger className="bg-muted/30 border-border/50 h-12 text-sm">
                                            <SelectValue placeholder="Choose a category..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.category_name} value={c.category_name}>
                                                    <div className="flex items-center gap-2">
                                                        <Database className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{c.category_name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button disabled={!selectedCat} onClick={handleSelectCategory}
                                        className="w-full h-11 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 gap-2">
                                        <CheckCircle2 className="h-4 w-4" /> Set Category & Continue
                                    </Button>
                                    <Separator className="opacity-20" />
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-muted/15 border border-border/30 text-center mb-4">
                                    <p className="text-sm text-muted-foreground">No categories registered yet.</p>
                                </div>
                            )}
                            <Button variant="outline" disabled className="w-full mt-2 h-11 gap-2 border-border/20 text-muted-foreground/40 cursor-not-allowed opacity-60">
                                <Plus className="h-4 w-4" /> Register New Category
                                <span className="ml-auto text-[10px] opacity-50 uppercase">Coming Soon</span>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up delay-200">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" /> What are Categories?
                            </h3>
                            {[
                                { icon: Layers, title: 'Industry Domain', desc: 'Telecom, SaaS, Banking, Healthcare, or Employee Retention.' },
                                { icon: Brain, title: 'Smart Schema', desc: 'Each category defines expected CSV columns.' },
                                { icon: Target, title: 'Targeted Models', desc: 'ML models tuned per industry for accuracy.' },
                                { icon: Sparkles, title: 'Tailored Insights', desc: 'Retention strategies customized to your domain.' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 group">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                                        <item.icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold">{item.title}</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════
       MAIN DASHBOARD
    ════════════════════════════════════════════════════════════ */
    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        {category && <Badge variant="outline" className="text-[10px] mr-2 border-primary/30 text-primary">{category}</Badge>}
                        {user?.name && <>Welcome back, {user.name.split(' ')[0]}</>}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs">System Active</span>
                </div>
            </div>

            {hasData ? (
                /* ── DATA DASHBOARD ── */
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Records', value: animRecords.toLocaleString(), icon: Users, gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/10' },
                            { label: 'Churn Rate', value: `${stats.avg_churn_rate || 0}%`, icon: TrendingUp, gradient: 'from-orange-500 to-amber-400', glow: 'shadow-orange-500/10' },
                            { label: 'Total Churners', value: animChurners.toLocaleString(), icon: AlertTriangle, gradient: 'from-red-500 to-pink-400', glow: 'shadow-red-500/10' },
                            { label: 'Files Processed', value: animProcessed.toString(), icon: FileSpreadsheet, gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/10' },
                        ].map((s, i) => (
                            <Card key={i}
                                className={`border-border/30 bg-card/50 backdrop-blur-md hover:bg-card/70 transition-all duration-300 overflow-hidden relative group animate-slide-up shadow-lg ${s.glow}`}
                                style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500`} />
                                <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.gradient} opacity-[0.06] blur-xl group-hover:opacity-[0.12] transition-opacity`} />
                                <CardContent className="p-5 relative">
                                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-md`}>
                                        <s.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="text-2xl font-bold tracking-tight tabular-nums">{s.value}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Risk + Recent */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* Risk Distribution */}
                        <Card className="lg:col-span-2 border-border/30 bg-card/50 backdrop-blur-md shadow-lg animate-slide-up delay-400">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <PieChart className="h-4 w-4 text-primary" /> Risk Distribution
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-[10px]">{totalRiskRecords.toLocaleString()}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-1 space-y-3">
                                {totalRiskRecords === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                                ) : riskLevels.map(({ key, label, icon: Icon, color, bg, bar }) => {
                                    const count = riskDist[key] || 0;
                                    const pct = ((count / totalRiskRecords) * 100).toFixed(1);
                                    return (
                                        <div key={key} className="group">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-6 w-6 rounded-md ${bg} flex items-center justify-center`}>
                                                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                                                    </div>
                                                    <span className="text-xs font-medium">{label}</span>
                                                </div>
                                                <span className="text-xs font-bold tabular-nums">
                                                    {count.toLocaleString()} <span className="text-muted-foreground font-normal">({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-1000 ease-out`}
                                                    style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Recent Processes */}
                        <Card className="lg:col-span-3 border-border/30 bg-card/50 backdrop-blur-md shadow-lg animate-slide-up delay-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" /> Recent Processes
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 gap-1" onClick={() => navigate('/customers')}>
                                        View All <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                                {(!stats.recent_processes || stats.recent_processes.length === 0) ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No processes yet</p>
                                ) : stats.recent_processes.map((proc, i) => (
                                    <div key={proc.process_code}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/15 hover:bg-muted/30 border border-transparent
                                            hover:border-border/30 transition-all duration-200 cursor-pointer group"
                                        onClick={() => navigate('/customers')}>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/15 to-purple-500/15 border border-primary/10 flex items-center justify-center group-hover:border-primary/20 transition-colors">
                                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium group-hover:text-primary transition-colors">{proc.file_name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <code className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-1 rounded">{proc.process_code}</code>
                                                    {proc.date && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                            <Clock className="h-2.5 w-2.5" /> {new Date(proc.date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className={`text-[10px] ${proc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                proc.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-muted/30'}`}>
                                                {proc.status}
                                            </Badge>
                                            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                /* ── EMPTY STATE: Feature Showcase ── */
                <>
                    {/* Hero Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-card border border-border/30 p-8 animate-slide-up">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/8 to-transparent rounded-tr-full blur-2xl pointer-events-none" />
                        <div className="relative">
                            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-[10px]">
                                <Sparkles className="h-3 w-3 mr-1" /> AI-Powered Churn Prediction
                            </Badge>
                            <h2 className="text-xl font-bold mb-2">Predict. Prevent. Retain.</h2>
                            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                                Customer churn costs businesses billions annually. Research shows acquiring a new customer costs
                                <strong className="text-foreground"> 5&ndash;25&times; more</strong> than retaining an existing one.
                                ChurnAI uses machine learning to analyze customer behavior, predict who is likely to leave,
                                and generate actionable retention strategies &mdash; all from a single CSV upload.
                            </p>
                        </div>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            {
                                icon: Brain, gradient: 'from-violet-500 to-purple-600',
                                title: 'ML-Powered Predictions',
                                desc: 'Random Forest, XGBoost, and Gradient Boosting models trained on your data. Feature engineering and selection happen automatically.',
                            },
                            {
                                icon: PieChart, gradient: 'from-blue-500 to-cyan-500',
                                title: 'Risk Segmentation',
                                desc: 'Every customer is scored 0\u2013100% and classified into risk tiers (Low, Medium, High, Critical) for prioritized outreach.',
                            },
                            {
                                icon: Sparkles, gradient: 'from-amber-500 to-orange-500',
                                title: 'Smart Recommendations',
                                desc: 'AI-generated retention strategies grouped by type \u2014 Pricing, Engagement, Support \u2014 each linked to the customers who need them.',
                            },
                            {
                                icon: Layers, gradient: 'from-emerald-500 to-teal-500',
                                title: 'Multi-Category Support',
                                desc: 'Register Telecom, SaaS, Healthcare, Banking, or any custom industry domain. Each category gets its own schema and model config.',
                            },
                            {
                                icon: Shield, gradient: 'from-pink-500 to-rose-500',
                                title: 'Schema Validation',
                                desc: 'Validate your CSV structure before uploading. Required columns are checked, optional columns are flagged, and errors are explained clearly.',
                            },
                            {
                                icon: LineChart, gradient: 'from-indigo-500 to-blue-500',
                                title: 'Insights Dashboard',
                                desc: 'Live statistics, risk distribution charts, churn rate trends, and process history \u2014 all in one place for quick executive-level overviews.',
                            },
                        ].map((feat, i) => (
                            <Card key={i}
                                className="border-border/30 bg-card/50 backdrop-blur-md hover:bg-card/70 group cursor-default transition-all duration-300 animate-slide-up overflow-hidden relative"
                                style={{ animationDelay: `${100 + i * 80}ms` }}>
                                <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${feat.gradient} opacity-[0.06] blur-xl group-hover:opacity-[0.12] transition-opacity duration-500`} />
                                <CardContent className="p-5 relative">
                                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                        <feat.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="text-sm font-semibold mb-1">{feat.title}</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* How It Works */}
                    <Card className="border-border/30 bg-card/50 backdrop-blur-md shadow-lg animate-slide-up delay-200">
                        <CardContent className="p-6">
                            <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                                <Cpu className="h-4.5 w-4.5 text-primary" /> How ChurnAI Works
                            </h3>
                            <p className="text-xs text-muted-foreground mb-6">The prediction pipeline, step by step:</p>

                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/40 via-purple-500/40 to-emerald-500/40" />

                                <div className="space-y-6">
                                    {[
                                        {
                                            step: '01', icon: Upload, color: 'from-primary to-blue-500',
                                            title: 'Upload Your Dataset',
                                            desc: 'Provide a CSV containing historical customer data \u2014 demographics, subscription details, usage metrics, and churn labels. ChurnAI auto-detects your column structure and maps it to prediction features.',
                                        },
                                        {
                                            step: '02', icon: CheckCircle2, color: 'from-cyan-500 to-teal-500',
                                            title: 'Schema Validation',
                                            desc: 'Your file is validated against the expected schema. Required columns (churn target, tenure) are verified. Missing or mismatched columns are flagged with descriptive error messages and suggestions.',
                                        },
                                        {
                                            step: '03', icon: Brain, color: 'from-violet-500 to-purple-600',
                                            title: 'Model Training & Feature Engineering',
                                            desc: 'The system selects the optimal ML algorithm based on your data characteristics. Feature engineering creates derived variables (interaction terms, ratios, encodings) that maximize predictive power.',
                                        },
                                        {
                                            step: '04', icon: Target, color: 'from-orange-500 to-amber-500',
                                            title: 'Churn Prediction & Scoring',
                                            desc: 'Every customer gets a churn probability (0\u2013100%) and a risk tier. Results can be filtered, sorted, and exported. High-confidence predictions are highlighted for immediate action.',
                                        },
                                        {
                                            step: '05', icon: Sparkles, color: 'from-emerald-500 to-green-500',
                                            title: 'Actionable Recommendations',
                                            desc: 'AI-generated retention playbooks are produced: specific offers, engagement tactics, and support escalations \u2014 each linked to the customers who would benefit most from that intervention.',
                                        },
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-start gap-4 relative group">
                                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0
                                                shadow-md group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                                                <s.icon className="h-4.5 w-4.5 text-white" />
                                            </div>
                                            <div className="pt-1.5">
                                                <p className="text-sm font-semibold flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded">{s.step}</span>
                                                    {s.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* ══════════════════════════════════════════════════════════
                 DATA FORMAT + SCHEMA VALIDATE (always visible)
               ══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Data Format Guide */}
                <Card className="lg:col-span-3 border-border/30 bg-card/50 backdrop-blur-md shadow-lg animate-slide-up delay-300">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-primary" /> Data Format Guide
                        </h3>
                        <p className="text-[11px] text-muted-foreground mb-4">
                            Ensure your CSV includes these column types for optimal predictions:
                        </p>

                        <Accordion type="single" collapsible className="w-full">
                            {[
                                {
                                    label: 'Churn Target', req: true, type: 'Binary',
                                    desc: 'The column indicating whether a customer churned. Values should be binary: Yes/No, 1/0, or True/False.',
                                    detail: 'This is the prediction target \u2014 the column the model learns to predict. Without it, supervised learning is impossible. Must contain only two distinct values.',
                                    example: 'Churn, Attrition, target, label',
                                },
                                {
                                    label: 'Tenure', req: true, type: 'Numeric',
                                    desc: 'How long the customer has been with the company, typically in months.',
                                    detail: 'Tenure is one of the single most predictive features for churn. Customers with shorter tenure churn at significantly higher rates across virtually all industries.',
                                    example: 'tenure, months_active, customer_since',
                                },
                                {
                                    label: 'Customer ID', req: false, type: 'Identifier',
                                    desc: 'A unique identifier for each customer row.',
                                    detail: 'Used to trace predictions back to individual customers in results and recommendations.',
                                    example: 'customerID, account_id, user_id',
                                },
                                {
                                    label: 'Charges / Cost', req: false, type: 'Numeric',
                                    desc: 'Monthly charges, total charges, subscription fees, or any cost metrics.',
                                    detail: 'Financial data helps identify price-sensitive customers. Combined with tenure, it reveals lifetime value and cost-churn correlation.',
                                    example: 'MonthlyCharges, TotalCharges, plan_cost',
                                },
                                {
                                    label: 'Contract Type', req: false, type: 'Categorical',
                                    desc: 'The subscription contract length: month-to-month, one year, two year.',
                                    detail: 'Month-to-month customers consistently churn 3\u20135\u00d7 more than long-term contract holders. A critical feature for any subscription business.',
                                    example: 'Contract, plan_type, subscription_length',
                                },
                                {
                                    label: 'Service Features', req: false, type: 'Binary',
                                    desc: 'Whether the customer uses specific services: internet, phone, streaming, security.',
                                    detail: 'Service adoption indicates engagement depth. Customers using more services have stronger lock-in effects and lower churn probability.',
                                    example: 'InternetService, PhoneService, StreamingTV',
                                },
                                {
                                    label: 'Demographics', req: false, type: 'Mixed',
                                    desc: 'Customer demographics: gender, age, partner, dependents, senior citizen status.',
                                    detail: 'Demographic segments often exhibit fundamentally different churn behaviors. Senior citizens, customers without partners, and newer demographics may need different retention strategies.',
                                    example: 'gender, SeniorCitizen, Partner, Dependents',
                                },
                            ].map((col, i) => (
                                <AccordionItem key={i} value={`col-${i}`} className="border-border/20">
                                    <AccordionTrigger className="py-3 hover:no-underline">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`h-5 w-5 rounded-md flex items-center justify-center ${col.req ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                                                {col.req ? <Zap className="h-3 w-3 text-red-400" /> : <CheckCircle2 className="h-3 w-3 text-primary" />}
                                            </div>
                                            <span className="text-xs font-semibold">{col.label}</span>
                                            {col.req && <Badge className="text-[7px] h-3.5 px-1 bg-red-500/10 text-red-400 border-red-500/20">Required</Badge>}
                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-border/30">{col.type}</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-3">
                                        <div className="pl-7 space-y-2">
                                            <p className="text-xs text-muted-foreground leading-relaxed">{col.desc}</p>
                                            <p className="text-xs text-muted-foreground/80 leading-relaxed italic">{col.detail}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                <span className="font-semibold text-foreground/70">Examples:</span> <code className="bg-muted/30 px-1 rounded">{col.example}</code>
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Schema Validator */}
                <Card className="lg:col-span-2 border-border/30 bg-card/50 backdrop-blur-md shadow-lg animate-slide-up delay-400">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="mb-5 relative">
                            {/* Animated orbital rings */}
                            <div className="h-28 w-28 relative">
                                <div className="absolute inset-0 rounded-full border border-primary/10 animate-[spin_12s_linear_infinite]">
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary/30" />
                                </div>
                                <div className="absolute inset-3 rounded-full border border-purple-500/10 animate-[spin_8s_linear_infinite_reverse]">
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-purple-400/40" />
                                </div>
                                {/* Center button */}
                                <label className="absolute inset-6 cursor-pointer">
                                    <div className={`h-full w-full rounded-full bg-gradient-to-br from-primary to-purple-500
                                        flex items-center justify-center shadow-xl shadow-primary/30
                                        hover:shadow-2xl hover:shadow-primary/40 hover:scale-110 active:scale-95
                                        transition-all duration-300 group ${validating ? 'animate-pulse' : ''}`}>
                                        {validating ? (
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        ) : (
                                            <Upload className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            handleValidateFile(e.target.files[0]);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        <p className="text-sm font-semibold mb-1">Schema Validator</p>
                        <p className="text-[11px] text-muted-foreground mb-4 max-w-[200px]">
                            Click the button above to select a CSV file and validate its column structure
                        </p>

                        {/* Validation Error */}
                        {validationError && (
                            <div className="w-full flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left">
                                <XCircle className="h-4 w-4 shrink-0" /> {validationError}
                                <Button variant="ghost" size="sm" className="ml-auto text-[10px] h-6" onClick={resetValidation}>Retry</Button>
                            </div>
                        )}

                        {/* Validation Results */}
                        {validationResult && (
                            <div className="w-full space-y-3 text-left animate-slide-up">
                                {/* Summary */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/15 border border-border/20">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium">{validationResult.file_name}</p>
                                            <p className="text-[10px] text-muted-foreground">{validationResult.row_count?.toLocaleString()} rows &middot; {validationResult.column_count} cols</p>
                                        </div>
                                    </div>
                                    {validationResult.is_valid
                                        ? <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" /> Valid</Badge>
                                        : <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 text-[10px]"><XCircle className="h-3 w-3" /> Invalid</Badge>}
                                </div>

                                {/* Errors */}
                                {validationResult.errors?.map((err, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-red-500/5 border border-red-500/10 text-xs">
                                        <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" /> {err}
                                    </div>
                                ))}

                                {/* Warnings */}
                                {validationResult.warnings?.map((w, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/10 text-xs">
                                        <AlertCircle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" /> {w}
                                    </div>
                                ))}

                                {/* Columns */}
                                {validationResult.columns?.length > 0 && (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {validationResult.columns.map((col, i) => (
                                            <div key={i} className={`flex items-center gap-1.5 p-1.5 rounded-md border text-[10px] ${col.status === 'matched' ? 'bg-emerald-500/5 border-emerald-500/15' :
                                                col.status === 'missing' && col.required ? 'bg-red-500/5 border-red-500/15' :
                                                    col.status === 'missing' ? 'bg-amber-500/5 border-amber-500/10' :
                                                        'bg-muted/10 border-border/20'
                                                }`}>
                                                {col.status === 'matched' ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" /> :
                                                    col.status === 'missing' && col.required ? <XCircle className="h-2.5 w-2.5 text-red-400 shrink-0" /> :
                                                        col.status === 'missing' ? <AlertCircle className="h-2.5 w-2.5 text-amber-400 shrink-0" /> :
                                                            <Info className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                                                <span className="font-medium truncate">{col.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Button variant="ghost" size="sm" className="text-xs h-7 flex-1" onClick={resetValidation}>
                                        Check Another
                                    </Button>
                                    {validationResult.is_valid && (
                                        <Button size="sm" className="text-xs h-7 flex-1 gap-1.5 bg-gradient-to-r from-primary to-purple-500" onClick={() => navigate('/upload')}>
                                            Upload <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Churn Insights Stats ── */}
            <Card className="border-border/30 bg-card/50 backdrop-blur-md shadow-lg animate-slide-up delay-500 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <CardContent className="p-6">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" /> Why Churn Prediction Matters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                stat: '5\u201325\u00d7', label: 'Cost to Acquire vs Retain',
                                desc: 'Acquiring a new customer is dramatically more expensive than keeping an existing one happy and engaged.',
                                color: 'from-primary to-blue-500',
                            },
                            {
                                stat: '25\u201395%', label: 'Profit from 5% Retention Lift',
                                desc: 'A 5% increase in retention can boost profits by 25\u201395%, according to Harvard Business Review research.',
                                color: 'from-purple-500 to-violet-500',
                            },
                            {
                                stat: '68%', label: 'Leave Due to Neglect',
                                desc: 'The majority of customer churn is caused by perceived indifference \u2014 not competitor offerings or pricing.',
                                color: 'from-amber-500 to-orange-500',
                            },
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-xl bg-muted/10 border border-border/20 hover:border-border/40 transition-colors group">
                                <p className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>{item.stat}</p>
                                <p className="text-xs font-semibold mt-1.5">{item.label}</p>
                                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
