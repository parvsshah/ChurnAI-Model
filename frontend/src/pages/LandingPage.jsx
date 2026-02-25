import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import {
    Sparkles, Brain, BarChart3, Shield, Users, ArrowRight,
    ChevronRight, ChevronDown, TrendingUp, Target, FileSpreadsheet, Upload,
    Zap, Github, Twitter, Linkedin, Cpu, Layers, Lock,
    LineChart, AlertTriangle, Lightbulb, Database, Bot,
} from 'lucide-react';
import ParticlesBackground from '@/components/landing/ParticlesBackground';
import ConicButton from '@/components/landing/ConicButton';
import FeatureCarousel from '@/components/landing/FeatureCarousel';
import SvgUnderlineLink from '@/components/landing/SvgUnderlineLink';
import { WaveText } from '@/components/ui/wave-text';
import { Marquee } from '@/components/ui/marquee';
import {
    PythonLogo, FastAPILogo, PostgreSQLLogo, ScikitLearnLogo,
    ReactLogo, ViteLogo, TailwindLogo, GeminiLogo, OpenAILogo,
} from '@/components/landing/TechLogos';

/* ─────────────────────────────────────────────────────
   DATA — enriched from actual project capabilities
   ───────────────────────────────────────────────────── */

const features = [
    {
        icon: Brain,
        title: 'Smart Auto-Detection Pipeline',
        description:
            'Our SmartPipeline automatically determines whether to train a new model, use an existing one, or retrain — based on dataset structure, domain heuristics, and column-hash fingerprinting.',
        iconColor: 'text-violet-400',
        iconBg: 'rgba(124,91,240,0.12)',
    },
    {
        icon: FileSpreadsheet,
        title: 'Adaptive Schema Mapping',
        description:
            'The ColumnMapper engine auto-maps your CSV columns to semantic types — identifying customer IDs, churn targets, numeric features, and categorical dimensions without manual configuration.',
        iconColor: 'text-indigo-400',
        iconBg: 'rgba(99,102,241,0.12)',
    },
    {
        icon: Target,
        title: 'Four-Tier Risk Segmentation',
        description:
            'Every customer is classified into Critical, High, Medium, or Low risk tiers using signal detection algorithms that analyze behavioral patterns, engagement drops, and financial indicators.',
        iconColor: 'text-rose-400',
        iconBg: 'rgba(244,63,94,0.12)',
    },
    {
        icon: BarChart3,
        title: 'Live Analytics Dashboard',
        description:
            'Real-time dashboards display churn trends, risk distribution heatmaps, revenue impact projections, cohort breakdowns, and processing history at a glance.',
        iconColor: 'text-emerald-400',
        iconBg: 'rgba(52,211,153,0.12)',
    },
    {
        icon: Bot,
        title: 'LLM-Powered AI Insights',
        description:
            'Integrated Gemini and OpenAI engines generate personalized retention narratives, executive summary reports, domain-aware risk assessments, and customer-level action plans.',
        iconColor: 'text-amber-400',
        iconBg: 'rgba(251,191,36,0.12)',
    },
    {
        icon: Shield,
        title: 'AI Retention Recommender',
        description:
            'The RecommendationEngine combines signal detection with action generation — producing per-customer retention strategies ranked by priority, severity, and predicted impact.',
        iconColor: 'text-cyan-400',
        iconBg: 'rgba(34,211,238,0.12)',
    },
];

const steps = [
    {
        step: '01',
        icon: Upload,
        title: 'Upload & Auto-Detect',
        description:
            'Drop a CSV file into the platform. The system auto-detects column types, validates your schema against known patterns, and determines the optimal model strategy — train, predict, or retrain.',
        detail: 'Supports Telecom, SaaS, Banking, HR, and custom categories',
    },
    {
        step: '02',
        icon: Cpu,
        title: 'Train & Predict',
        description:
            'Random Forest, Gradient Boosting, and Logistic Regression models train in seconds. The AdaptivePreprocessor handles missing values, encodes categories, and scales features automatically.',
        detail: 'Model registry tracks versions with column-hash fingerprinting',
    },
    {
        step: '03',
        icon: Lightbulb,
        title: 'Get AI-Powered Insights',
        description:
            'View risk segmentation (Critical/High/Medium/Low), browse per-customer signal analysis, and receive LLM-generated retention strategies complete with executive summary reports.',
        detail: 'Powered by Gemini + OpenAI with task-based key management',
    },
];

