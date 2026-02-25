import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { CanvasRevealEffect } from '@/components/ui/canvas-reveal-effect';
import { CosmicInput } from '@/components/ui/cosmic-input';
import { useAuth } from '@/context/AuthContext';

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

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        // Social login placeholder — wire up your OAuth flow here
        console.log(`${provider} login clicked`);
        setError(`${provider} login is coming soon. Please use email/password for now.`);
    };

    return (
        <div className="flex w-full flex-col min-h-screen bg-[#06050e] relative overflow-hidden">
            {/* Canvas Background */}
            <div className="absolute inset-0 z-0">
                <CanvasRevealEffect
                    animationSpeed={4}
                    containerClassName="bg-[#06050e]"
                    colors={[
                        [124, 91, 240],
                        [99, 102, 241],
                    ]}
                    dotSize={6}
                    opacities={[0.4, 0.4, 0.5, 0.5, 0.6, 0.6, 0.8, 0.8, 0.9, 1]}
                    reverse={false}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,5,14,0.55)_0%,_rgba(6,5,14,0.15)_100%)]" />
                <div className="absolute top-0 left-0 right-0 h-1/5 bg-gradient-to-b from-[#06050e]/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-[#06050e]/80 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-full max-w-sm space-y-7"
                >
                    {/* Logo + Heading */}
                    <div className="text-center space-y-4">
                        <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-to-br from-[#7c5bf0] to-[#4f46e5] flex items-center justify-center shadow-xl shadow-[#7c5bf0]/30">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[2.25rem] font-bold leading-[1.1] tracking-tight text-white">
                                Welcome{' '}
                                <span className="font-[Playfair_Display] italic bg-clip-text text-transparent bg-gradient-to-r from-[#c4b5fd] to-[#818cf8]">
                                    back
                                </span>
                            </h1>
                            <p className="text-lg text-white/40 font-light mt-1">Sign in to your ChurnAI account</p>
                        </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => handleSocialLogin('Google')}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-white text-sm font-medium hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300"
                        >
                            <GoogleIcon />
                            Continue with Google
                        </button>
                        <button
                            onClick={() => handleSocialLogin('GitHub')}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-white text-sm font-medium hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300"
                        >
                            <GitHubIcon />
                            Continue with GitHub
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
                    <form onSubmit={handleSubmit} className="space-y-5">
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

                        {/* Forgot password link */}
                        <div className="flex justify-end">
                            <button type="button" className="text-xs text-[#a78bfa]/60 hover:text-[#a78bfa] transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full relative group py-3.5 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#7c5bf0] to-[#4f46e5] group-hover:from-[#8b6cf7] group-hover:to-[#5a54f0] transition-all" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl shadow-[#7c5bf0]/30" />
                            <span className="relative flex items-center justify-center gap-2 text-white">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer link */}
                    <p className="text-center text-sm text-white/40">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#a78bfa] hover:text-[#c4b5fd] font-medium transition-colors">
                            Sign up
                        </Link>
                    </p>

                    {/* Subtle legal text */}
                    <p className="text-xs text-white/20 text-center pt-2">
                        By signing in, you agree to ChurnAI's{' '}
                        <span className="underline cursor-pointer hover:text-white/40 transition-colors">Terms of Service</span> and{' '}
                        <span className="underline cursor-pointer hover:text-white/40 transition-colors">Privacy Policy</span>.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
