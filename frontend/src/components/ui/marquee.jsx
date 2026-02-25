import { cn } from '@/lib/utils';

export function Marquee({
    children,
    pauseOnHover = false,
    direction = 'left',
    speed = 30,
    className,
    ...props
}) {
    return (
        <div
            className={cn('w-full overflow-hidden z-10', className)}
            {...props}
        >
            <div className="relative flex max-w-[90vw] overflow-hidden py-5 mx-auto">
                <div
                    className={cn(
                        'flex w-max',
                        direction === 'right' ? 'animate-marquee-reverse' : 'animate-marquee',
                        pauseOnHover && 'hover:[animation-play-state:paused]'
                    )}
                    style={{ '--duration': `${speed}s` }}
                >
                    {children}
                    {children}
                </div>
            </div>
        </div>
    );
}
