import { useNavigate } from 'react-router-dom';
import { HeroSection } from '@/components/ui/hero-section';
import {
    Sparkles, Upload, Brain, BarChart3, Shield, Zap, Users,
    ArrowRight, ChevronRight, TrendingUp, Target, FileSpreadsheet,
    Github, Twitter, Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
    {
        icon: Brain,
        title: 'ML-Powered Predictions',
        description: 'Random Forest, Gradient Boosting, and Logistic Regression models trained on your data for maximum accuracy.',
        color: 'from-purple-500/20 to-purple-500/5',
        iconColor: 'text-purple-400',
    },
    {
        icon: FileSpreadsheet,
        title: 'Auto Schema Detection',
        description: 'Upload a CSV and our engine auto-detects column types, maps features, and prepares your data for training.',
        color: 'from-blue-500/20 to-blue-500/5',
        iconColor: 'text-blue-400',
    },
    {
        icon: Target,
        title: 'Risk Segmentation',
        description: 'Customers are classified into Critical, High, Medium, and Low risk tiers with actionable churn probabilities.',
        color: 'from-red-500/20 to-red-500/5',
        iconColor: 'text-red-400',
    },
    {
        icon: BarChart3,
        title: 'Real-Time Analytics',
        description: 'Live dashboards with churn trends, risk distribution, revenue impact, and cohort analysis at a glance.',
        color: 'from-emerald-500/20 to-emerald-500/5',
        iconColor: 'text-emerald-400',
    },
    {
        icon: Users,
        title: 'Multi-Category Support',
        description: 'Register Telecom, SaaS, Healthcare, or any custom category — each with its own model and schema config.',
        color: 'from-orange-500/20 to-orange-500/5',
        iconColor: 'text-orange-400',
    },
    {
        icon: Shield,
        title: 'Retention Strategies',
        description: 'AI-generated retention recommendations tailored to each customer\'s risk profile and behavioral signals.',
        color: 'from-cyan-500/20 to-cyan-500/5',
        iconColor: 'text-cyan-400',
    },
];

const steps = [
    {
        step: '01',
        icon: Upload,
        title: 'Upload Your Data',
        description: 'Drop a CSV file — schema is auto-detected and columns are mapped to the prediction engine.',
    },
    {
        step: '02',
        icon: Brain,
        title: 'Train & Predict',
        description: 'Choose your ML model, train on historical data, and get churn probabilities for every customer.',
    },
    {
        step: '03',
        icon: TrendingUp,
        title: 'Act on Insights',
        description: 'View risk tiers, revenue impact, and AI-generated retention strategies to keep customers engaged.',
    },
];

