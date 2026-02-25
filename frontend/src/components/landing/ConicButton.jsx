import { cn } from '@/lib/utils';

export default function ConicButton({ children, onClick, href, className, size = 'default' }) {
    const sizeClasses = {
        sm: 'py-2.5 px-6 text-sm',
        default: 'py-4 px-10 text-base',
        lg: 'py-5 px-12 text-lg',
    };

    const inner = (
        <span
            className={cn(
                'relative inline-flex items-center justify-center gap-2 rounded-full',
                'bg-[#0a0818] font-medium text-white',
                'hover:bg-[#0a0818]/80 transition-all duration-300',
                'hover:shadow-[0_0_30px_rgba(124,91,240,0.3)]',
                sizeClasses[size] || sizeClasses.default,
                className
            )}
        >
            {children}
        </span>
    );

    return (
        <span className="relative inline-block overflow-hidden rounded-full p-[2px] group">
            {/* Spinning conic gradient border */}
            <span
                className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite]"
                style={{
                    background:
                        'conic-gradient(from 90deg at 50% 50%, #c4b5fd 0%, #4f46e5 25%, #7c5bf0 50%, #c4b5fd 75%, #4f46e5 100%)',
                }}
            />
            {href ? (
                <a href={href} className="relative z-10 block">
                    {inner}
                </a>
            ) : (
                <button onClick={onClick} className="relative z-10 block cursor-pointer">
                    {inner}
                </button>
            )}
        </span>
    );
}
