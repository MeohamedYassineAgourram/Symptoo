import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const COLORS = ['#2E8B7A', '#E2A93B', '#E07A6B', '#5DB37E', '#8fb3d9', '#b39ddb'];

/** Lightweight confetti burst for records and rank-ups (disabled with reduced motion). */
export function Confetti({ count = 70 }: { count?: number }) {
  const reduced = useReducedMotion() || document.documentElement.dataset.reducedMotion === 'true';
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.4,
        rotate: (Math.random() - 0.5) * 720,
        drift: (Math.random() - 0.5) * 30,
        color: COLORS[i % COLORS.length]!,
        size: 6 + Math.random() * 6,
      })),
    [count],
  );
  if (reduced) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block rounded-sm"
          style={{ left: `${p.x}%`, width: p.size, height: p.size * 0.6, background: p.color }}
          initial={{ y: '-5vh', x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: `${p.drift}vw`, rotate: p.rotate, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
