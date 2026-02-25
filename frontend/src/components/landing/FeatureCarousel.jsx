/**
 * FeatureCarousel — Editorial serif-styled horizontal carousel with
 * tilt hover, expand-on-click modal, and cosmic theme.
 *
 * Inspired by retro testimonial cards but adapted for ChurnAI's
 * cosmic violet palette.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Sparkles } from 'lucide-react';

/* ── outside-click hook ── */
function useOutsideClick(ref, callback) {
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) callback();
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [ref, callback]);
}

/* ── main carousel ── */
export default function FeatureCarousel({ features = [] }) {
    const scrollRef = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(true);

    const check = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanLeft(scrollLeft > 0);
        setCanRight(scrollLeft < scrollWidth - clientWidth - 2);
    };

    const scrollBy = (dir) => {
        const amount = window.innerWidth < 768 ? 280 : 400;
        scrollRef.current?.scrollBy({ left: dir * amount, behavior: 'smooth' });
    };

    useEffect(() => { check(); }, []);

    const [expanded, setExpanded] = useState(null);    // index of expanded card
    const modalRef = useRef(null);
    useOutsideClick(modalRef, () => setExpanded(null));

    // ESC key + scroll lock
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setExpanded(null); };
        if (expanded !== null) {
            const y = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${y}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            document.body.dataset.scrollY = String(y);
        } else {
            const y = parseInt(document.body.dataset.scrollY || '0', 10);
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            window.scrollTo({ top: y, behavior: 'instant' });
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [expanded]);

    return (
        <>
            {/* ── Carousel ── */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    onScroll={check}
                    className="flex gap-5 overflow-x-auto scroll-smooth pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {features.map((f, i) => (
                        <FeatureCard key={i} feature={f} index={i} total={features.length} onExpand={() => setExpanded(i)} />
                    ))}
                </div>

                {/* Fade edges */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#06050e] to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#06050e] to-transparent z-10" />
            </div>

            {/* ── Navigation arrows ── */}
            <div className="flex justify-end gap-2 mt-3">
                <button
                    onClick={() => scrollBy(-1)}
                    disabled={!canLeft}
                    className="h-10 w-10 rounded-full bg-[#1a1530] border border-[#2a2345] flex items-center justify-center
                     text-[#c4b5fd] hover:bg-[#241e3d] hover:border-[#7c5bf0]/40 transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                    onClick={() => scrollBy(1)}
                    disabled={!canRight}
                    className="h-10 w-10 rounded-full bg-[#1a1530] border border-[#2a2345] flex items-center justify-center
                     text-[#c4b5fd] hover:bg-[#241e3d] hover:border-[#7c5bf0]/40 transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ArrowRight className="h-5 w-5" />
                </button>
            </div>

            {/* ── Expanded modal ── */}
            <AnimatePresence>
                {expanded !== null && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, y: 40, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.97 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="relative z-[60] max-w-lg mx-auto mt-24 md:mt-32 rounded-2xl
                         bg-gradient-to-b from-[#12101f] to-[#0a0918]
                         border border-[#1f1a38]/60 p-6 md:p-8 mx-4"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setExpanded(null)}
                                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-[#1a1530] border border-[#2a2345]
                           flex items-center justify-center text-white/60 hover:text-white hover:border-[#7c5bf0]/40 transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {(() => {
                                const f = features[expanded];
                                return (
                                    <div className="space-y-5">
                                        {/* Icon + title */}
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: f.iconBg }}>
                                                <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                                            </div>
                                            <h3 className="text-white text-lg font-semibold tracking-tight">
                                                {f.title}
                                            </h3>
                                        </div>

                                        {/* Full description */}
                                        <p className="text-[#b8b0d0] text-[0.95rem] leading-[1.7]">
                                            {f.description}
                                        </p>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ── individual card ── */
function FeatureCard({ feature, index, total, onExpand }) {
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const x = -(e.clientY - cy) / 25;
        const y = (e.clientX - cx) / 25;
        setTilt({ x, y });
    };
    const handleLeave = () => setTilt({ x: 0, y: 0 });

    return (
        <motion.button
            ref={cardRef}
            onClick={onExpand}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
            className="flex-shrink-0 text-left cursor-pointer group"
            style={{ perspective: '800px' }}
        >
            <div
                className="relative w-[280px] md:w-[350px] h-[320px] md:h-[360px] rounded-3xl overflow-hidden
                   border border-[#1f1a38]/50 bg-gradient-to-b from-[#100e1c] to-[#0a0918]
                   transition-shadow duration-400
                   group-hover:shadow-xl group-hover:shadow-[#7c5bf0]/8"
                style={{
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x || tilt.y ? 1.02 : 1})`,
                    transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease',
                }}
            >
                {/* Subtle background texture overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #7c5bf0 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent 10%, ${feature.iconBg.replace('0.12', '0.5')}, transparent 90%)` }}
                />

                <div className="relative z-10 p-7 md:p-8 flex flex-col h-full">
                    {/* Header — icon + title */}
                    <div className="flex items-center gap-3 mb-6">
                        <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                            style={{ background: feature.iconBg }}
                        >
                            <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                        </div>
                        <h3 className="text-white text-base font-semibold tracking-tight leading-tight">
                            {feature.title}
                        </h3>
                    </div>

                    {/* Description */}
                    <p className="text-[#9890b8] text-sm leading-[1.7] flex-1">
                        {feature.description.length > 140 ? `${feature.description.slice(0, 140)}...` : feature.description}
                    </p>
                </div>
            </div>
        </motion.button>
    );
}
