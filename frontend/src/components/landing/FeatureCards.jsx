import { useState, useRef } from 'react';

/**
 * A grid of feature cards — non-overlapping, clean layout.
 * Each card has rounded corners, soft drop shadow, parallax tilt on hover,
 * and lift animation with spring-like easing.
 */
export default function FeatureCards({ features = [] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
                <FeatureCard key={i} feature={feature} index={i} />
            ))}
        </div>
    );
}

function FeatureCard({ feature, index }) {
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setTilt({ x: y * -6, y: x * 6 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
        setIsHovered(false);
    };

    const Icon = feature.icon;

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className="group relative"
            style={{
                perspective: '800px',
                animationDelay: `${index * 80}ms`,
            }}
        >
            <div
                className="relative rounded-2xl border overflow-hidden transition-all duration-500"
                style={{
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${isHovered ? -8 : 0}px)`,
                    transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s ease',
                    borderColor: isHovered ? 'rgba(124,91,240,0.25)' : 'rgba(31,26,56,0.6)',
                    background: 'linear-gradient(180deg, rgba(14,12,30,0.8) 0%, rgba(10,8,24,0.95) 100%)',
                    boxShadow: isHovered
                        ? '0 20px 60px -15px rgba(124,91,240,0.15), 0 10px 30px -10px rgba(0,0,0,0.4)'
                        : '0 4px 20px -5px rgba(0,0,0,0.3)',
                }}
            >
                {/* Subtle gradient shimmer on hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                        background: `radial-gradient(600px circle at ${50 + tilt.y * 5}% ${50 + tilt.x * 5}%, rgba(124,91,240,0.06), transparent 60%)`,
                    }}
                />

                <div className="relative p-7">
                    {/* Icon */}
                    <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center mb-5 border border-[#1f1a38]/80 ${feature.iconColor || 'text-violet-400'}`}
                        style={{
                            background: `linear-gradient(135deg, ${feature.iconBg || 'rgba(124,91,240,0.12)'}, transparent)`,
                        }}
                    >
                        <Icon className="h-6 w-6" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white mb-2.5 tracking-tight">
                        {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[#9890b8] leading-relaxed mb-4">
                        {feature.description}
                    </p>

                    {/* Subtle learn more link */}
                    <span className="text-xs font-medium text-[#7c5bf0] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                        Learn more →
                    </span>
                </div>
            </div>
        </div>
    );
}
