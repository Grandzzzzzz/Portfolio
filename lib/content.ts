import { validateDetails, type ProjectDetails } from './project-details';
import { validateResume, type Resume } from './resume';
export type Project = {
  id: string;
  name: string;
  category: string;
  year: string;
  image: string;
  mediaType?: 'image' | 'video';
  description: string;
  details?: ProjectDetails;
};
export type Content = {
  name: string;
  role: string;
  location: string;
  tagline: string;
  email: string;
  available: boolean;
  aboutTitle: string;
  aboutBody: string;
  aboutExtra: string;
  services: string[];
  hero: {
    enabled: boolean;
    speed: number;
    color: number;
    texture: number;
    mode?: 'spotlight' | 'metal';
    radius?: number;
    follow?: number;
    shade?: number;
    baseImage?: string;
    revealImage?: string;
  };
  projects: Project[];
  resume?: Resume;
};
export const defaultContent: Content = {
  name: 'NOVA',
  role: 'Independent designer & art director',
  location: 'Shanghai, China',
  tagline: 'Ideas into identities.\nThoughts into experiences.',
  email: 'hello@example.com',
  available: true,
  aboutTitle: 'I make things\nmean something.',
  aboutBody:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. I work at the intersection of visual identities and digital experiences, turning a little curiosity into something unexpected.',
  aboutExtra:
    'Based somewhere between a good idea and its next iteration. Open to thoughtful collaborations, new perspectives, and ambitious little things.',
  services: [
    'Art direction',
    'Brand identity',
    'Digital experiences',
    'Editorial design',
  ],
  hero: { enabled: true, speed: 1, color: 0.53, texture: 0.033 },
  projects: ['Forma Studio', 'Between Spaces', 'Objects of Tomorrow'].map(
    (name, i) => ({
      id: `project-${i + 1}`,
      name,
      category: [
        'Art direction / Identity',
        'Editorial / Digital',
        'Branding / Strategy',
      ][i],
      year: i === 0 ? '2026' : '2025',
      image: `/images/work-0${i + 1}.png`,
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. A study in form, feeling, and the spaces in between.',
    }),
  ),
};
export function validateContent(value: unknown): Content {
  if (!value || typeof value !== 'object') throw Error('内容格式不正确');
  const c = value as Content;
  const text = (v: unknown, max: number, required = true) => {
    if (typeof v !== 'string' || v.length > max || (required && !v.trim()))
      throw Error('请检查必填文字及长度');
    return v;
  };
  text(c.name, 40);
  text(c.role, 150);
  text(c.location, 100);
  text(c.tagline, 250);
  text(c.email, 150);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))
    throw Error('请输入有效邮箱');
  text(c.aboutTitle, 150);
  text(c.aboutBody, 4000);
  text(c.aboutExtra, 2000, false);
  if (
    typeof c.available !== 'boolean' ||
    !c.hero ||
    typeof c.hero.enabled !== 'boolean'
  )
    throw Error('开关设置不正确');
  for (const [key, min, max] of [
    ['speed', 0.1, 2],
    ['color', 0, 1],
    ['texture', 0, 0.1],
  ] as const) {
    const v = c.hero[key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)
      throw Error('动效数值超出范围');
  }
  if (
    c.hero.mode !== undefined &&
    !['spotlight', 'metal'].includes(c.hero.mode)
  )
    throw Error('请选择有效的首页效果');
  for (const [key, min, max] of [
    ['radius', 120, 420],
    ['follow', 0.02, 0.2],
    ['shade', 0.15, 0.65],
  ] as const) {
    const v = c.hero[key];
    if (
      v !== undefined &&
      (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)
    )
      throw Error('首页视觉设置超出范围');
  }
  for (const key of ['baseImage', 'revealImage'] as const) {
    const v = c.hero[key];
    if (
      v !== undefined &&
      (typeof v !== 'string' ||
        v.length > 200 ||
        !/^\/(images\/(?:immersive\/)?[a-zA-Z0-9._-]+|api\/media\/[a-f0-9-]+)$/.test(
          v,
        ))
    )
      throw Error('请上传有效的首页图片');
  }
  if (!Array.isArray(c.services) || c.services.length > 10)
    throw Error('最多添加 10 项服务');
  c.services.forEach((s) => text(s, 100));
  if (!Array.isArray(c.projects) || c.projects.length > 30)
    throw Error('最多添加 30 个作品');
  const ids = new Set<string>();
  c.projects.forEach((p) => {
    text(p.id, 80);
    if (!/^[a-zA-Z0-9-]+$/.test(p.id) || ids.has(p.id))
      throw Error('作品编号重复或无效');
    ids.add(p.id);
    text(p.name, 100);
    text(p.category, 150);
    text(p.year, 20);
    text(p.description, 3000, false);
    text(p.image, 200);
    if (!/^\/(images\/[a-zA-Z0-9._-]+|api\/media\/[a-f0-9-]+)$/.test(p.image))
      throw Error('请使用上传的图片或视频');
    if (p.mediaType !== undefined && !['image', 'video'].includes(p.mediaType))
      throw Error('作品媒体类型无效');
  });
  return {
    name: c.name,
    role: c.role,
    location: c.location,
    tagline: c.tagline,
    email: c.email,
    available: c.available,
    aboutTitle: c.aboutTitle,
    aboutBody: c.aboutBody,
    aboutExtra: c.aboutExtra,
    services: c.services,
    hero: { ...c.hero },
    ...(c.resume === undefined ? {} : { resume: validateResume(c.resume) }),
    projects: c.projects.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      year: p.year,
      image: p.image,
      ...(p.mediaType === undefined ? {} : { mediaType: p.mediaType }),
      description: p.description,
      ...(p.details === undefined
        ? {}
        : { details: validateDetails(p.details) }),
    })),
  };
}
