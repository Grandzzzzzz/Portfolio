'use client';
import {uploadMedia} from '@/lib/upload-media';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Resume, ResumeEntry } from '@/lib/resume';

type Props = {
  resume: Resume;
  onChange: (resume: Resume) => void;
  onBusy: (busy: boolean) => void;
  onMessage: (message: string) => void;
  onError: (error: string) => void;
};
const kinds = {
  experience: '工作 / 项目经历',
  education: '教育背景',
  award: '奖项 / 认证',
};
export default function ResumeEditor({
  resume: r,
  onChange,
  onBusy,
  onMessage,
  onError,
}: Props) {
  const patch = (value: Partial<Resume>) => onChange({ ...r, ...value });
  const entry = (id: string, value: Partial<ResumeEntry>) =>
    patch({
      entries: r.entries.map((e) => (e.id === id ? { ...e, ...value } : e)),
    });
  function reorder(
    key: 'entries' | 'images' | 'logos',
    i: number,
    step: number,
  ) {
    const list = [...r[key]];
    [list[i], list[i + step]] = [list[i + step], list[i]];
    onChange({ ...r, [key]: list });
  }
  function actions(
    key: 'entries' | 'images' | 'logos',
    i: number,
    name: string,
  ) {
    return (
      <div className="cms-actions">
        <button
          type="button"
          aria-label={`上移${name}`}
          disabled={i === 0}
          onClick={() => reorder(key, i, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          aria-label={`下移${name}`}
          disabled={i === r[key].length - 1}
          onClick={() => reorder(key, i, 1)}
        >
          ↓
        </button>
        <button
          type="button"
          aria-label={`移除${name}`}
          onClick={() =>
            onChange({ ...r, [key]: r[key].filter((_, index) => index !== i) })
          }
        >
          移除
        </button>
      </div>
    );
  }
  async function upload(
    kind: 'images' | 'logos',
    id: string | null,
    file?: File,
  ) {
    if (!file) return;
    onError('');
    if (file.size > 8 * 1024 * 1024) {
      onError('请选择 8 MB 以内的图片');
      return;
    }
    onBusy(true);
    try {
      const data=await uploadMedia(file);
      if (kind === 'images')
        patch({
          images: id
            ? r.images.map((i) => (i.id === id ? { ...i, image: data.url } : i))
            : [
                ...r.images,
                {
                  id: crypto.randomUUID(),
                  image: data.url,
                  caption: '',
                  layout: 'half',
                },
              ],
        });
      else
        patch({
          logos: r.logos.map((l) =>
            l.id === id ? { ...l, image: data.url } : l,
          ),
        });
      onMessage('图片已上传，保存后应用到简历区域。');
    } catch (e) {
      onError(e instanceof Error ? e.message : '上传失败，请重试');
    } finally {
      onBusy(false);
    }
  }
  const fileInput = (
    kind: 'images' | 'logos',
    id: string | null,
    label: string,
  ) => (
    <label className="cms-upload">
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={label}
        onChange={(e) => {
          void upload(kind, id, e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </label>
  );
  return (
    <div className="cms-resume-editor">
      <section className="cms-card">
        <h2>简历 / 我的旅程</h2>
        <p>
          位于首页“关于我”之后。经历逐条随滚动展开，图片完整展示，Logo
          在底部循环滚动。
        </p>
        <label className="cms-toggle" htmlFor="resume-enabled">
          <span>在首页显示简历区域</span>
          <Switch
            id="resume-enabled"
            checked={r.enabled}
            onCheckedChange={(enabled) => patch({ enabled })}
          />
        </label>
        <div className="cms-pair">
          <label className="cms-field" htmlFor="resume-heading">
            <span>区域标题（可换行）</span>
            <Textarea
              id="resume-heading"
              maxLength={150}
              rows={3}
              value={r.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>
          <label className="cms-field" htmlFor="resume-introduction">
            <span>简历简介（最多 5000 字）</span>
            <Textarea
              id="resume-introduction"
              maxLength={5000}
              rows={3}
              value={r.intro}
              onChange={(e) => patch({ intro: e.target.value })}
            />
          </label>
        </div>
        <p className="cms-note">
          当前预置内容均为示例。替换为你的真实信息后，点击顶部“保存并应用”。移除条目也会在保存后生效。
        </p>
      </section>
      <section className="cms-card">
        <div className="cms-row">
          <div>
            <h2>经历时间线</h2>
            <p>支持工作、项目、教育、奖项，按这里的顺序展示。</p>
          </div>
          <button
            type="button"
            className="cms-secondary"
            disabled={r.entries.length >= 20}
            onClick={() =>
              patch({
                entries: [
                  ...r.entries,
                  {
                    id: crypto.randomUUID(),
                    kind: 'experience',
                    period: '',
                    title: '新经历',
                    organization: '',
                    description: '',
                  },
                ],
              })
            }
          >
            ＋ 添加经历
          </button>
        </div>
        {r.entries.length === 0 && (
          <p className="cms-empty">添加你的第一段经历。</p>
        )}
        {r.entries.map((e, i) => (
          <article className="cms-resume-entry" key={e.id}>
            <div className="cms-row">
              <span className="cms-kicker">
                ENTRY {String(i + 1).padStart(2, '0')}
              </span>
              {actions('entries', i, e.title)}
            </div>
            <div className="cms-pair">
              <div className="cms-field">
                <span id={`kind-${e.id}`}>经历类型</span>
                <Select
                  value={e.kind}
                  onValueChange={(kind) => {
                    if (
                      kind === 'experience' ||
                      kind === 'education' ||
                      kind === 'award'
                    )
                      entry(e.id, { kind });
                  }}
                >
                  <SelectTrigger aria-labelledby={`kind-${e.id}`}>
                    <SelectValue>{kinds[e.kind]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(kinds).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="cms-field" htmlFor={`period-${e.id}`}>
                <span>时间</span>
                <Input
                  id={`period-${e.id}`}
                  maxLength={80}
                  placeholder="2024 — 至今"
                  value={e.period}
                  onChange={(v) => entry(e.id, { period: v.target.value })}
                />
              </label>
            </div>
            <div className="cms-pair">
              <label className="cms-field" htmlFor={`title-${e.id}`}>
                <span>职位 / 专业 / 奖项</span>
                <Input
                  id={`title-${e.id}`}
                  maxLength={150}
                  value={e.title}
                  onChange={(v) => entry(e.id, { title: v.target.value })}
                />
              </label>
              <label className="cms-field" htmlFor={`org-${e.id}`}>
                <span>公司 / 院校 / 机构</span>
                <Input
                  id={`org-${e.id}`}
                  maxLength={150}
                  value={e.organization}
                  onChange={(v) =>
                    entry(e.id, { organization: v.target.value })
                  }
                />
              </label>
            </div>
            <label className="cms-field" htmlFor={`desc-${e.id}`}>
              <span>经历说明 / 成果（最多 3000 字）</span>
              <Textarea
                id={`desc-${e.id}`}
                rows={3}
                maxLength={3000}
                value={e.description}
                onChange={(v) => entry(e.id, { description: v.target.value })}
              />
            </label>
          </article>
        ))}
      </section>
      <section className="cms-card">
        <h2>简历图片</h2>
        <p>
          可上传个人照片、证书或简历长图。支持通栏与双列排版，保留完整图片，手机端自动单列。
        </p>
        {r.images.length < 6 &&
          fileInput('images', null, '↑ 添加图片（最多 6 张）')}
        <p className="cms-note">JPG / PNG / WebP · 每张最大 8 MB</p>
        <div className="cms-resume-media-grid">
          {r.images.map((photo, i) => (
            <article className="cms-resume-media" key={photo.id}>
              <img
                src={photo.image}
                alt={photo.caption || `简历图片 ${i + 1}`}
              />
              {actions('images', i, `图片 ${i + 1}`)}
              {fileInput('images', photo.id, `更换图片 ${i + 1}`)}
              <label className="cms-field" htmlFor={`caption-${photo.id}`}>
                <span>图片说明 / 替代文本</span>
                <Textarea
                  id={`caption-${photo.id}`}
                  rows={2}
                  maxLength={300}
                  value={photo.caption}
                  onChange={(e) =>
                    patch({
                      images: r.images.map((p) =>
                        p.id === photo.id
                          ? { ...p, caption: e.target.value }
                          : p,
                      ),
                    })
                  }
                />
              </label>
              <div className="cms-field">
                <span id={`layout-${photo.id}`}>桌面排版</span>
                <Select
                  value={photo.layout}
                  onValueChange={(layout) => {
                    if (layout === 'wide' || layout === 'half')
                      patch({
                        images: r.images.map((p) =>
                          p.id === photo.id ? { ...p, layout } : p,
                        ),
                      });
                  }}
                >
                  <SelectTrigger aria-labelledby={`layout-${photo.id}`}>
                    <SelectValue>
                      {photo.layout === 'wide' ? '通栏大图' : '双列图片'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wide">通栏大图</SelectItem>
                    <SelectItem value="half">双列图片</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="cms-card">
        <div className="cms-row">
          <div>
            <h2>Logo 滚动栏</h2>
            <p>
              上传透明背景 PNG / WebP
              效果更佳。未上传图片时，以名称生成文字标识。清空列表即可隐藏滚动栏。
            </p>
          </div>
          <button
            type="button"
            className="cms-secondary"
            disabled={r.logos.length >= 20}
            onClick={() =>
              patch({
                logos: [
                  ...r.logos,
                  { id: crypto.randomUUID(), name: 'NEW LOGO', image: '' },
                ],
              })
            }
          >
            ＋ 添加 Logo
          </button>
        </div>
        <label className="cms-field" htmlFor="resume-logo-title">
          <span>滚动栏标题</span>
          <Input
            id="resume-logo-title"
            value={r.logoTitle}
            maxLength={150}
            onChange={(e) => patch({ logoTitle: e.target.value })}
          />
        </label>
        <div className="cms-slider">
          <div>
            <span id="logo-speed-label">滚动一轮的时长（越大越慢）</span>
            <output>{r.logoSpeed} 秒</output>
          </div>
          <Slider
            aria-labelledby="logo-speed-label"
            min={20}
            max={90}
            step={5}
            value={[r.logoSpeed]}
            onValueChange={(v) =>
              patch({ logoSpeed: Array.isArray(v) ? v[0] : v })
            }
          />
        </div>
        <div className="cms-resume-media-grid">
          {r.logos.map((logo, i) => (
            <article className="cms-resume-media cms-resume-logo" key={logo.id}>
              <div className="cms-logo-preview">
                {logo.image ? (
                  <img src={logo.image} alt={logo.name} />
                ) : (
                  <span>{logo.name}</span>
                )}
              </div>
              {actions('logos', i, logo.name)}
              <label className="cms-field" htmlFor={`logo-${logo.id}`}>
                <span>Logo 名称 / 替代文本</span>
                <Input
                  id={`logo-${logo.id}`}
                  maxLength={80}
                  value={logo.name}
                  onChange={(e) =>
                    patch({
                      logos: r.logos.map((l) =>
                        l.id === logo.id ? { ...l, name: e.target.value } : l,
                      ),
                    })
                  }
                />
              </label>
              {fileInput('logos', logo.id, `上传 / 更换 ${logo.name} 图片`)}
              {logo.image && (
                <button
                  type="button"
                  className="cms-secondary"
                  onClick={() =>
                    patch({
                      logos: r.logos.map((l) =>
                        l.id === logo.id ? { ...l, image: '' } : l,
                      ),
                    })
                  }
                >
                  使用文字标识
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
