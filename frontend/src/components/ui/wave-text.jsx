/**
 * WaveText — hover-triggered wave animation on individual characters.
 * Each letter bounces up with a spring delay on hover.
 * Supports gradient text via bg-clip-text by applying the gradient
 * to each character span individually.
 */
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function WaveText({ text = 'Hover me', className = '', style = {} }) {
    // Extract text-related classes that need per-character application
    const hasGradient = className.includes('bg-clip-text') || className.includes('text-transparent');

    return (
        <motion.span
            className="inline-block cursor-pointer"
            whileHover="hover"
            initial="initial"
        >
            {text.split('').map((char, i) => (
                <motion.span
                    key={i}
                    className={cn('inline-block', className)}
                    style={style}
                    variants={{
                        initial: { y: 0, scale: 1 },
                        hover: {
                            y: -4,
                            scale: 1.1,
                            transition: {
                                type: 'spring',
                                stiffness: 300,
                                damping: 15,
                                delay: i * 0.03,
                            },
                        },
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </motion.span>
            ))}
        </motion.span>
    );
}

export default WaveText;
