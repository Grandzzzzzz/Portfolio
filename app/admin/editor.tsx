'use client';
import { useEffect, useState } from 'react';
import type { Content, Project } from '@/lib/content';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import HeroSettings from './hero-settings';
import ResumeEditor from './resume-editor';
import { defaultResume } from '@/lib/resume';
import ProjectDetailsEditor from './project-details-editor';
import { uploadMedia } from '@/lib/upload-media';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
type Snapshot = { content: Content; version: number; updatedAt: string | null };
export default function Editor({
  initial,
  logoutPath = '/signout-with-chatgpt?return_to=/admin',
}: {
  initial: Snapshot;
  logoutPath?: string;
}) {
  const [content, setContent] = useState(initial.content),
    [saved, setSaved] = useState(initial),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState<string | null>(null),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [remove, setRemove] = useState<string | null>(null);
  useEffect(()=>{if(logoutPath==='netlify')void import('@netlify/identity').then(auth=>auth.getUser())},[logoutPath]);
  async function signOut(){const auth=await import('@netlify/identity');try{await auth.logout()}finally{location.replace('/admin')}}
  const dirty = JSON.stringify(content) !== JSON.stringify(saved.content);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const field = (key: keyof Content, value: unknown) =>
    setContent((c) => ({ ...c, [key]: value }));
  const project = (
    id: string,
    key: keyof Project,
    value: Project[keyof Project],
  ) =>
    setContent((c) => ({
      ...c,
      projects: c.projects.map((p) =>
        p.id === id ? { ...p, [key]: value } : p,
      ),
    }));
  const move = (index: number, step: number) =>
    setContent((c) => {
      const projects = [...c.projects];
      [projects[index], projects[index + step]] = [
        projects[index + step],
        projects[index],
      ];
      return { ...c, projects };
    });
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            ...content,
            services: content.services.map((s) => s.trim()).filter(Boolean),
          },
          version: saved.version,
        }),
      });
      const data = (await response.json()) as Snapshot & { error?: string };
      if (!response.ok) throw Error(data.error);
      setSaved(data);
      setContent(data.content);
      setMessage('已保存，前台内容已更新。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请重试');
    } finally {
      setBusy(false);
    }
  }
  async function upload(id: string, file?: File) {
    if (!file) return;
    setError('');
    if (file.size > 50 * 1024 * 1024) {
      setError('文件不能超过 50 MB');
      return;
    }
    setUploading(id);
    try {
      const data = await uploadMedia(file);
      project(id, 'image', data.url);
      project(id, 'mediaType', data.mediaType);
      setMessage('媒体已上传，保存后会应用到前台。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(null);
    }
  }
  const textField = (
    label: string,
    key: {
      [K in keyof Content]-?: Content[K] extends string ? K : never;
    }[keyof Content],
    max: number,
    multi = false,
  ) => (
    <label className="cms-field" key={key}>
      <span>{label}</span>
      {multi ? (
        <Textarea
          rows={4}
          maxLength={max}
          value={String(content[key])}
          onChange={(e) => field(key, e.target.value)}
        />
      ) : (
        <Input
          maxLength={max}
          value={String(content[key])}
          onChange={(e) => field(key, e.target.value)}
        />
      )}
    </label>
  );
  return (
    <main className="cms">
      <header className="cms-top">
        <a href="/admin" className="cms-brand">
          N<span> / STUDIO</span>
        </a>
        <div>
          <a href="/" target="_blank" rel="noreferrer">
            查看网站 ↗
          </a>
          {logoutPath==='netlify'?<button type="button" onClick={()=>{void signOut()}}>退出</button>:<a href={logoutPath}>退出</a>}
        </div>
      </header>
      <div className="cms-body">
        <div className="cms-heading">
          <div>
            <span className="cms-kicker">YOUR PORTFOLIO, YOUR WAY</span>
            <h1>内容管理</h1>
            <p>让你的每一次更新，都成为新的表达。</p>
          </div>
          <div className="cms-save">
            <span>
              {dirty
                ? '● 有未保存的修改'
                : saved.updatedAt
                  ? '所有更改已保存'
                  : '当前为示例内容'}
            </span>
            <button
              className="cms-primary"
              onClick={save}
              disabled={busy || !!uploading || !dirty}
            >
              {busy ? '正在保存…' : '保存并应用 ↗'}
            </button>
          </div>
        </div>
        <div aria-live="polite">
          {message && <p className="cms-message">{message}</p>}
        </div>
        {error && (
          <p className="cms-error" role="alert">
            {error}
          </p>
        )}
        <Tabs defaultValue="profile">
          <TabsList className="cms-tabs">
            <TabsTrigger value="profile">01 基本信息</TabsTrigger>
            <TabsTrigger value="works">
              02 作品管理 <span>{content.projects.length}</span>
            </TabsTrigger>
            <TabsTrigger value="about">03 关于我</TabsTrigger>
            <TabsTrigger value="hero">04 Hero 动效</TabsTrigger>
            <TabsTrigger value="resume">05 简历与 Logo</TabsTrigger>
          </TabsList>
          <fieldset disabled={busy || !!uploading} className="cms-fields">
            <TabsContent value="profile">
              <div className="cms-grid">
                <section className="cms-card">
                  <h2>先介绍一下你自己</h2>
                  <p>这些内容会出现在首页与联系区域。</p>
                  <div className="cms-pair">
                    {textField('姓名 / 品牌名称', 'name', 40)}
                    {textField('所在城市', 'location', 100)}
                  </div>
                  {textField('职业定位', 'role', 150)}
                  {textField('首页短句（可换行）', 'tagline', 250, true)}
                  {textField('联系邮箱', 'email', 150)}
                  <label className="cms-toggle" htmlFor="profile-available">
                    <span>显示“可接受新项目”状态</span>
                    <Switch
                      id="profile-available"
                      checked={content.available}
                      onCheckedChange={(v) => field('available', v)}
                    />
                  </label>
                </section>
                <aside className="cms-card cms-summary">
                  <span className="cms-kicker">IDENTITY PREVIEW</span>
                  <h2>{content.name || 'YOUR NAME'}</h2>
                  <p>{content.role}</p>
                  <div className="cms-rule" />
                  <p style={{ whiteSpace: 'pre-line' }}>{content.tagline}</p>
                  <span>{content.location}</span>
                  <span>{content.email}</span>
                </aside>
              </div>
            </TabsContent>
            <TabsContent value="works">
              <section className="cms-card">
                <div className="cms-row">
                  <div>
                    <h2>你的精选作品</h2>
                    <p>作品按这里的顺序展示在首页，点击可进入详情页。</p>
                  </div>
                  <button
                    className="cms-secondary"
                    disabled={content.projects.length >= 30}
                    onClick={() =>
                      field('projects', [
                        ...content.projects,
                        {
                          id: crypto.randomUUID(),
                          name: '新作品',
                          category: 'Brand identity',
                          year: String(new Date().getFullYear()),
                          image: '/images/work-01.png',
                          description: '',
                        },
                      ])
                    }
                  >
                    ＋ 添加作品
                  </button>
                </div>
                {content.projects.length === 0 && (
                  <p className="cms-empty">还没有作品，添加第一个项目吧。</p>
                )}
                {content.projects.map((p, i) => (
                  <article className="cms-project" key={p.id}>
                    <div className="cms-image">
                      {p.mediaType === 'video' ? (
                        <video src={p.image} muted loop autoPlay playsInline />
                      ) : (
                        <img src={p.image} alt={p.name} />
                      )}
                      <label className="cms-upload">
                        {uploading === p.id ? '正在上传…' : '↑ 更换图片'}
                        <input
                          aria-label={`更换${p.name}图片`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                          disabled={!!uploading}
                          onChange={(e) => {
                            void upload(p.id, e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <span>
                        JPG / PNG / WebP · MP4 / WebM
                        <br />文件最大 50 MB
                      </span>
                    </div>
                    <div>
                      <div className="cms-row">
                        <span className="cms-kicker">
                          PROJECT {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="cms-actions">
                          <button
                            aria-label={`上移${p.name}`}
                            disabled={i === 0}
                            onClick={() => move(i, -1)}
                          >
                            ↑
                          </button>
                          <button
                            aria-label={`下移${p.name}`}
                            disabled={i === content.projects.length - 1}
                            onClick={() => move(i, 1)}
                          >
                            ↓
                          </button>
                          <button onClick={() => setRemove(p.id)}>移除</button>
                        </div>
                      </div>
                      <label
                        className="cms-field"
                        htmlFor={`project-${p.id}-name`}
                      >
                        <span>作品名称</span>
                        <Input
                          maxLength={100}
                          id={`project-${p.id}-name`}
                          value={p.name}
                          onChange={(e) =>
                            project(p.id, 'name', e.target.value)
                          }
                        />
                      </label>
                      <div className="cms-pair">
                        <label
                          className="cms-field"
                          htmlFor={`project-${p.id}-category`}
                        >
                          <span>类别 / 服务</span>
                          <Input
                            maxLength={150}
                            id={`project-${p.id}-category`}
                            value={p.category}
                            onChange={(e) =>
                              project(p.id, 'category', e.target.value)
                            }
                          />
                        </label>
                        <label
                          className="cms-field"
                          htmlFor={`project-${p.id}-year`}
                        >
                          <span>年份</span>
                          <Input
                            maxLength={20}
                            id={`project-${p.id}-year`}
                            value={p.year}
                            onChange={(e) =>
                              project(p.id, 'year', e.target.value)
                            }
                          />
                        </label>
                      </div>
                      <label
                        className="cms-field"
                        htmlFor={`project-${p.id}-description`}
                      >
                        <span>作品介绍</span>
                        <Textarea
                          id={`project-${p.id}-description`}
                          rows={3}
                          maxLength={3000}
                          value={p.description}
                          onChange={(e) =>
                            project(p.id, 'description', e.target.value)
                          }
                        />
                      </label>
                      <Accordion>
                        <AccordionItem value="details">
                          <AccordionTrigger>
                            编辑项目详情、动态视觉与多图展示
                          </AccordionTrigger>
                          <AccordionContent>
                            <ProjectDetailsEditor
                              project={p}
                              onChange={(details) =>
                                project(p.id, 'details', details)
                              }
                              onBusy={(value) =>
                                setUploading(value ? p.id : null)
                              }
                              onMessage={setMessage}
                              onError={setError}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </article>
                ))}
              </section>
            </TabsContent>
            <TabsContent value="about">
              <section className="cms-card cms-narrow">
                <h2>把故事说完整</h2>
                <p>介绍你的设计理念、经历和擅长的领域。</p>
                {textField('介绍标题（可换行）', 'aboutTitle', 150, true)}
                {textField('个人简介', 'aboutBody', 4000, true)}
                {textField('补充介绍', 'aboutExtra', 2000, true)}
                <label className="cms-field" htmlFor="profile-services">
                  <span>服务项目（一行一项，最多 10 项）</span>
                  <Textarea
                    id="profile-services"
                    rows={5}
                    value={content.services.join('\n')}
                    onChange={(e) =>
                      field('services', e.target.value.split('\n'))
                    }
                  />
                </label>
              </section>
            </TabsContent>
            <TabsContent value="resume">
              <ResumeEditor
                resume={content.resume ?? defaultResume}
                onChange={(resume) => field('resume', resume)}
                onBusy={(value) => setUploading(value ? 'resume' : null)}
                onMessage={setMessage}
                onError={setError}
              />
            </TabsContent>
            <TabsContent value="hero">
              <HeroSettings
                settings={content.hero}
                name={content.name}
                onChange={(hero) => field('hero', hero)}
                onBusy={(value) => setUploading(value ? 'hero' : null)}
                onMessage={setMessage}
                onError={setError}
              />
            </TabsContent>
          </fieldset>
        </Tabs>
        <footer className="cms-foot">
          <span>PORTFOLIO STUDIO</span>
          <span>更改保存后，刷新前台即可查看。</span>
        </footer>
      </div>
      <AlertDialog
        open={remove !== null}
        onOpenChange={(open) => {
          if (!open) setRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>移除这个作品？</AlertDialogTitle>
          <AlertDialogDescription>
            保存后会从网站中移除，原图片仍然保留。
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                field(
                  'projects',
                  content.projects.filter((p) => p.id !== remove),
                );
                setRemove(null);
              }}
            >
              移除作品
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
