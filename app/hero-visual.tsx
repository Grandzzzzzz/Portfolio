'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import type { Content } from '@/lib/content';
import LiquidMetal from './liquid-metal';
import { useSiteMotion } from './motion-frame';
export const defaultBase = '/images/immersive/layer-1.webp';
export const defaultReveal = '/images/immersive/layer-2.webp';
export default function HeroVisual({
  settings,
}: {
  settings: Content['hero'];
}) {
  const { running } = useSiteMotion();
  if (settings.mode === 'metal')
    return (
      <LiquidMetal
        settings={{ ...settings, enabled: settings.enabled && running }}
      />
    );
  return (
    <Spotlight settings={settings} running={running && settings.enabled} />
  );
}
function Spotlight({
  settings,
  running,
}: {
  settings: Content['hero'];
  running: boolean;
}) {
  const root = useRef<HTMLDivElement>(null),
    live = useRef({ settings, running });
  useEffect(() => {
    live.current = { settings, running };
  }, [settings, running]);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const area = node.parentElement || node;
    let width = 1,
      height = 1,
      frame = 0,
      last = 0,
      phase = 0,
      visible = true,
      inside = false,
      target = { x: 0.63, y: 0.54 };
    const smooth = { x: 0.63, y: 0.54 };
    const coarse = matchMedia('(pointer: coarse)');
    const resize = () => {
      const rect = node.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      paint();
    };
    const paint = () => {
      node.style.setProperty('--spot-x', `${smooth.x * width}px`);
      node.style.setProperty('--spot-y', `${smooth.y * height}px`);
      node.style.setProperty(
        '--spot-radius',
        `${Math.min(live.current.settings.radius ?? 260, width * 0.65)}px`,
      );
      node.style.setProperty('--scene-x', `${(smooth.x - 0.5) * -9}px`);
      node.style.setProperty('--scene-y', `${(smooth.y - 0.5) * -7}px`);
    };
    const pointer = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      target = {
        x: Math.max(0, Math.min(1, (e.clientX - rect.left) / width)),
        y: Math.max(0, Math.min(1, (e.clientY - rect.top) / height)),
      };
      inside = true;
    };
    const leave = () => {
      inside = false;
    };
    const tick = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.06) : 0;
      last = now;
      if (visible && !document.hidden) {
        if (live.current.running) {
          phase += delta * (live.current.settings.speed ?? 1);
          if (!inside || coarse.matches) {
            target.x = 0.5 + Math.sin(phase * 0.23) * 0.27;
            target.y = 0.52 + Math.cos(phase * 0.17) * 0.2;
          }
          const ease =
            1 -
            Math.pow(1 - (live.current.settings.follow ?? 0.075), delta * 60);
          smooth.x += (target.x - smooth.x) * ease;
          smooth.y += (target.y - smooth.y) * ease;
        }
        paint();
      }
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(node);
    const ro = new ResizeObserver(resize);
    ro.observe(node);
    area.addEventListener('pointermove', pointer, { passive: true });
    area.addEventListener('pointerleave', leave);
    resize();
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      ro.disconnect();
      area.removeEventListener('pointermove', pointer);
      area.removeEventListener('pointerleave', leave);
    };
  }, []);
  return (
    <div
      ref={root}
      className="spotlight-scene"
      aria-hidden="true"
      style={{ '--scene-shade': settings.shade ?? 0.35 } as CSSProperties}
    >
      <div className="spotlight-images">
        <img
          className="spotlight-base"
          src={settings.baseImage || defaultBase}
          alt=""
          fetchPriority="high"
        />
        <img
          className="spotlight-reveal"
          src={settings.revealImage || defaultReveal}
          alt=""
        />
      </div>
      <div className="spotlight-shade" />
      <div className="spotlight-vignette" />
    </div>
  );
}
