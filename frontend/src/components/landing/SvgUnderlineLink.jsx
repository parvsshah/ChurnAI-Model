import { cn } from '@/lib/utils';

/**
 * A text link with an animated SVG wave underline that draws left→right on hover.
 * 
 * Props:
 *  - children: link text
 *  - onClick: click handler
 *  - href: optional anchor href
 *  - className: additional classes
 *  - strokeColor: underline color (default: subtle violet)
 */
export default function SvgUnderlineLink({
    children,
    onClick,
    href,
    className,
    strokeColor = '#a78bfa',
}) {
    const underline = (
        <svg viewBox="0 0 200 6" preserveAspectRatio="none" aria-hidden="true">
            <path
                d="M0 3 C 30 0, 50 6, 80 3 S 150 0, 200 3"
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );

    const sharedClasses = cn(
        'svg-underline-link text-sm text-[#9890b8] hover:text-white transition-colors duration-300',
        className
    );

    if (href) {
        return (
            <a href={href} className={sharedClasses}>
                {children}
                {underline}
            </a>
        );
    }

    return (
        <button onClick={onClick} className={cn(sharedClasses, 'cursor-pointer bg-transparent border-none')}>
            {children}
            {underline}
        </button>
    );
}
