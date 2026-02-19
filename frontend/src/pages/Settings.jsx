import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save, RotateCcw, Moon, Palette, Globe, FolderOpen, Plus,
    Check, ArrowRight, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCategory } from '@/context/CategoryContext';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';

export default function Settings() {
    const navigate = useNavigate();
    const { category: activeCategory, setCategory } = useCategory();
    const { user, refreshUser } = useAuth();
    const [threshold, setThreshold] = useState([70]);
    const [modelType, setModelType] = useState('random-forest');
    const [notifications, setNotifications] = useState({
        email: true, slack: false, critical: true, weekly: true,
    });

    // Categories tab state
    const [userCategories, setUserCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [loadingCats, setLoadingCats] = useState(true);
    const [switching, setSwitching] = useState(null);

    const toggleNotif = (key) => setNotifications(p => ({ ...p, [key]: !p[key] }));

    const loadCategories = useCallback(async () => {
        setLoadingCats(true);
        try {
            const [userRes, allRes] = await Promise.all([
                api.listCategories(),
                api.listAllCategories(),
            ]);
            setUserCategories(userRes.categories || []);
            setAllCategories(allRes.categories || []);
        } catch {
            // silent
        } finally {
            setLoadingCats(false);
        }
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    const userCatNames = userCategories.map(c => c.category_name);
    const availableCategories = allCategories.filter(name => !userCatNames.includes(name));

    const handleSwitchCategory = async (catName) => {
        setSwitching(catName);
        try {
            await setCategory(catName);
        } catch { /* silent */ }
        setSwitching(null);
    };

    const handleUseExisting = async (catName) => {
        setSwitching(catName);
        try {
            // Register the category for this user (with empty schema — they can set it up later)
            await api.registerCategory({ name: catName, model_type: 'random_forest', columns: [{ name: 'target', type: 'target' }] });
            await loadCategories();
            if (refreshUser) await refreshUser();
        } catch { /* silent */ }
        setSwitching(null);
    };

    return (
        <div className="space-y-6">
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-0.5">Configure your churn prediction system</p>
            </div>

            <Tabs defaultValue="categories" className="space-y-4">
                <TabsList className="bg-muted/30 border border-border/30">
                    <TabsTrigger value="categories" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Categories</TabsTrigger>
                    <TabsTrigger value="model" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Model</TabsTrigger>
                    <TabsTrigger value="thresholds" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Thresholds</TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Notifications</TabsTrigger>
                    <TabsTrigger value="appearance" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Appearance</TabsTrigger>
                </TabsList>

                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-4">
                    {/* Your Categories */}
                    <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <FolderOpen className="h-4 w-4 text-primary" /> Your Categories
                            </CardTitle>
                            <CardDescription>Categories you've registered. Click to switch your active category.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingCats ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                                </div>
                            ) : userCategories.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">No categories registered yet. Register one below or from the Upload page.</p>
                            ) : (
                                <div className="space-y-2">
                                    {userCategories.map((cat) => {
                                        const isActive = activeCategory === cat.category_name;
                                        return (
                                            <div key={cat.id || cat.category_name}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-all
                                                    ${isActive
                                                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                                                        : 'bg-muted/10 border-border/30 hover:bg-muted/20'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold
                                                        ${isActive ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground'}`}>
                                                        {cat.category_name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{cat.category_name}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {cat.model_type || 'random_forest'} · {cat.description || 'No description'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isActive ? (
                                                        <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                                                            <Check className="h-3 w-3 mr-1" /> Active
                                                        </Badge>
                                                    ) : (
                                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border/40"
                                                            disabled={switching === cat.category_name}
                                                            onClick={() => handleSwitchCategory(cat.category_name)}>
                                                            {switching === cat.category_name
                                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                                : 'Switch'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Available Categories from Other Users */}
                    {availableCategories.length > 0 && (
                        <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">Available Categories</CardTitle>
                                <CardDescription>Categories registered by other users that you can use</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {availableCategories.map((catName) => (
                                        <Button key={catName} variant="outline" size="sm"
                                            className="h-8 text-xs gap-1.5 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                            disabled={switching === catName}
                                            onClick={() => handleUseExisting(catName)}>
                                            {switching === catName
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : <Plus className="h-3 w-3" />}
                                            {catName}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Register New */}
                    <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Plus className="h-4 w-4 text-primary" /> Register New Category
                            </CardTitle>
                            <CardDescription>Create a brand new category with schema configuration</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3">
                                <Button
                                    className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 gap-2"
                                    onClick={() => navigate('/register-category')}>
                                    <ArrowRight className="h-4 w-4" /> Go to Category Registration
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">
                                You'll be able to define the schema, column types, and model configuration for your new category.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Model Tab */}
                <TabsContent value="model" className="space-y-4">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Model Configuration</CardTitle>
                            <CardDescription>Choose the ML model and domain for predictions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Algorithm</label>
                                    <Select value={modelType} onValueChange={setModelType}>
                                        <SelectTrigger className="bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="random-forest">Random Forest</SelectItem>
                                            <SelectItem value="gradient-boost">Gradient Boosting</SelectItem>
                                            <SelectItem value="xgboost">XGBoost</SelectItem>
                                            <SelectItem value="neural-net">Neural Network</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Domain</label>
                                    <Select defaultValue="telecom">
                                        <SelectTrigger className="bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="telecom">Telecom</SelectItem>
                                            <SelectItem value="saas">SaaS / Subscription</SelectItem>
                                            <SelectItem value="banking">Banking</SelectItem>
                                            <SelectItem value="employee">Employee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator className="opacity-30" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Training Split</label>
                                    <Select defaultValue="80-20">
                                        <SelectTrigger className="bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="80-20">80 / 20</SelectItem>
                                            <SelectItem value="70-30">70 / 30</SelectItem>
                                            <SelectItem value="90-10">90 / 10</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Feature Selection</label>
                                    <Select defaultValue="auto">
                                        <SelectTrigger className="bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">Auto (LLM-assisted)</SelectItem>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="all">All Features</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 gap-2">
                                    <Save className="h-4 w-4" /> Save Configuration
                                </Button>
                                <Button variant="outline" className="gap-2 border-border/50">
                                    <RotateCcw className="h-4 w-4" /> Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Thresholds Tab */}
                <TabsContent value="thresholds" className="space-y-4">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Risk Thresholds</CardTitle>
                            <CardDescription>Define boundaries for risk level classification</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">High Risk Threshold</span>
                                    <span className="text-sm font-bold text-primary tabular-nums">{threshold[0]}%</span>
                                </div>
                                <Slider
                                    value={threshold}
                                    onValueChange={setThreshold}
                                    max={100} min={10} step={5}
                                    className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>10%</span><span>100%</span>
                                </div>
                            </div>

                            <Separator className="opacity-30" />

                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Low', range: '0–25%', color: 'bg-emerald-500', border: 'border-emerald-500/30' },
                                    { label: 'Medium', range: '25–50%', color: 'bg-amber-500', border: 'border-amber-500/30' },
                                    { label: 'High', range: '50–70%', color: 'bg-orange-500', border: 'border-orange-500/30' },
                                    { label: 'Critical', range: '70–100%', color: 'bg-red-500', border: 'border-red-500/30' },
                                ].map((level, i) => (
                                    <div key={i} className={`p-3 rounded-lg bg-muted/20 border ${level.border} text-center`}>
                                        <div className={`h-2 w-2 rounded-full ${level.color} mx-auto mb-2`} />
                                        <p className="text-xs font-semibold">{level.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{level.range}</p>
                                    </div>
                                ))}
                            </div>

                            <Button className="bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/25 gap-2">
                                <Save className="h-4 w-4" /> Save Thresholds
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
                            <CardDescription>Choose how you want to receive alerts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {[
                                { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email' },
                                { key: 'slack', label: 'Slack Integration', desc: 'Send alerts to your Slack channel' },
                                { key: 'critical', label: 'Critical Alerts Only', desc: 'Only notify for critical-risk customers' },
                                { key: 'weekly', label: 'Weekly Digest', desc: 'Summary report every Monday' },
                            ].map((n) => (
                                <div key={n.key} className="flex items-center justify-between py-4 px-1 border-b border-border/20 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium">{n.label}</p>
                                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                                    </div>
                                    <Switch
                                        checked={notifications[n.key]}
                                        onCheckedChange={() => toggleNotif(n.key)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-4">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
                            <CardDescription>Customize the look and feel</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Moon className="h-3.5 w-3.5" /> Theme
                                </label>
                                <Select defaultValue="dark">
                                    <SelectTrigger className="bg-muted/30 border-border/50 w-48"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="system">System</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Palette className="h-3.5 w-3.5" /> Accent Color
                                </label>
                                <div className="flex gap-2">
                                    {[
                                        { name: 'Indigo', color: 'bg-indigo-500' },
                                        { name: 'Purple', color: 'bg-purple-500' },
                                        { name: 'Blue', color: 'bg-blue-500' },
                                        { name: 'Teal', color: 'bg-teal-500' },
                                        { name: 'Rose', color: 'bg-rose-500' },
                                    ].map((c) => (
                                        <button
                                            key={c.name}
                                            className={`h-8 w-8 rounded-full ${c.color} ring-2 ring-offset-2 ring-offset-background
                        ${c.name === 'Indigo' ? 'ring-primary' : 'ring-transparent'}
                        hover:scale-110 transition-transform`}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5" /> Language
                                </label>
                                <Select defaultValue="en">
                                    <SelectTrigger className="bg-muted/30 border-border/50 w-48"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es">Español</SelectItem>
                                        <SelectItem value="hi">हिन्दी</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
