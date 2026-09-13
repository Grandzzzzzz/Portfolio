'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { type Resume, resumeKinds } from '@/lib/resume';
import AboutGeometry from './about-geometry';
import './resume.css';
import { Briefcase, Camera, Gamepad2, Mail, Phone } from 'lucide-react';

function interactiveResumeText(text: string) {
  return text.split(/(\s+)/).map((part, index) =>
    /^\s+$/.test(part) ? (
      part
    ) : (
      <span className="interactive-word" key={`${part}-${index}`}>
        {part}
      </span>
    ),
  );
}

const socialIcons = {
  instagram: Camera,
  linkedin: Briefcase,
  steam: Gamepad2,
};

export default function ResumeSection({
  resume,
  name,
  email,
}: {
  resume: Resume;
  name: string;
  email: string;
}) {
  const journeyStageRef = useRef<HTMLDivElement>(null);
  const journeyTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = journeyStageRef.current;
    const track = journeyTrackRef.current;
    if (!stage || !track) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const measure = () => {
      const distance = Math.max(track.scrollWidth - window.innerWidth, 0);
      stage.style.setProperty('--journey-distance', `${distance}px`);
      return distance;
    };
    const update = () => {
      frame = 0;
      const distance = measure();
      if (reducedMotion.matches || distance === 0) {
        track.style.setProperty('--journey-shift', '0px');
        return;
      }
      const rect = stage.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, -rect.top / Math.max(stage.offsetHeight - innerHeight, 1)),
      );
      track.style.setProperty(
        '--journey-shift',
        `${-distance * progress}px`,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reducedMotion.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reducedMotion.removeEventListener('change', schedule);
    };
  }, []);

  if (!resume.enabled) return null;
  return (
    <section
      className="immersive-resume"
      id="resume"
      aria-labelledby="resume-title"
    >
      <AboutGeometry />
      <div className="journey-content">
      <div className="journey-index-grid" aria-hidden="true">
        <i />
        <i />
        <i />
        <b />
        <b />
        <b />
      </div>
      <span className="journey-watermark" aria-hidden="true">TRACE</span>
      <div className="immersive-section-top" data-reveal>
        <span><b className="section-number">03</b> / THE JOURNEY</span>
        <span>EXPERIENCE · EDUCATION · EXPLORATION</span>
      </div>
      <div className="journey-stage" ref={journeyStageRef}>
        <div className="resume-layout" ref={journeyTrackRef}>
          <div className="resume-introduction">
          <span className="resume-kicker">A FIELD GUIDE TO THE WORK</span>
          <h2 id="resume-title" data-reveal>
            {interactiveResumeText(resume.title)}
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
            <div className="resume-contact-list">
              {resume.contacts.wechat.enabled && resume.contacts.wechat.value && (
                <span><b>微信</b>{resume.contacts.wechat.value}</span>
              )}
              {resume.contacts.email.enabled && (resume.contacts.email.value || email) && (
                <a href={`mailto:${resume.contacts.email.value || email}`}><Mail aria-hidden="true" />{resume.contacts.email.value || email}</a>
              )}
              {resume.contacts.phone.enabled && resume.contacts.phone.value && (
                <a href={`tel:${resume.contacts.phone.value}`}><Phone aria-hidden="true" />{resume.contacts.phone.value}</a>
              )}
            </div>
            {resume.socials.some((social) => social.enabled && social.url) && (
              <div className="resume-social-list" aria-label="Social links">
                {resume.socials.filter((social) => social.enabled && social.url).map((social) => {
                  const Icon = socialIcons[social.platform];
                  return <a key={social.id} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}><Icon aria-hidden="true" /></a>;
                })}
              </div>
            )}
            <span className="resume-orbit" aria-hidden="true" />
          </div>
          </div>
          <div className="resume-timeline">
            <div className="resume-timeline-label" aria-hidden="true">
              <span>LIVE ARCHIVE</span>
              <span>SCROLL TO TRACE THE PATH</span>
            </div>
            {resume.entries.map((entry, i) => (
              <article className={`resume-entry resume-entry-${entry.kind}`} key={entry.id} data-reveal>
                <div className="resume-entry-top">
                  <span>{entry.period}</span>
                  <span>{interactiveResumeText(resumeKinds[entry.kind])}</span>
                </div>
                <h3>{entry.title}</h3>
                {entry.organization && (
                  <p className="resume-organization">
                    {interactiveResumeText(entry.organization)}
                  </p>
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
          className="resume-logos"
          style={{ '--logo-duration': `${resume.logoSpeed}s` } as CSSProperties}
          data-reveal
        >
          <div className="resume-logos-heading">
            <h3>{resume.logoTitle}</h3>
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
      </div>
    </section>
  );
}