const stats = [
    { value: '99.2%', label: 'Model Accuracy' },
    { value: '50K+', label: 'Predictions Made' },
    { value: '3', label: 'ML Algorithms' },
    { value: '<2s', label: 'Prediction Time' },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* ── Floating Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-purple-500 
                                flex items-center justify-center shadow-lg shadow-primary/25 animate-float">
                            <Sparkles className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div className="select-none">
                            <h1 className="text-base font-bold gradient-text leading-tight">ChurnAI</h1>
                            <p className="text-[10px] text-muted-foreground leading-tight">Prediction System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm hidden sm:inline-flex"
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                            Features
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm hidden sm:inline-flex"
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                            How It Works
                        </Button>
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 
                                   shadow-lg shadow-primary/25 text-sm gap-1.5"
                            size="sm"
                        >
                            Launch App <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <HeroSection
                title="AI-Powered Churn Prediction"
                subtitle={{
                    regular: "Predict customer churn before it happens with ",
                    gradient: "machine learning precision.",
                }}
                description="Upload your customer data, train ML models in seconds, and get actionable risk scores with AI-driven retention strategies — all in one beautifully crafted platform."
                ctaText="Start Predicting"
                ctaHref="/dashboard"
                bottomImage="/dashboard-preview.png"
                gridOptions={{
                    angle: 65,
                    opacity: 0.4,
                    cellSize: 50,
                    darkLineColor: "#2a2a3a",
                }}
            />

            {/* ── Stats Bar ── */}
            <section className="relative z-10 -mt-10 pb-20">
                <div className="max-w-screen-lg mx-auto px-6">
                    <div className="glass-card p-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-border/30">
                        {stats.map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                    {s.value}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="relative z-10 py-24 px-6">
                <div className="max-w-screen-xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Capabilities</p>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Everything you need to <span className="gradient-text">fight churn</span>
                        </h2>
                        <p className="text-muted-foreground">
                            From data ingestion to actionable insights, ChurnAI covers the entire retention pipeline.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className={`group relative rounded-xl border border-border/40 bg-gradient-to-b ${f.color}
                                       p-6 hover:border-border/60 transition-all duration-300 hover:-translate-y-1
                                       hover:shadow-xl hover:shadow-black/20`}
                            >
                                <div className={`h-11 w-11 rounded-lg bg-card flex items-center justify-center mb-4
                                            border border-border/40 ${f.iconColor}`}>
                                    <f.icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" className="relative z-10 py-24 px-6">
                {/* Subtle glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
                    <div className="w-[600px] h-[400px] rounded-full bg-primary/8 blur-[120px]" />
                </div>
                <div className="max-w-screen-xl mx-auto relative">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Workflow</p>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Three steps to <span className="gradient-text">actionable insights</span>
                        </h2>
                        <p className="text-muted-foreground">
                            Go from raw customer data to retention strategies in minutes, not months.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((s, i) => (
                            <div key={i} className="relative text-center group">
                                {/* Connector line */}
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t border-dashed border-border/50" />
                                )}
                                <div className="relative mx-auto mb-6">
                                    <div className="h-24 w-24 mx-auto rounded-2xl bg-card border border-border/40
                                                flex items-center justify-center group-hover:border-primary/30
                                                transition-all duration-300 group-hover:-translate-y-1
                                                group-hover:shadow-lg group-hover:shadow-primary/10">
                                        <s.icon className="h-10 w-10 text-primary" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground
                                               text-xs font-bold flex items-center justify-center shadow-lg shadow-primary/30">
                                        {s.step}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{s.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="relative z-10 py-24 px-6">
                <div className="max-w-screen-md mx-auto text-center">
                    <div className="glass-card p-12 md:p-16 rounded-2xl relative overflow-hidden">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-primary to-purple-500
                                        flex items-center justify-center shadow-xl shadow-primary/30 mb-6">
                                <Zap className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                                Ready to reduce churn?
                            </h2>
                            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                                Join thousands of businesses using AI-powered predictions to retain customers and grow revenue.
                            </p>
                            <Button
                                size="lg"
                                onClick={() => navigate('/login')}
                                className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 
                                       shadow-lg shadow-primary/25 text-base gap-2 px-8 h-12"
                            >
                                Launch Dashboard <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-border/30 py-10 px-6">
                <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 
                                flex items-center justify-center">
                            <Sparkles className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold gradient-text">ChurnAI</span>
                        <span className="text-xs text-muted-foreground">© 2025</span>
                    </div>
                    <div className="flex items-center gap-6 text-muted-foreground">
                        <a href="#" className="text-xs hover:text-foreground transition-colors">Documentation</a>
                        <a href="#" className="text-xs hover:text-foreground transition-colors">API Reference</a>
                        <a href="#" className="text-xs hover:text-foreground transition-colors">Privacy</a>
                        <div className="flex items-center gap-3 ml-4">
                            <a href="#" className="hover:text-foreground transition-colors"><Github className="h-4 w-4" /></a>
                            <a href="#" className="hover:text-foreground transition-colors"><Twitter className="h-4 w-4" /></a>
                            <a href="#" className="hover:text-foreground transition-colors"><Linkedin className="h-4 w-4" /></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
