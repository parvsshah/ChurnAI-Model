import { Bell, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useCategory } from '@/context/CategoryContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { category, setCategory } = useCategory();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const userName = user?.name || 'User';
    const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const categories = user?.categories || [];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl
                       flex items-center justify-between px-6 z-50">
            {/* Logo */}
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

            {/* Right side */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-[18px] w-[18px]" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-3 pl-3 pr-2 h-10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium leading-tight">{userName}</p>
                                <p className="text-[11px] text-muted-foreground leading-tight">{category || 'Select Category'}</p>
                            </div>
                            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>
                            <p className="font-medium">{userName}</p>
                            <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Category sub-menu */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <span className="flex-1">Category</span>
                                <span className="text-xs text-muted-foreground ml-2">{category}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-48">
                                {categories.map((cat) => (
                                    <DropdownMenuItem
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={category === cat ? 'bg-primary/15 text-primary' : ''}
                                    >
                                        {cat}
                                        {category === cat && <span className="ml-auto text-primary">✓</span>}
                                    </DropdownMenuItem>
                                ))}
                                {categories.length === 0 && (
                                    <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                                        No categories yet
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled className="text-muted-foreground/40 cursor-not-allowed">
                                    + Register New Category
                                    <span className="ml-auto text-[10px] opacity-50">Soon</span>
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive gap-2" onClick={handleLogout}>
                            <LogOut className="h-3.5 w-3.5" /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
