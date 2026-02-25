/**
 * CosmicInput — Animated floating-label input for cosmic-themed auth pages.
 * Label characters spring upward when focused or filled.
 * Adapted from shadcn animated input for dark theme.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const containerVariants = {
    initial: {},
    animate: {
        transition: { staggerChildren: 0.04 },
    },
};

const letterVariants = {
    initial: {
        y: 0,
        color: 'rgba(255,255,255,0.25)',
    },
    animate: {
        y: '-110%',
        color: 'rgba(167,139,250,0.7)',
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
        },
    },
};

export function CosmicInput({
    label,
    className = '',
    value,
    type = 'text',
    endAdornment,
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);
    const showLabel = isFocused || (value && value.length > 0);

    return (
        <div className={cn('relative', className)}>
            <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                variants={containerVariants}
                initial="initial"
                animate={showLabel ? 'animate' : 'initial'}
            >
                {label.split('').map((char, i) => (
                    <motion.span
                        key={i}
                        className="inline-block text-sm"
                        variants={letterVariants}
                        style={{ willChange: 'transform' }}
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                ))}
            </motion.div>

            <input
                type={type}
                value={value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
                className={cn(
                    'w-full bg-white/[0.04] text-white border-b-2 border-white/10 py-3.5 px-4 text-sm font-medium',
                    'focus:outline-none focus:border-[#7c5bf0]/60 transition-all placeholder-transparent bg-transparent',
                    endAdornment ? 'pr-12' : ''
                )}
            />

            {endAdornment && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {endAdornment}
                </div>
            )}
        </div>
    );
}

export default CosmicInput;
