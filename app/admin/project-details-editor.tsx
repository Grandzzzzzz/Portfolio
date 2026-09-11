'use client';
import { useState } from 'react';
import type { Project } from '@/lib/content';
import {
  getDetails,
  resolveStyle,
  type ProjectDetails,
} from '@/lib/project-details';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import ProjectVisual from '@/app/work/project-visual';
import { uploadMedia } from '@/lib/upload-media';
import '@/app/work/work.css';
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="cms-field">
      <span>{label}</span>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
      >
        <SelectTrigger aria-label={label} style={{ width: '100%', height: 44 }}>
          <SelectValue>{options[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export default function ProjectDetailsEditor({
  project,
  onChange,
  onBusy,
  onMessage,
  onError,
}: {
  project: Project;
  onChange: (d: ProjectDetails) => void;
  onBusy: (busy: boolean) => void;
  onMessage: (message: string) => void;
  onError: (message: string) => void;
}) {
  const d = getDetails(project),
    style = resolveStyle(d);
  const [pending, setPending] = useState(false),
    [remove, setRemove] = useState<string | null>(null);
  const update = (key: keyof ProjectDetails, value: unknown) =>
    onChange({ ...d, [key]: value });
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    if (d.gallery.length + list.length > 12) {
      onError('每个项目最多 12 个详情媒体');
      return;
    }
    if (list.some((file) => file.size > 50 * 1024 * 1024)) {
      onError('文件不能超过 50 MB');
      return;
    }
    setPending(true);
    onBusy(true);
    onError('');
    const gallery = [...d.gallery];
    try {
      for (const file of list) {
        const data = await uploadMedia(file);
        gallery.push({
          id: crypto.randomUUID(),
          image: data.url,
          mediaType: data.mediaType,
          caption: '',
          layout: 'wide',
        });
        onChange({ ...d, gallery: [...gallery] });
      }
      onMessage('详情媒体已上传，保存后会显示在项目页面。');
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : '上传失败；已成功的媒体已保留，请重试剩余文件。',
      );
    } finally {
      setPending(false);
      onBusy(false);
    }
  }
  const text = (
    key: 'client' | 'role' | 'duration' | 'challenge' | 'approach' | 'outcome',
    label: string,
    multi = false,
  ) => (
    <label className="cms-field">
      <span>{label}</span>
      {multi ? (
        <Textarea
          rows={4}
          maxLength={4000}
          value={d[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      ) : (
        <Input
          maxLength={key === 'duration' ? 100 : 150}
          value={d[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      )}
    </label>
  );
  return (
    <div className="cms-project-details">
      <div className="cms-row">
        <div>
          <h3>项目详情页</h3>
          <p>填入内容、选择视觉、上传图片或视频，即可复用同一套展示模板。</p>
        </div>
        <a
          href={`/work/${encodeURIComponent(project.id)}`}
          target="_blank"
          rel="noreferrer"
          className="cms-secondary"
        >
          查看已保存页面 ↗
        </a>
      </div>
      <div className="cms-pair">
        {text('client', '客户 / 项目类型')}
        {text('role', '负责的工作')}
      </div>
      {text('duration', '项目周期')}
      {text('challenge', '项目背景与挑战', true)}
      {text('approach', '设计过程与方法', true)}
      {text('outcome', '最终成果', true)}
      <p className="cms-note">没有填写的介绍和信息会自动隐藏。</p>
      <div className="cms-detail-style">
        <div>
          <Choice
            label="动态视觉"
            value={d.effect}
            options={{
              auto: '自动搭配',
              metal: '液态金属',
              contour: '流动等高线',
              orbit: '轨道线条',
              none: '静态纯色',
            }}
            onChange={(v) => update('effect', v)}
          />
          <Choice
            label="主题配色"
            value={d.palette}
            options={{
              auto: '自动搭配',
              indigo: '电光蓝',
              copper: '暖铜色',
              green: '森林绿',
              mono: '石墨灰',
            }}
            onChange={(v) => update('palette', v)}
          />
          <button
            className="cms-secondary"
            onClick={() =>
              onChange({
                ...d,
                effect: 'auto',
                palette: 'auto',
                seed: Math.floor(Math.random() * 1000000),
              })
            }
          >
            ↻ 换一组视觉
          </button>
        </div>
        <div
          className={`work-page palette-${style.palette} cms-detail-preview`}
        >
          <div className="work-visual-panel">
            <ProjectVisual effect={style.effect} seed={d.seed} />
            <div className="work-visual-type">
              FORM.
              <br />
              <i>FLOW.</i>
            </div>
          </div>
        </div>
      </div>
      <div className="cms-row">
        <div>
          <h3>过程与成果媒体 · {d.gallery.length}/12</h3>
          <p>支持一次选择多张图片或视频。全宽适合长图，半宽适合并排比较。</p>
        </div>
        <label className="cms-upload">
          {pending ? '上传中…' : '＋ 上传详情媒体'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
            multiple
            disabled={pending || d.gallery.length >= 12}
            aria-label={`${project.name}上传详情媒体`}
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <div className="cms-detail-gallery">
        {d.gallery.map((g, i) => (
          <div className="cms-detail-frame" key={g.id}>
            {g.mediaType === 'video' ? (
              <video src={g.image} muted loop autoPlay controls playsInline />
            ) : (
              <img src={g.image} alt={g.caption || `详情图片 ${i + 1}`} />
            )}
            <div className="cms-actions">
              <button
                disabled={i === 0}
                aria-label={`上移详情图片${i + 1}`}
                onClick={() => {
                  const items = [...d.gallery];
                  [items[i], items[i - 1]] = [items[i - 1], items[i]];
                  update('gallery', items);
                }}
              >
                ↑
              </button>
              <button
                disabled={i === d.gallery.length - 1}
                aria-label={`下移详情图片${i + 1}`}
                onClick={() => {
                  const items = [...d.gallery];
                  [items[i], items[i + 1]] = [items[i + 1], items[i]];
                  update('gallery', items);
                }}
              >
                ↓
              </button>
              <button onClick={() => setRemove(g.id)}>移除</button>
            </div>
            <label className="cms-field">
              <span>媒体说明</span>
              <Input
                maxLength={300}
                value={g.caption}
                onChange={(e) =>
                  update(
                    'gallery',
                    d.gallery.map((x) =>
                      x.id === g.id ? { ...x, caption: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <Choice
              label={`媒体 ${i + 1} 的排版`}
              value={g.layout}
              options={{ wide: '全宽展示', half: '半宽并排' }}
              onChange={(v) =>
                update(
                  'gallery',
                  d.gallery.map((x) =>
                    x.id === g.id ? { ...x, layout: v } : x,
                  ),
                )
              }
            />
          </div>
        ))}
      </div>
      <AlertDialog
        open={remove !== null}
        onOpenChange={(open) => {
          if (!open) setRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>移除这个详情媒体？</AlertDialogTitle>
          <AlertDialogDescription>
            保存后将不再展示这个媒体。
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                update(
                  'gallery',
                  d.gallery.filter((g) => g.id !== remove),
                );
                setRemove(null);
              }}
            >
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