const stats = [
    { value: '99.2%', label: 'Model Accuracy', icon: TrendingUp },
    { value: '50K+', label: 'Predictions Made', icon: Database },
    { value: '6+', label: 'Industry Domains', icon: Layers },
    { value: '10+', label: 'Data Sources Supported', icon: Zap },
];

const techLogos = [
    PythonLogo, FastAPILogo, PostgreSQLLogo, ScikitLearnLogo,
    ReactLogo, ViteLogo, TailwindLogo, GeminiLogo, OpenAILogo,
];

/* ─── Starfield ─── */
function Starfield() {
    const stars = useMemo(() => {
        return Array.from({ length: 120 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.6 + 0.1,
            delay: Math.random() * 5,
            duration: Math.random() * 3 + 2,
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            {stars.map((s) => (
                <div
                    key={s.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                        width: `${s.size}px`,
                        height: `${s.size}px`,
                        background: s.size > 1.5 ? 'rgba(167,139,250,0.8)' : 'rgba(255,255,255,0.7)',
                        opacity: s.opacity,
                        animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
                        boxShadow: s.size > 1.5 ? '0 0 4px rgba(167,139,250,0.4)' : 'none',
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Cosmic Horizon ─── */
function CosmicHorizon() {
    return (
        <div className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none overflow-hidden" aria-hidden>
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2"
                style={{
                    width: '140%', height: '600px', borderRadius: '50% 50% 0 0',
                    background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(124,91,240,0.25) 0%, rgba(79,70,229,0.15) 30%, rgba(49,46,129,0.08) 60%, transparent 100%)',
                    animation: 'horizon-pulse 6s ease-in-out infinite',
                }}
            />
            <div
                className="absolute bottom-[80px] left-1/2 -translate-x-1/2"
                style={{
                    width: '80%', height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(129,140,248,0.5), rgba(167,139,250,0.4), transparent)',
                    boxShadow: '0 0 60px 20px rgba(124,91,240,0.15), 0 0 120px 40px rgba(99,102,241,0.08)',
                }}
            />
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: '200px' }}>
                <defs>
                    <radialGradient id="horizonGrad" cx="50%" cy="0%" r="70%">
                        <stop offset="0%" stopColor="rgba(124,91,240,0.12)" />
                        <stop offset="100%" stopColor="rgba(6,5,14,0)" />
                    </radialGradient>
                </defs>
                <ellipse cx="720" cy="260" rx="900" ry="200" fill="url(#horizonGrad)" />
                <ellipse cx="720" cy="200" rx="800" ry="140" fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="1" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#06050e] to-transparent" />
        </div>
    );
}

/* ─── Diagonal Scroll-Fade Hook (FIXED) ─── */
function useDiagonalFade(ref) {
    const [fadeStyle, setFadeStyle] = useState({});

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleScroll = () => {
            const rect = el.getBoundingClientRect();

            // progress: 0 when hero top is at viewport top, 1 when hero is well above viewport
            const scrolled = Math.max(0, -rect.top);
            const totalTravel = rect.height * 0.7;
            const progress = Math.min(1, scrolled / totalTravel);

            if (progress > 0.02) {
                // Smooth upward fade — no diagonal or clipPath
                setFadeStyle({
                    opacity: 1 - progress * 0.95,
                    transform: `translateY(${-progress * 50}px) scale(${1 - progress * 0.04})`,
                    filter: `blur(${progress * 2}px)`,
                    transition: 'none',
                });
            } else {
                setFadeStyle({
                    opacity: 1,
                    transform: 'translateY(0) scale(1)',
                    filter: 'blur(0)',
                    transition: 'all 0.3s ease',
                });
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [ref]);

    return fadeStyle;
}

/* ─── AnimatedCounter ─── */
function AnimatedCounter({ value, duration = 2000 }) {
    const [display, setDisplay] = useState('—');
    const ref = useRef(null);
    const counted = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !counted.current) {
                    counted.current = true;
                    const numericMatch = value.match(/[\d.]+/);
                    if (!numericMatch) { setDisplay(value); return; }
                    const target = parseFloat(numericMatch[0]);
                    const prefix = value.slice(0, value.indexOf(numericMatch[0]));
                    const suffix = value.slice(value.indexOf(numericMatch[0]) + numericMatch[0].length);
                    const isFloat = numericMatch[0].includes('.');
                    const start = performance.now();

                    const step = (now) => {
                        const elapsed = now - start;
                        const p = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - p, 3);
                        const current = target * eased;
                        setDisplay(`${prefix}${isFloat ? current.toFixed(1) : Math.floor(current)}${suffix}`);
                        if (p < 1) requestAnimationFrame(step);
                    };
                    requestAnimationFrame(step);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value, duration]);

    return <span ref={ref}>{display}</span>;
}

/* ─── ScrollReveal ─── */
function ScrollReveal({ children, className = '', delay = 0 }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const fadeStyle = useDiagonalFade(heroRef);

    return (
        <div className="min-h-screen bg-[#06050e] text-[#e8e5f0] overflow-x-hidden relative">
            <ParticlesBackground />

            {/* ── Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06050e]/60 backdrop-blur-2xl border-b border-[#1f1a38]/50">
                <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#7c5bf0] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-[#7c5bf0]/25 animate-float">
                            <Sparkles className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div className="select-none">
                            <h1 className="text-base font-bold gradient-text leading-tight">ChurnAI</h1>
                            <p className="text-[10px] text-[#7a7299] leading-tight">Prediction System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <SvgUnderlineLink className="hidden sm:inline-block" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                            Features
                        </SvgUnderlineLink>
                        <SvgUnderlineLink className="hidden sm:inline-block" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                            How It Works
                        </SvgUnderlineLink>
                        <SvgUnderlineLink className="hidden md:inline-block" onClick={() => document.getElementById('tech')?.scrollIntoView({ behavior: 'smooth' })}>
                            Tech Stack
                        </SvgUnderlineLink>
                        <ConicButton size="sm" onClick={() => navigate('/login')}>
                            Launch App <ArrowRight className="h-3.5 w-3.5" />
                        </ConicButton>
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════
           HERO — Cosmic Horizon + Diagonal Scroll-Fade
         ══════════════════════════════════════════════ */}
            <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center overflow-hidden">
                {/* Cosmic gradient sky */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `
              radial-gradient(ellipse 70% 50% at 50% 30%, rgba(79,70,229,0.15), transparent),
              radial-gradient(ellipse 50% 40% at 30% 60%, rgba(124,91,240,0.08), transparent),
              radial-gradient(ellipse 60% 45% at 70% 50%, rgba(99,60,180,0.08), transparent),
              linear-gradient(180deg, #06050e 0%, #0c0a1f 40%, #130f2d 65%, #0a0818 100%)
            `,
                    }}
                    aria-hidden
                />
                <Starfield />
                <CosmicHorizon />

                {/* Hero content — this whole block will diagonal-fade */}
                <div className="relative z-20 max-w-screen-xl mx-auto w-full px-6 pt-20" style={fadeStyle}>
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#7c5bf0]/20 bg-[#7c5bf0]/[0.06] text-sm text-[#a78bfa]">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI-Powered Churn Prediction
                            <ChevronRight className="h-3.5 w-3.5 ml-1 text-[#7a7299]" />
                        </div>

                        {/* Main headline with wave animation */}
                        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08]">
                            <WaveText
                                text="Predict customer "
                                className="bg-clip-text text-transparent text-5xl md:text-7xl font-extrabold tracking-tight"
                                style={{ backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(232,229,240,0.5) 100%)' }}
                            />
                            <WaveText
                                text="churn"
                                className="font-[Playfair_Display] italic font-semibold bg-clip-text text-transparent text-5xl md:text-7xl"
                                style={{ backgroundImage: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 50%, #a78bfa 100%)' }}
                            />
                            <br />
                            <WaveText
                                text="before it happens"
                                className="bg-clip-text text-transparent text-5xl md:text-7xl font-extrabold tracking-tight"
                                style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(232,229,240,0.3) 100%)' }}
                            />
                        </h2>

                        {/* Extended subtitle */}
                        <p className="text-lg md:text-xl text-[#7a7299] max-w-2xl mx-auto leading-relaxed">
                            Predict customer churn before it happens with{' '}
                            <span className="text-[#a78bfa]">machine learning precision</span>. Upload your data, train
                            Random Forest, Gradient Boosting, or Logistic Regression models in seconds, and receive
                            AI-generated retention strategies tailored to each customer's risk profile.
                        </p>

                        {/* SVG wave underline decoration */}
                        <div className="flex justify-center -mt-2">
                            <svg width="280" height="16" viewBox="0 0 280 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M2 10 C30 4, 60 14, 90 8 S150 2, 180 9 S240 14, 278 6"
                                    stroke="url(#heroUnderlineGrad)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    fill="none"
                                    style={{
                                        strokeDasharray: 320,
                                        strokeDashoffset: 320,
                                        animation: 'svgUnderlineDraw 1.4s cubic-bezier(0.22,1,0.36,1) 1.2s forwards',
                                    }}
                                />
                                <defs>
                                    <linearGradient id="heroUnderlineGrad" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#7c5bf0" stopOpacity="0.3" />
                                        <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.7" />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>


                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-[#7a7299]">
                    <span className="text-[11px] uppercase tracking-[0.2em]" style={{ animation: 'fadeIn 1s ease 1.5s both' }}>Scroll</span>
                    <ChevronDown className="h-4 w-4 animate-bounce" />
                </div>
            </section>

            {/* ── Stats Bar ── */}
            <ScrollReveal>
                <section className="relative z-10 pb-24 px-6 -mt-4">
                    <div className="max-w-screen-lg mx-auto">
                        <div className="rounded-2xl border border-[#7c5bf0]/10 bg-[#0e0c1a]/70 backdrop-blur-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-[#1f1a38]">
                            {stats.map((s, i) => (
                                <div key={i} className="text-center">
                                    <s.icon className="h-5 w-5 text-[#7c5bf0] mx-auto mb-2" />
                                    <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                                        <AnimatedCounter value={s.value} />
                                    </p>
                                    <p className="text-sm text-[#7a7299] mt-1.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            <section id="features" className="relative z-10 py-24 px-6">
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-[#7c5bf0]/[0.04] blur-[150px]" />
                </div>

                <ScrollReveal className="relative z-10">
                    <div className="max-w-screen-xl mx-auto">
                        <div className="max-w-2xl mb-12">
                            <p className="text-sm font-medium text-[#a78bfa] mb-3 uppercase tracking-wider">Capabilities</p>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
                                Everything you need to{' '}
                                <span className="font-[Playfair_Display] italic bg-clip-text text-transparent bg-gradient-to-r from-[#c4b5fd] to-[#818cf8]">
                                    fight churn
                                </span>
                            </h2>
                            <p className="text-[#7a7299] text-lg leading-relaxed">
                                From adaptive schema detection to LLM-powered executive reports,
                                ChurnAI covers the entire customer retention pipeline.
                            </p>
                        </div>

                        <FeatureCarousel features={features} />
                    </div>
                </ScrollReveal>
            </section>

            {/* ══════════════════════════════════════════════
           HOW IT WORKS — Enriched 3-Step Flow
         ══════════════════════════════════════════════ */}
            <section id="how-it-works" className="relative z-10 py-28 px-6">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute top-1/2 left-1/3 w-[500px] h-[400px] rounded-full bg-[#4f46e5]/[0.04] blur-[130px]" />
                </div>

                <div className="max-w-screen-xl mx-auto relative z-10">
                    <ScrollReveal>
                        <div className="text-center max-w-2xl mx-auto mb-20">
                            <p className="text-sm font-medium text-[#a78bfa] mb-3 uppercase tracking-wider">Workflow</p>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
                                Three steps to{' '}
                                <span className="font-[Playfair_Display] italic bg-clip-text text-transparent bg-gradient-to-r from-[#c4b5fd] to-[#818cf8]">
                                    actionable insights
                                </span>
                            </h2>
                            <p className="text-[#7a7299] text-lg leading-relaxed">
                                Go from raw customer data to AI-powered retention strategies in minutes.
                                The SmartPipeline handles everything automatically — domain detection,
                                model selection, prediction, and recommendation generation.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {steps.map((s, i) => (
                            <ScrollReveal key={i} delay={i * 150}>
                                <div className="relative group">
                                    {/* Connector line */}
                                    {i < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-16 left-[60%] w-[80%] border-t border-dashed border-[#1f1a38]" />
                                    )}

                                    {/* Icon box */}
                                    <div className="relative mb-7">
                                        <div className="h-32 w-32 mx-auto rounded-2xl border border-[#1f1a38] bg-[#0e0c1a]/60 flex items-center justify-center group-hover:border-[#7c5bf0]/30 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-[#7c5bf0]/10">
                                            <s.icon className="h-14 w-14 text-[#a78bfa]" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-[#7c5bf0] to-[#4f46e5] text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-[#7c5bf0]/30">
                                            {s.step}
                                        </span>
                                    </div>

                                    {/* Text */}
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold mb-3 text-white">{s.title}</h3>
                                        <p className="text-sm text-[#9890b8] leading-relaxed mb-3">{s.description}</p>
                                        <p className="text-xs text-[#7c5bf0]/70 font-medium">{s.detail}</p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
           TECH STACK — Marquee with Logos
         ══════════════════════════════════════════════ */}
            <section id="tech" className="relative z-10 py-24 px-6 overflow-hidden">
                <ScrollReveal>
                    <div className="max-w-screen-lg mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <p className="text-sm font-medium text-[#a78bfa] mb-3 uppercase tracking-wider">Under the Hood</p>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
                                Built with{' '}
                                <span className="font-[Playfair_Display] italic bg-clip-text text-transparent bg-gradient-to-r from-[#c4b5fd] to-[#818cf8]">
                                    modern tools
                                </span>
                            </h2>
                            <p className="text-[#7a7299] text-lg leading-relaxed">
                                A production-ready stack combining Python, FastAPI, PostgreSQL,
                                scikit-learn, React, and multi-model LLM integration for end-to-end
                                churn intelligence.
                            </p>
                        </div>
                    </div>

                    {/* Marquee row 1 — left */}
                    <Marquee pauseOnHover speed={35}>
                        {techLogos.map((Logo, i) => (
                            <div key={i} className="mx-6 flex items-center justify-center px-2 py-1">
                                <Logo />
                            </div>
                        ))}
                    </Marquee>

                    {/* Marquee row 2 — right */}
                    <Marquee pauseOnHover direction="right" speed={40} className="mt-2">
                        {[...techLogos].reverse().map((Logo, i) => (
                            <div key={i} className="mx-6 flex items-center justify-center px-2 py-1">
                                <Logo />
                            </div>
                        ))}
                    </Marquee>

                    {/* Fade edges */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#06050e] to-transparent z-10" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#06050e] to-transparent z-10" />
                </ScrollReveal>
            </section>

            {/* ══════════════════════════════════════════════
           WHY CHURNAI — New Trust Section
         ══════════════════════════════════════════════ */}
            <section className="relative z-10 py-24 px-6">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#7c5bf0]/[0.03] blur-[120px]" />
                </div>
                <ScrollReveal className="relative z-10">
                    <div className="max-w-screen-lg mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div>
                                <p className="text-sm font-medium text-[#a78bfa] mb-3 uppercase tracking-wider">Why ChurnAI</p>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                                    Not just predictions —{' '}
                                    <span className="font-[Playfair_Display] italic bg-clip-text text-transparent bg-gradient-to-r from-[#c4b5fd] to-[#818cf8]">
                                        actionable intelligence
                                    </span>
                                </h2>
                                <p className="text-[#9890b8] leading-relaxed mb-6">
                                    Most churn tools stop at a probability score. ChurnAI goes further — our
                                    signal detection engine identifies <em>why</em> customers are at risk (contract
                                    expiry, engagement drop, billing issues), and the LLM-powered recommender
                                    generates personalized retention strategies ranked by impact and urgency.
                                </p>
                                <p className="text-[#9890b8] leading-relaxed">
                                    With multi-category support, every business vertical — Telecom, SaaS, Banking,
                                    Healthcare — gets its own trained model, custom schema mappings, and domain-aware
                                    AI narratives. Register a new category, upload your data, and the SmartPipeline
                                    handles the rest.
                                </p>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { icon: AlertTriangle, title: 'Signal Detection', desc: 'Identifies engagement drops, billing anomalies, contract risks, and behavioral patterns' },
                                    { icon: Bot, title: 'LLM Narratives', desc: 'Gemini & OpenAI generate per-customer risk assessments and executive summary reports' },
                                    { icon: Lock, title: 'JWT Auth + RBAC', desc: 'Secure authentication with per-user category isolation and PostgreSQL persistence' },
                                    { icon: LineChart, title: 'Revenue Impact', desc: 'Quantifies churn cost with projected revenue at risk across risk tiers' },
                                ].map((item, i) => (
                                    <ScrollReveal key={i} delay={i * 100}>
                                        <div className="flex items-start gap-4 p-4 rounded-xl border border-[#1f1a38]/40 bg-[#0e0c1a]/30 hover:border-[#7c5bf0]/15 transition-all duration-300">
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-[#7c5bf0]/10 flex items-center justify-center text-[#a78bfa]">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                                                <p className="text-xs text-[#7a7299] leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    </ScrollReveal>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            {/* ── CTA ── */}
            <section className="relative z-10 py-24 px-6">
                <ScrollReveal>
                    <div className="max-w-screen-md mx-auto text-center">
                        <div className="rounded-2xl border border-[#7c5bf0]/10 bg-[#0e0c1a]/70 backdrop-blur-xl p-12 md:p-16 relative overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-[#7c5bf0]/[0.1] blur-[100px]" />
                            </div>
                            <div className="relative z-10">
                                <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-[#7c5bf0] to-[#4f46e5] flex items-center justify-center shadow-xl shadow-[#7c5bf0]/30 mb-6">
                                    <Zap className="h-7 w-7 text-white" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
                                    Ready to reduce churn?
                                </h2>
                                <p className="text-[#7a7299] mb-4 max-w-lg mx-auto text-lg leading-relaxed">
                                    Start predicting customer churn in minutes. Upload your CSV, choose your model,
                                    and let AI do the heavy lifting — from risk segmentation to retention strategies.
                                </p>
                                <p className="text-[#7a7299] mb-8 max-w-md mx-auto text-sm">
                                    No credit card required. Supports Telecom, SaaS, Banking, HR, and custom verticals.
                                </p>
                                <ConicButton onClick={() => navigate('/login')}>
                                    Launch Dashboard <ChevronRight className="h-4 w-4" />
                                </ConicButton>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-[#1f1a38]/60 py-12 px-6">
                <div className="max-w-screen-xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7c5bf0] to-[#4f46e5] flex items-center justify-center">
                                <Sparkles className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm font-semibold gradient-text">ChurnAI</span>
                            <span className="text-xs text-[#7a7299]">© 2025</span>
                        </div>
                        <div className="flex items-center gap-6 text-[#7a7299]">
                            <a href="#" className="text-xs hover:text-white transition-colors">Documentation</a>
                            <a href="#" className="text-xs hover:text-white transition-colors">API Reference</a>
                            <a href="#" className="text-xs hover:text-white transition-colors">Privacy</a>
                            <div className="flex items-center gap-3 ml-4">
                                <a href="#" className="hover:text-[#a78bfa] transition-colors"><Github className="h-4 w-4" /></a>
                                <a href="#" className="hover:text-[#a78bfa] transition-colors"><Twitter className="h-4 w-4" /></a>
                                <a href="#" className="hover:text-[#a78bfa] transition-colors"><Linkedin className="h-4 w-4" /></a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-[#1f1a38]/40 text-center">
                        <p className="text-xs text-[#7a7299]/60">
                            Built with FastAPI · PostgreSQL · scikit-learn · React · Vite · Gemini · OpenAI
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
