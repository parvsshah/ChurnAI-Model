import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, UserPlus, Eye, EyeOff, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import * as api from '@/services/api';

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
    const [allCategories, setAllCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);

    // Fetch all existing categories on mount
    useEffect(() => {
        api.listAllCategories()
            .then(data => setAllCategories(data.categories || []))
            .catch(() => setAllCategories([]))
            .finally(() => setLoadingCats(false));
    }, []);

    const effectiveCategory = category === '__new__' ? customCategory.trim() : category;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(username, email, password, name, effectiveCategory || null);
            if (effectiveCategory) {
                setCategoryContext(effectiveCategory);
            }
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
                <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px]" />
            </div>

            <Card className="w-full max-w-md border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/20 relative z-10 animate-slide-up">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-xl shadow-primary/30">
                        <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Create account</CardTitle>
                        <CardDescription className="mt-1">Get started with ChurnAI predictions</CardDescription>
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

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                                <Input
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="bg-muted/30 border-border/50 h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Username</label>
                                <Input
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="bg-muted/30 border-border/50 h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-muted/30 border-border/50 h-10"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="bg-muted/30 border-border/50 h-10 pr-10"
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

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Industry Category <span className="text-muted-foreground/60">(optional)</span>
                            </label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-muted/30 border-border/50 h-10">
                                    <SelectValue placeholder={loadingCats ? 'Loading categories...' : 'Select a category or skip'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCategories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                    {allCategories.length > 0 && (
                                        <div className="border-t border-border/20 my-1" />
                                    )}
                                    <SelectItem value="__new__">
                                        <span className="flex items-center gap-1.5 text-primary">
                                            <Plus className="h-3.5 w-3.5" /> Register New Category
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {category === '__new__' && (
                                <Input
                                    placeholder="Enter new category name (e.g. E-commerce)"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="bg-muted/30 border-border/50 h-10 mt-2"
                                    autoFocus
                                />
                            )}

                            <p className="text-[11px] text-muted-foreground">
                                You can always manage categories later from Settings
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !name || !username || !email || !password}
                            className="w-full h-11 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 gap-2 text-sm"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
