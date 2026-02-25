import { useState, useRef, useEffect, useCallback } from 'react';

export default function CardStack({ features = [] }) {
    const [active, setActive] = useState(0);
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const intervalRef = useRef(null);

    const count = features.length;

    const resetInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setActive((prev) => (prev + 1) % count);
        }, 5000);
    }, [count]);

    useEffect(() => {
        resetInterval();
        return () => clearInterval(intervalRef.current);
    }, [resetInterval]);

    const handleClick = (index) => {
        setActive(index);
        resetInterval();
    };

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setMousePos({ x, y });
    };

    const handleMouseLeave = () => {
        setMousePos({ x: 0, y: 0 });
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Card stack viewport */}
            <div
                ref={containerRef}
                className="relative h-[420px] md:h-[380px] flex items-center justify-center"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ perspective: '1200px' }}
            >
                {features.map((feature, i) => {
                    const offset = (i - active + count) % count;
                    const isActive = offset === 0;
                    const isBehind1 = offset === 1 || offset === count - 1;
                    const isBehind2 = offset === 2 || offset === count - 2;

                    let zIndex = 0;
                    let scale = 0.75;
                    let translateY = 60;
                    let translateX = 0;
                    let rotateY = 0;
                    let opacity = 0;
                    let blur = 4;

                    if (isActive) {
                        zIndex = 30;
                        scale = 1;
                        translateY = 0;
                        opacity = 1;
                        blur = 0;
                        // Parallax on active card
                        translateX = mousePos.x * 8;
                        rotateY = mousePos.x * 3;
                        translateY = mousePos.y * 4;
                    } else if (isBehind1) {
                        zIndex = 20;
                        scale = 0.92;
                        translateY = 18;
                        translateX = offset === 1 ? 30 : -30;
                        opacity = 0.55;
                        blur = 1;
                    } else if (isBehind2) {
                        zIndex = 10;
                        scale = 0.84;
                        translateY = 36;
                        translateX = offset === 2 ? 55 : -55;
                        opacity = 0.3;
                        blur = 2;
                    }

                    const Icon = feature.icon;

                    return (
                        <div
                            key={i}
                            onClick={() => handleClick(i)}
                            className="absolute w-[90%] md:w-[520px] cursor-pointer select-none"
                            style={{
                                zIndex,
                                opacity,
                                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotateY(${rotateY}deg)`,
                                filter: `blur(${blur}px)`,
                                transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        >
                            <div
                                className={`
                  rounded-2xl border p-8 md:p-10 backdrop-blur-xl
                  ${isActive
                                        ? 'border-white/15 bg-white/[0.06] shadow-2xl shadow-purple-500/10'
                                        : 'border-white/[0.06] bg-white/[0.03]'
                                    }
                `}
                            >
                                {/* Icon */}
                                <div
                                    className={`
                    h-14 w-14 rounded-xl flex items-center justify-center mb-6
                    border border-white/10
                    ${feature.iconColor || 'text-purple-400'}
                  `}
                                    style={{
                                        background: `linear-gradient(135deg, ${feature.iconBg || 'rgba(139,92,246,0.15)'}, transparent)`,
                                    }}
                                >
                                    <Icon className="h-7 w-7" />
                                </div>

                                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-sm md:text-base text-gray-400 leading-relaxed">{feature.description}</p>

                                {/* Subtle decorative line */}
                                {isActive && (
                                    <div className="mt-6 h-[2px] w-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-400 opacity-60" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
                {features.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        className={`
              h-2 rounded-full transition-all duration-500 cursor-pointer
              ${i === active
                                ? 'w-8 bg-gradient-to-r from-purple-500 to-blue-400'
                                : 'w-2 bg-white/20 hover:bg-white/40'
                            }
            `}
                        aria-label={`Go to feature ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
