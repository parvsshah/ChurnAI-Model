import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Plus, ChevronDown, Info } from 'lucide-react';
import { CanvasRevealEffect } from '@/components/ui/canvas-reveal-effect';
import { CosmicInput } from '@/components/ui/cosmic-input';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import * as api from '@/services/api';

/* ─── SVG icons for social providers ─── */
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const GitHubIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
);

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { setCategory: setCategoryContext } = useCategory();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const allCategories = ['Telecom', 'SaaS', 'Banking', 'Healthcare', 'Employee'];
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showCategoryInfo, setShowCategoryInfo] = useState(false);

    const categoryInfo = [
        {
            name: 'Telecom',
            description: 'Predict customer churn in telecom companies. Analyzes usage patterns, service plans, and customer behavior to identify at-risk subscribers.',
            target: 'Churn (Yes/No)',
            format: 'CSV with customer demographics, usage, contract details',
            useCase: 'Retain mobile, broadband & cable subscribers',
            model: 'Random Forest',
        },
        {
            name: 'SaaS',
            description: 'Identify subscription cancellation risk in SaaS products. Tracks engagement metrics, feature adoption, and billing patterns.',
            target: 'Churned (0/1)',
            format: 'CSV with subscription, usage, MRR, engagement data',
            useCase: 'Reduce SaaS subscription cancellations',
            model: 'Gradient Boosting',
        },
        {
            name: 'Banking',
            description: 'Detect customers likely to close accounts or stop using banking services. Evaluates transaction history, account balances, and product holdings.',
            target: 'Exited (0/1)',
            format: 'CSV with account info, transactions, credit score',
            useCase: 'Prevent bank account closures & attrition',
            model: 'Random Forest',
        },
        {
            name: 'Healthcare',
            description: 'Predict patient disengagement from healthcare plans or providers. Analyzes visit frequency, treatment adherence, and satisfaction scores.',
            target: 'Churn (Yes/No)',
            format: 'CSV with patient demographics, visits, claims',
            useCase: 'Improve patient retention & plan renewals',
            model: 'Logistic Regression',
        },
        {
            name: 'Employee',
            description: 'Predict employee attrition and voluntary turnover. Evaluates job satisfaction, compensation, tenure, and performance metrics.',
            target: 'Attrition (Yes/No)',
            format: 'CSV with employee info, salary, satisfaction, tenure',
            useCase: 'Reduce employee turnover & improve retention',
            model: 'Gradient Boosting',
        },
    ];

    const effectiveCategory = category === '__new__' ? customCategory.trim() : category;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(username, email, password, name, effectiveCategory || null);
            if (effectiveCategory) setCategoryContext(effectiveCategory);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        console.log(`${provider} sign-up clicked`);
        setError(`${provider} sign-up is coming soon. Please use email/password for now.`);
    };

    return (
        <div className="flex w-full flex-col min-h-screen bg-[#06050e] relative overflow-hidden">
            {/* Canvas Background */}
            <div className="absolute inset-0 z-0">
                <CanvasRevealEffect
                    animationSpeed={2.5}
                    containerClassName="bg-[#06050e]"
                    colors={[
                        [99, 102, 241],
                        [124, 91, 240],
                    ]}
                    dotSize={4}
                    reverse={false}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,5,14,0.85)_0%,_rgba(6,5,14,0.4)_100%)]" />
                <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-[#06050e] to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-[#06050e] to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-full max-w-md space-y-6"
                >
                    {/* Logo + Heading */}
                    <div className="text-center space-y-4">
                        <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-to-br from-[#7c5bf0] to-[#4f46e5] flex items-center justify-center shadow-xl shadow-[#7c5bf0]/30">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[2.25rem] font-bold leading-[1.1] tracking-tight text-white">
                                Create{' '}
                                <span className="font-[Playfair_Display] italic bg-clip-text text-transparent bg-gradient-to-r from-[#c4b5fd] to-[#818cf8]">
                                    account
                                </span>
                            </h1>
                            <p className="text-lg text-white/40 font-light mt-1">Get started with ChurnAI predictions</p>
                        </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleSocialLogin('Google')}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-white text-sm font-medium hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300"
                        >
                            <GoogleIcon />
                            Google
                        </button>
                        <button
                            onClick={() => handleSocialLogin('GitHub')}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-white text-sm font-medium hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300"
                        >
                            <GitHubIcon />
                            GitHub
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name + Username — 2-col */}
                        <div className="grid grid-cols-2 gap-4">
                            <CosmicInput
                                label="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <CosmicInput
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <CosmicInput
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <CosmicInput
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            endAdornment={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            }
                        />

                        {/* Category selector — kept as dropdown */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                                Industry Category <span className="text-white/20 normal-case">(optional)</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-full backdrop-blur-sm bg-white/[0.04] text-white border-b-2 border-white/10 py-3 px-4 text-sm font-medium focus:outline-none focus:border-[#7c5bf0]/60 transition-all flex items-center justify-between text-left cursor-pointer"
                                >
                                    <span className={category ? 'text-white' : 'text-white/25'}>
                                        {category || 'Select a category or skip'}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {dropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full left-0 right-0 mt-1 py-1 rounded-xl border border-white/10 bg-[#0e0c1e]/95 backdrop-blur-xl shadow-2xl shadow-black/40 z-30 max-h-48 overflow-auto"
                                    >
                                        {allCategories.map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => { setCategory(cat); setDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${category === cat ? 'text-[#a78bfa]' : 'text-white/70'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                        {allCategories.length > 0 && <div className="border-t border-white/5 my-1" />}
                                        <div
                                            className="w-full text-left px-4 py-2.5 text-sm text-white/20 flex items-center gap-1.5 cursor-not-allowed"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Register New Category
                                            <span className="ml-auto text-[10px] text-white/15 uppercase tracking-wider">Coming Soon</span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Category Info Toggle */}
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryInfo(!showCategoryInfo)}
                                    className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors"
                                >
                                    <Info className="h-3 w-3" />
                                    {showCategoryInfo ? 'Hide' : 'View'} category details & requirements
                                </button>

                                {showCategoryInfo && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden"
                                    >
                                        <div className="divide-y divide-white/[0.04]">
                                            {categoryInfo.map((cat) => (
                                                <div key={cat.name} className="p-3 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-semibold text-white/80">{cat.name}</h4>
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#7c5bf0]/15 text-[#a78bfa] font-medium">
                                                            {cat.model}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-white/30 leading-relaxed">{cat.description}</p>
                                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                                        <div>
                                                            <p className="text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Target</p>
                                                            <p className="text-[10px] text-white/45 font-mono">{cat.target}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Format</p>
                                                            <p className="text-[10px] text-white/45">{cat.format}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Use Case</p>
                                                            <p className="text-[10px] text-white/45">{cat.useCase}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !name || !username || !email || !password}
                            className="w-full relative group py-3.5 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#7c5bf0] to-[#4f46e5] group-hover:from-[#8b6cf7] group-hover:to-[#5a54f0] transition-all" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl shadow-[#7c5bf0]/30" />
                            <span className="relative flex items-center justify-center gap-2 text-white">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer link */}
                    <p className="text-center text-sm text-white/40">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#a78bfa] hover:text-[#c4b5fd] font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
