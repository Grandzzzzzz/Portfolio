'use client';
import {uploadMedia} from '@/lib/upload-media';
import type { Content } from '@/lib/content';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import HeroVisual, { defaultBase, defaultReveal } from '../hero-visual';
import MotionFrame from '../motion-frame';
import '../immersive.css';

type Hero = Content['hero'];
type Props = {
  settings: Hero;
  name: string;
  onChange: (settings: Hero) => void;
  onBusy: (busy: boolean) => void;
  onMessage: (message: string) => void;
  onError: (message: string) => void;
};
export default function HeroSettings({
  settings,
  name,
  onChange,
  onBusy,
  onMessage,
  onError,
}: Props) {
  const mode = settings.mode ?? 'spotlight';
  const update = (patch: Partial<Hero>) => onChange({ ...settings, ...patch });
  const sliders =
    mode === 'spotlight'
      ? [
          {
            key: 'speed',
            label: '自动探索速度',
            min: 0.1,
            max: 2,
            step: 0.1,
            value: settings.speed,
            unit: '×',
          },
          {
            key: 'radius',
            label: '光斑半径',
            min: 120,
            max: 420,
            step: 10,
            value: settings.radius ?? 260,
            unit: 'px',
          },
          {
            key: 'follow',
            label: '鼠标跟随灵敏度',
            min: 0.02,
            max: 0.2,
            step: 0.005,
            value: settings.follow ?? 0.075,
            unit: '',
          },
          {
            key: 'shade',
            label: '背景暗度',
            min: 0.15,
            max: 0.65,
            step: 0.01,
            value: settings.shade ?? 0.35,
            unit: '%',
          },
        ]
      : [
          {
            key: 'speed',
            label: '流动速度',
            min: 0.1,
            max: 2,
            step: 0.1,
            value: settings.speed,
            unit: '×',
          },
          {
            key: 'color',
            label: '金属色彩强度',
            min: 0,
            max: 1,
            step: 0.01,
            value: settings.color,
            unit: '%',
          },
          {
            key: 'texture',
            label: '颗粒纹理',
            min: 0,
            max: 0.1,
            step: 0.001,
            value: settings.texture,
            unit: '',
          },
        ];
  async function upload(key: 'baseImage' | 'revealImage', file?: File) {
    if (!file) return;
    onError('');
    if (file.size > 8 * 1024 * 1024) {
      onError('请选择 8 MB 以内的图片');
      return;
    }
    onBusy(true);
    try {
      const data=await uploadMedia(file);
      update({ [key]: data.url });
      onMessage('背景图片已上传，保存后应用到首页。');
    } catch (e) {
      onError(e instanceof Error ? e.message : '上传失败，请重试');
    } finally {
      onBusy(false);
    }
  }
  return (
    <div className="cms-grid">
      <section className="cms-card">
        <h2>调出你的视觉个性</h2>
        <p>选择首页氛围，移动鼠标即可体验预览。保存后应用到网站。</p>
        <div className="cms-field">
          <span id="hero-mode-label">首页视觉</span>
          <Select
            value={mode}
            onValueChange={(v) => {
              if (v === 'spotlight' || v === 'metal') update({ mode: v });
            }}
          >
            <SelectTrigger aria-labelledby="hero-mode-label">
              <SelectValue>
                {mode === 'spotlight' ? '沉浸式光斑探索' : '液态金属'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spotlight">沉浸式光斑探索</SelectItem>
              <SelectItem value="metal">液态金属</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="cms-toggle" htmlFor="hero-motion-enabled">
          <span>启用网站动态视觉</span>
          <Switch
            id="hero-motion-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => update({ enabled })}
          />
        </label>
        {sliders.map((s) => (
          <div className="cms-slider" key={s.key}>
            <div>
              <span id={`hero-${s.key}`}>{s.label}</span>
              <output>
                {s.unit === '%'
                  ? Math.round(s.value * 100)
                  : Number(s.value.toFixed(3))}
                {s.unit}
              </output>
            </div>
            <Slider
              aria-labelledby={`hero-${s.key}`}
              value={[s.value]}
              min={s.min}
              max={s.max}
              step={s.step}
              onValueChange={(v) =>
                update({ [s.key]: Array.isArray(v) ? v[0] : v })
              }
            />
          </div>
        ))}
        {mode === 'spotlight' && (
          <div className="cms-hero-images">
            <h3>两层背景</h3>
            <p className="cms-note">
              底图营造氛围，光斑揭示第二张图。建议使用构图一致、明暗或材质不同的横向图片。
            </p>
            <div className="cms-pair">
              {(['baseImage', 'revealImage'] as const).map((key, i) => (
                <div key={key}>
                  <img
                    src={
                      settings[key] || (i === 0 ? defaultBase : defaultReveal)
                    }
                    alt={i === 0 ? '底层背景预览' : '光斑图层预览'}
                  />
                  <label className="cms-upload">
                    {i === 0 ? '↑ 更换底图' : '↑ 更换光斑图层'}
                    <input
                      aria-label={i === 0 ? '上传底层背景' : '上传光斑图层'}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        void upload(key, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
            <p className="cms-note">JPG / PNG / WebP · 每张最大 8 MB</p>
            <button
              className="cms-secondary"
              onClick={() =>
                update({ baseImage: defaultBase, revealImage: defaultReveal })
              }
            >
              恢复参考背景
            </button>
          </div>
        )}
        <p className="cms-note">
          关闭后保留静态画面。手机端自动探索，网站也会遵循访客的“减少动态效果”偏好。
        </p>
      </section>
      <aside className="cms-hero-aside">
        <MotionFrame enabled={settings.enabled} showControl={false}>
          <div className="cms-hero-preview">
            <HeroVisual settings={settings} />
            <span className="cms-kicker">
              LIVE PREVIEW /{' '}
              {mode === 'spotlight' ? 'SPOTLIGHT' : 'LIQUID METAL'}
            </span>
            <div>
              <em>Ideas in motion.</em>
              <strong>{name}</strong>
            </div>
            <span>移动鼠标，探索光影与材质</span>
          </div>
        </MotionFrame>
      </aside>
    </div>
  );
}
