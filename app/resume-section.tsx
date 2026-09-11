'use client';
import { useState, type CSSProperties } from 'react';
import { type Resume, resumeKinds } from '@/lib/resume';
import './resume.css';

export default function ResumeSection({
  resume,
  name,
}: {
  resume: Resume;
  name: string;
}) {
  const [paused, setPaused] = useState(false);
  if (!resume.enabled) return null;
  return (
    <section
      className="immersive-resume"
      id="resume"
      aria-labelledby="resume-title"
    >
      <div className="immersive-section-top" data-reveal>
        <span>03 / THE JOURNEY</span>
        <span>EXPERIENCE · EDUCATION · EXPLORATION</span>
      </div>
      <div className="resume-layout">
        <div className="resume-introduction">
          <h2 id="resume-title" data-reveal>
            {resume.title}
          </h2>
          <p data-reveal>{resume.intro}</p>
          <div className="resume-identity" data-reveal>
            <span className="resume-identity-mark" aria-hidden="true">
              {name
                .split(/\s+/)
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span>
              {name}
              <small>A LITTLE MORE ABOUT ME ↘</small>
            </span>
            <span className="resume-orbit" aria-hidden="true" />
          </div>
        </div>
        <div className="resume-timeline">
          {resume.entries.map((entry, i) => (
            <article className="resume-entry" key={entry.id} data-reveal>
              <div className="resume-entry-top">
                <span>{entry.period}</span>
                <span>{resumeKinds[entry.kind]}</span>
              </div>
              <h3>{entry.title}</h3>
              {entry.organization && (
                <p className="resume-organization">{entry.organization}</p>
              )}
              {entry.description && (
                <p className="resume-description">{entry.description}</p>
              )}
              <span className="resume-entry-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
            </article>
          ))}
        </div>
      </div>
      {resume.images.length > 0 && (
        <div className="resume-photos">
          {resume.images.map((photo, i) => (
            <figure
              className={`resume-photo resume-photo-${photo.layout}`}
              key={photo.id}
              data-reveal
            >
              <div data-parallax>
                <img
                  src={photo.image}
                  alt={photo.caption || `${name} — personal image ${i + 1}`}
                  loading="lazy"
                />
              </div>
              {photo.caption && (
                <figcaption>
                  <span>{photo.caption}</span>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
      {resume.logos.length > 0 && (
        <div
          className={`resume-logos ${paused ? 'logos-paused' : ''}`}
          style={{ '--logo-duration': `${resume.logoSpeed}s` } as CSSProperties}
          data-reveal
        >
          <div className="resume-logos-heading">
            <h3>{resume.logoTitle}</h3>
            {resume.logos.length > 1 && (
              <button
                type="button"
                aria-pressed={paused}
                aria-label={
                  paused ? 'Resume logo scrolling' : 'Pause logo scrolling'
                }
                onClick={() => setPaused(!paused)}
              >
                {paused ? '▷ Resume logos' : 'Ⅱ Pause logos'}
              </button>
            )}
          </div>
          <div
            className={`resume-logo-window ${resume.logos.length === 1 ? 'single-logo' : ''}`}
          >
            <div className="resume-logo-track">
              {[0, 1].map((copy) => (
                <ul
                  className="resume-logo-group"
                  key={copy}
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  {resume.logos.map((logo, i) => (
                    <li key={logo.id}>
                      {logo.image ? (
                        <img
                          src={logo.image}
                          alt={copy === 0 ? logo.name : ''}
                          loading="lazy"
                        />
                      ) : (
                        <span className={`resume-wordmark wordmark-${i % 3}`}>
                          <i aria-hidden="true">{['✳', '◈', '↗'][i % 3]}</i>
                          {logo.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
