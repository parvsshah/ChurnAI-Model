import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

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

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none" aria-hidden>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px]" />
            </div>

            <Card className="w-full max-w-md border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/20 relative z-10 animate-slide-up">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-xl shadow-primary/30">
                        <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                        <CardDescription className="mt-1">Sign in to your ChurnAI account</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-muted/30 border-border/50 h-11"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-muted/30 border-border/50 h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full h-11 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 gap-2 text-sm"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
