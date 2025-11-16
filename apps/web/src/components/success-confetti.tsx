'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface SuccessConfettiProps {
  /**
   * Type of confetti animation
   * - 'elegant': Subtle gold confetti from top
   * - 'burst': Explosion from center
   * - 'side': Confetti from both sides
   */
  type?: 'elegant' | 'burst' | 'side';
  /**
   * Delay before triggering (ms)
   */
  delay?: number;
}

export function SuccessConfetti({ type = 'elegant', delay = 0 }: SuccessConfettiProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (type === 'elegant') {
        // Subtle luxury confetti
        const duration = 2000;
        const end = Date.now() + duration;

        const colors = ['#CBB57B', '#D4AF37', '#000000'];

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: colors,
            disableForReducedMotion: true,
            scalar: 0.8,
            gravity: 0.8,
          });

          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: colors,
            disableForReducedMotion: true,
            scalar: 0.8,
            gravity: 0.8,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      } else if (type === 'burst') {
        // Center burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#CBB57B', '#D4AF37', '#000000'],
          disableForReducedMotion: true,
        });
      } else if (type === 'side') {
        // Both sides
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          colors: ['#CBB57B', '#D4AF37', '#000000'],
          disableForReducedMotion: true,
        };

        function fire(particleRatio: number, opts: any) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });

        fire(0.2, {
          spread: 60,
        });

        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [type, delay]);

  return null;
}
