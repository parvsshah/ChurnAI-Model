import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StatCard({ title, value, change, changeType, icon: Icon, color, delay = 0 }) {
    const [displayValue, setDisplayValue] = useState('');
    const cardRef = useRef(null);

    // Animated counter effect
    useEffect(() => {
        const numericPart = value.replace(/[^0-9.]/g, '');
        const prefix = value.match(/^[^0-9]*/)?.[0] || '';
        const suffix = value.match(/[^0-9.]*$/)?.[0] || '';
        const target = parseFloat(numericPart);

        if (isNaN(target)) { setDisplayValue(value); return; }

        let start = 0;
        const duration = 1200;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = start + (target - start) * eased;
            const formatted = target >= 100
                ? Math.round(current).toLocaleString()
                : current.toFixed(1);
            setDisplayValue(`${prefix}${formatted}${suffix}`);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value]);

    const colorMap = {
        primary: 'from-indigo-500 to-purple-500',
        warning: 'from-amber-500 to-orange-500',
        danger: 'from-red-500 to-rose-500',
        success: 'from-emerald-500 to-teal-500',
    };
    const glowMap = {
        primary: 'glow-primary',
        warning: 'glow-warning',
        danger: 'glow-danger',
        success: 'glow-success',
    };

    return (
        <Card
            ref={cardRef}
            className={`relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm
                  hover:scale-[1.02] transition-all duration-300 stat-shimmer
                  animate-slide-up ${glowMap[color] || ''}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight animate-count-up">{displayValue}</p>
                        <Badge
                            variant="outline"
                            className={`text-[11px] font-medium px-2 py-0.5 gap-1 ${changeType === 'positive'
                                    ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                                    : 'text-red-400 border-red-400/30 bg-red-400/10'
                                }`}
                        >
                            <span className="text-[10px]">{changeType === 'positive' ? '↑' : '↓'}</span>
                            {change} <span className="text-muted-foreground">vs last month</span>
                        </Badge>
                    </div>
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.primary}
                          flex items-center justify-center shadow-lg opacity-80`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                </div>
            </CardContent>
            {/* Bottom accent bar */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${colorMap[color] || colorMap.primary} opacity-60`} />
        </Card>
    );
}
