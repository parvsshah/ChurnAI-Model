import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 100;
const COLORS = [
    'rgba(167, 139, 250, 0.5)',   // violet
    'rgba(129, 140, 248, 0.4)',   // indigo
    'rgba(200, 190, 255, 0.35)',  // soft lavender
    'rgba(100, 130, 255, 0.3)',   // cosmic blue
    'rgba(255, 255, 255, 0.25)',  // faint white star
    'rgba(168, 85, 247, 0.3)',    // purple
];

function createParticle(w, h) {
    return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 2.2 + 0.6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: Math.random() * 0.4 + 0.1,
        glowSize: Math.random() * 14 + 4,
    };
}

export default function ParticlesBackground() {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const particlesRef = useRef([]);
    const animFrameRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        // Init particles
        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
            createParticle(canvas.width, canvas.height)
        );

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const handleTouchMove = (e) => {
            if (e.touches[0]) {
                mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };
        const handleMouseLeave = () => {
            mouseRef.current = { x: -9999, y: -9999 };
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('resize', resize);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const { x: mx, y: my } = mouseRef.current;

            for (const p of particlesRef.current) {
                // Cursor repulsion
                const dx = p.x - mx;
                const dy = p.y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const force = ((120 - dist) / 120) * 0.8;
                    p.vx += (dx / dist) * force;
                    p.vy += (dy / dist) * force;
                }

                // Damping
                p.vx *= 0.98;
                p.vy *= 0.98;

                // Gentle drift if nearly still
                if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.08;
                if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.08;

                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.y < -10) p.y = canvas.height + 10;
                if (p.y > canvas.height + 10) p.y = -10;

                // Draw with glow
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.shadowBlur = p.glowSize;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ background: 'transparent' }}
            aria-hidden="true"
        />
    );
}
