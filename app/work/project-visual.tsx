'use client';
import { useEffect, useRef } from 'react';
import LiquidMetal from '@/app/liquid-metal';
import { useSiteMotion } from '@/app/motion-frame';
export default function ProjectVisual({
  effect,
  seed,
}: {
  effect: 'metal' | 'contour' | 'orbit' | 'none';
  seed: number;
}) {
  const { running } = useSiteMotion();
  if (effect === 'metal')
    return (
      <LiquidMetal
        settings={{
          enabled: running,
          speed: 0.45 + (seed % 5) * 0.12,
          color: 0.35,
          texture: 0.026,
        }}
      />
    );
  if (effect === 'none') return null;
  return <LineVisual effect={effect} seed={seed} running={running} />;
}
function LineVisual({
  effect,
  seed,
  running,
}: {
  effect: 'contour' | 'orbit';
  seed: number;
  running: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    pause = useRef(false),
    active = useRef(running);
  useEffect(() => {
    active.current = running;
  }, [running]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = 1,
      height = 1,
      frame = 0,
      last = 0,
      time = seed * 0.13,
      visible = true,
      needsDraw = true;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    pause.current = media.matches;
    const preference = () => {
      pause.current = media.matches;
    };
    const resize = () => {
      const box = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 1.5);
      width = box.width;
      height = box.height;
      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsDraw = true;
    };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 0.85;
      if (effect === 'contour') {
        for (let line = 0; line < 44; line++) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,255,255,${0.12 + (line % 6) * 0.055})`;
          for (let x = -40; x < width + 40; x += 8) {
            const nx = x / width;
            const y =
              (line * height) / 34 -
              height * 0.12 +
              Math.sin(nx * 5 + time * 0.2 + line * 0.105) * height * 0.13 +
              Math.cos(nx * 10 - time * 0.14 + line * 0.07) * height * 0.065;
            if (x === -40) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else {
        ctx.save();
        ctx.translate(width * 0.52, height * 0.51);
        ctx.rotate(time * 0.025);
        for (let i = 0; i < 34; i++) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,255,255,${0.1 + (i % 5) * 0.07})`;
          ctx.ellipse(
            0,
            0,
            width * (0.08 + i * 0.018),
            height * (0.15 + i * 0.014),
            i * 0.035 + Math.sin(time * 0.1) * 0.4,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
        ctx.restore();
      }
    };
    const tick = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.08) : 0;
      if (now - last > 33) {
        last = now;
        if (visible && !document.hidden) {
          if (!pause.current && active.current) {
            time += delta;
            needsDraw = true;
          }
          if (needsDraw) {
            draw();
            needsDraw = false;
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const resizeObserver = new ResizeObserver(resize),
      observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
    resizeObserver.observe(canvas);
    observer.observe(canvas);
    media.addEventListener('change', preference);
    resize();
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      media.removeEventListener('change', preference);
    };
  }, [effect, seed]);
  return (
    <>
      <canvas ref={ref} className="work-visual-canvas" aria-hidden="true" />
    </>
  );
}
