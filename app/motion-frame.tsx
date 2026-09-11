'use client';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
const MotionContext = createContext({ running: true });
export function useSiteMotion() {
  return useContext(MotionContext);
}
export default function MotionFrame({
  children,
  enabled = true,
  showControl = true,
}: {
  children: ReactNode;
  enabled?: boolean;
  showControl?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const running = enabled && !paused && !reduced;
  useEffect(() => {
    const node = root.current;
    if (!node || !running) return;
    const reveals = Array.from(
      node.querySelectorAll<HTMLElement>('[data-reveal]'),
    );
    const images = Array.from(
      node.querySelectorAll<HTMLElement>('[data-parallax]'),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 },
    );
    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 0.95)
        el.classList.add('is-visible');
      else observer.observe(el);
    });
    node.classList.add('motion-ready');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      images.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          const distance =
            (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight;
          el.style.setProperty(
            '--drift',
            `${Math.max(-18, Math.min(18, distance * 25))}px`,
          );
        }
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      node.classList.remove('motion-ready');
      images.forEach((el) => el.style.removeProperty('--drift'));
    };
  }, [running]);
  return (
    <MotionContext.Provider value={{ running }}>
      <div
        ref={root}
        className={`motion-root ${running ? 'motion-playing' : 'motion-paused'}`}
      >
        {children}
        {showControl && enabled && !reduced && (
          <button
            className="site-motion-toggle"
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
            aria-label={
              paused ? 'Resume visual effects' : 'Pause visual effects'
            }
          >
            <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>
            <span>{paused ? 'Resume motion' : 'Pause motion'}</span>
          </button>
        )}
      </div>
    </MotionContext.Provider>
  );
}
