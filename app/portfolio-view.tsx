'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Content } from '@/lib/content';
import HeroVisual from './hero-visual';
import MotionFrame from './motion-frame';
import ResumeSection from './resume-section';
import { defaultResume } from '@/lib/resume';
import './immersive.css';
export default function Portfolio({ content }: { content: Content }) {
  const works = content.projects;
  const aboutRef = useRef<HTMLElement>(null);
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Shanghai' }),
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  const lines = content.tagline.split('\n').filter(Boolean);
  return (
    <MotionFrame enabled={content.hero.enabled}>
      <main className="immersive-home" id="home">
        <header className="immersive-nav">
          <a className="immersive-wordmark" href="#home">
            {content.name}
          </a>
          <nav aria-label="Main navigation">
            <a href="#home">Home</a>
            <a href="#works">
              Work <sup>{String(works.length).padStart(2, '0')}</sup>
            </a>
            <a href="#about">About</a>
            {(content.resume ?? defaultResume).enabled && (
              <a href="#resume">Résumé</a>
            )}
          </nav>
          <a className="nav-contact" href={`mailto:${content.email}`}>
            Let’s talk <span>↗</span>
          </a>
        </header>
        <section className="immersive-hero" aria-label="Portfolio introduction">
          <HeroVisual settings={content.hero} />
          <div className="immersive-hero-content">
            <div className="hero-overline intro-appear">
              {content.role}
              <span>PORTFOLIO / 2026</span>
            </div>
            <h1
              className="immersive-title"
              style={
                {
                  '--title-scale':
                    Math.max(
                      ...lines.map((l) => l.length),
                      content.name.length,
                    ) > 34
                      ? 'clamp(38px, 5.5vw, 90px)'
                      : 'clamp(48px, 8.2vw, 132px)',
                } as CSSProperties
              }
            >
              <span className="intro-line">{lines[0] || content.name}</span>
              {lines.length > 1 && (
                <span className="intro-line">{lines.slice(1).join(' ')}</span>
              )}
            </h1>
            <div className="immersive-signature intro-appear">
              BY {content.name.toUpperCase()}
            </div>
          </div>
          <div className="immersive-hero-bottom">
            <div className="hero-location intro-appear">
              <span>{content.location}</span>
              <span>{time || '—'} GMT+8</span>
            </div>
            <div className="hero-discover intro-appear">
              {content.available && (
                <span className="immersive-status">
                  <i />
                  Open for selected collaborations
                </span>
              )}
            </div>
          </div>
          <span className="spotlight-hint" aria-hidden="true">
            {content.hero.mode === 'metal'
              ? 'FORM IN MOTION'
              : 'MOVE TO EXPLORE'}
            <span>↓</span>
          </span>
        </section>
        <section className="immersive-works" id="works">
          <div className="immersive-section-top" data-reveal>
            <span>01 / SELECTED WORK</span>
            <span>IDEAS MADE TANGIBLE</span>
          </div>
          <div className="immersive-section-title" data-reveal>
            <h2>
              Different stories.
              <br />
              <em>One point of view.</em>
            </h2>
            <span>[{String(works.length).padStart(2, '0')}]</span>
          </div>
          <div className="immersive-project-grid">
            {works.map((p, i) => (
              <article
                className="immersive-project"
                key={p.id}
                id={p.id}
                data-reveal
              >
                <a
                  className="immersive-project-media"
                  href={`/work/${encodeURIComponent(p.id)}`}
                  aria-label={`View ${p.name}`}
                  data-parallax
                >
                  {p.mediaType === 'video' ? (
                    <video
                      src={p.image}
                      muted
                      loop
                      autoPlay
                      playsInline
                      aria-label={p.name}
                    />
                  ) : (
                    <img src={p.image} alt={p.name} loading="lazy" />
                  )}
                  <span className="project-open">View project ↗</span>
                  <span className="project-ordinal">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </a>
                <div className="immersive-project-info">
                  <div>
                    <h3>
                      <a href={`/work/${encodeURIComponent(p.id)}`}>{p.name}</a>
                    </h3>
                    <p>{p.category}</p>
                  </div>
                  <span>{p.year}</span>
                </div>
                <p className="immersive-project-description">{p.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="immersive-about"
          id="about"
          ref={aboutRef}
          onPointerMove={(event) => {
            const rect = aboutRef.current?.getBoundingClientRect();
            if (!rect) return;
            aboutRef.current?.style.setProperty(
              '--about-shift-x',
              `${(((event.clientX - rect.left) / rect.width) - 0.5) * 40}px`,
            );
            aboutRef.current?.style.setProperty(
              '--about-shift-y',
              `${(((event.clientY - rect.top) / rect.height) - 0.5) * 40}px`,
            );
          }}
        >
          <span className="about-watermark" aria-hidden="true">
            PROCESS
          </span>
          <div className="immersive-section-top" data-reveal>
            <span><b className="section-number">02</b> / BEHIND THE WORK</span>
            <span>{content.name.toUpperCase()}</span>
          </div>
          <div className="about-editorial-head" data-reveal>
            <span className="about-kicker">A WORKING METHOD</span>
            <h2>{content.aboutTitle}</h2>
            <span className="about-index">02—04</span>
          </div>
          <div className="immersive-about-copy" data-reveal>
            <span className="about-asterisk" aria-hidden="true">
              ✳
            </span>
            <div>
              <p>{content.aboutBody}</p>
              {content.aboutExtra && <p>{content.aboutExtra}</p>}
            </div>
          </div>
          <div className="immersive-services" aria-label="Services">
            {content.services.map((s, i) => (
              <div key={`${s}-${i}`} data-reveal>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <h3>{s}</h3>
                <span>↗</span>
              </div>
            ))}
          </div>
        </section>
        <ResumeSection
          resume={content.resume ?? defaultResume}
          name={content.name}
        />
        <footer className="immersive-footer" id="contact">
          <div className="immersive-section-top" data-reveal>
            <span>HAVE SOMETHING IN MIND?</span>
            <span>LET’S MAKE IT REAL.</span>
          </div>
          <a
            className="immersive-contact-title"
            href={`mailto:${content.email}`}
            data-reveal
          >
            Let’s make
            <br />
            <em>an impression.</em>
            <span>↗</span>
          </a>
          <div className="immersive-footer-bottom">
            <span>© 2026 {content.name}</span>
            <a href={`mailto:${content.email}`}>{content.email}</a>
            <a href="#home">Back to top ↑</a>
          </div>
        </footer>
      </main>
    </MotionFrame>
  );
}
