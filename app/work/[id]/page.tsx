import { notFound } from 'next/navigation';
import { readContent } from '@/db';
import { getDetails, resolveStyle } from '@/lib/project-details';
import ProjectVisual from '../project-visual';
import MotionFrame from '@/app/motion-frame';
import '@/app/immersive.css';
import '../work.css';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { content } = await readContent();
  const p = content.projects.find((p) => p.id === id);
  return {
    title: p ? `${p.name} — ${content.name}` : 'Project not found',
    description: p?.description,
  };
}
export default async function Work({ params }: Props) {
  const { id } = await params;
  const { content } = await readContent();
  const index = content.projects.findIndex((p) => p.id === id);
  if (index < 0) notFound();
  const p = content.projects[index],
    d = getDetails(p),
    style = resolveStyle(d),
    next =
      content.projects.length > 1
        ? content.projects[(index + 1) % content.projects.length]
        : null;
  return (
    <MotionFrame enabled={content.hero.enabled}>
      <main className={`work-page palette-${style.palette}`} id="top">
        <header className="nav">
          <a href="/" className="logo">
            {content.name}
          </a>
          <nav aria-label="Main navigation">
            <a href="/#works">
              Works{' '}
              <sup>[{String(content.projects.length).padStart(2, '0')}]</sup>
            </a>
            <a href="/#about">About</a>
            <a href="/#contact">Contact ↗</a>
          </nav>
          <a href="/#works" className="work-return">
            [ Back to works ↖ ]
          </a>
        </header>
        <section className="work-intro">
          <div className="work-eyebrow">
            <a href="/#works">SELECTED WORK</a>
            <span>
              PROJECT {String(index + 1).padStart(2, '0')} / {p.year}
            </span>
          </div>
          <div className="work-title-row" data-reveal>
            <h1>{p.name}</h1>
            <span className="work-star" aria-hidden="true">
              ✳
            </span>
          </div>
          <div className="work-lead" data-reveal>
            <p>{p.description}</p>
            <a href="#story">Explore the project ↓</a>
          </div>
          <dl className="work-meta" data-reveal>
            {[
              ['DISCIPLINE', p.category],
              ['CLIENT', d.client],
              ['MY ROLE', d.role],
              ['TIMELINE', d.duration],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </section>
        <section className="work-cover" aria-label="Project cover">
          <div className="work-cover-image" data-parallax>
            {p.mediaType === 'video' ? (
              <video
                src={p.image}
                autoPlay
                muted
                loop
                playsInline
                controls
                aria-label={`${p.name} — project cover`}
              />
            ) : (
              <img
                src={p.image}
                alt={`${p.name} — project cover`}
                fetchPriority="high"
              />
            )}
          </div>
          <div className="work-visual-panel">
            <ProjectVisual effect={style.effect} seed={d.seed} />
            <div className="work-visual-label">
              <span>STUDY / {String(index + 1).padStart(2, '0')}</span>
              <span>{p.year}</span>
            </div>
            <div className="work-visual-type" aria-hidden="true">
              FORM.
              <br />
              FEEL.
              <br />
              <i>FLOW.</i>
            </div>
            <span className="work-panel-bottom">{p.category}</span>
          </div>
        </section>
        <section className="work-story" id="story">
          <div className="work-section-heading" data-reveal>
            <span className="work-eyebrow">01 / THE IDEA</span>
            <h2>
              A closer
              <br />
              <em>look.</em>
            </h2>
          </div>
          <div className="work-narrative">
            {[
              ['The challenge', d.challenge],
              ['The approach', d.approach],
              ['The outcome', d.outcome],
            ]
              .filter(([, value]) => value.trim())
              .map(([title, value], i) => (
                <article key={title} data-reveal>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{value}</p>
                  </div>
                </article>
              ))}
            {!d.challenge && !d.approach && !d.outcome && (
              <p className="work-overview" data-reveal>
                {p.description || p.category}
              </p>
            )}
          </div>
        </section>
        {d.gallery.length > 0 && (
          <section className="work-gallery-section">
            <div className="work-gallery-heading" data-reveal>
              <h2>In the details.</h2>
              <span className="work-eyebrow">
                02 / SELECTED FRAMES [
                {String(d.gallery.length).padStart(2, '0')}]
              </span>
            </div>
            <div className="work-gallery">
              {d.gallery.map((g, i) => (
                <figure
                  className={`work-frame frame-${g.layout}`}
                  key={g.id}
                  data-reveal
                >
                  <div>
                    {g.mediaType === 'video' ? (
                      <video
                        src={g.image}
                        muted
                        loop
                        autoPlay
                        controls
                        playsInline
                        aria-label={g.caption || `${p.name} — detail ${i + 1}`}
                      />
                    ) : (
                      <img
                        src={g.image}
                        alt={g.caption || `${p.name} — detail ${i + 1}`}
                        loading="lazy"
                      />
                    )}
                  </div>
                  <figcaption>
                    <span>{g.caption}</span>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        <section className="work-end">
          <span className="work-eyebrow">
            {next ? 'KEEP EXPLORING' : 'THANKS FOR LOOKING'}
          </span>
          {next ? (
            <a
              className="work-next"
              data-reveal
              href={`/work/${encodeURIComponent(next.id)}`}
            >
              <div>
                <span>Next project</span>
                <h2>{next.name} ↗</h2>
              </div>
              <img src={next.image} alt={next.name} loading="lazy" />
            </a>
          ) : (
            <a className="work-next" data-reveal href="/#works">
              <h2>Back to works ↗</h2>
            </a>
          )}
        </section>
        <footer className="work-footer">
          <a href="/">{content.name}</a>
          <a href={`mailto:${content.email}`}>
            Have a project in mind? Let’s talk ↗
          </a>
          <a href="#top">Back to top ↑</a>
        </footer>
      </main>
    </MotionFrame>
  );
}
