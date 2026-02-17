import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Upload, FileText, Lightbulb, Settings,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload File' },
    { path: '/customers', icon: FileText, label: 'Results' },
    { path: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
    const location = useLocation();

    return (
        <aside
            className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border
                  transition-all duration-300 ease-in-out z-30 flex flex-col
                  ${collapsed ? 'w-[72px]' : 'w-60'}`}
        >
            <Separator className="opacity-50" />

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const link = (
                        <NavLink key={item.path} to={item.path} className="block">
                            <Button
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'} gap-3 h-11 
                  transition-all duration-200 group relative
                  ${isActive
                                        ? 'bg-primary/15 text-primary hover:bg-primary/20 border border-primary/20 shadow-sm glow-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                            >
                                <item.icon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 
                  ${isActive ? '' : 'group-hover:scale-110'}`} />
                                {!collapsed && (
                                    <span className="text-[13px] font-medium">{item.label}</span>
                                )}
                                {isActive && !collapsed && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                                )}
                            </Button>
                        </NavLink>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.path}>
                                <TooltipTrigger asChild>{link}</TooltipTrigger>
                                <TooltipContent side="right" className="font-medium">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }
                    return link;
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-sidebar-border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className={`w-full text-muted-foreground hover:text-foreground gap-2
            ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
                >
                    {collapsed
                        ? <ChevronRight className="h-4 w-4" />
                        : <><ChevronLeft className="h-4 w-4" /><span className="text-xs">Collapse</span></>
                    }
                </Button>
            </div>
        </aside>
    );
}
