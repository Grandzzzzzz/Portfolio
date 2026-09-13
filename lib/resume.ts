export type ResumeEntry = {
  id: string;
  kind: 'experience' | 'education' | 'award';
  period: string;
  title: string;
  organization: string;
  description: string;
};
export type ResumeImage = {
  id: string;
  image: string;
  caption: string;
  layout: 'wide' | 'half';
};
export type ResumeLogo = { id: string; name: string; image: string };
export type ResumeContact = {
  enabled: boolean;
  value: string;
};
export type ResumeSocial = {
  id: string;
  platform: 'instagram' | 'linkedin' | 'steam';
  label: string;
  url: string;
  enabled: boolean;
};
export type Resume = {
  enabled: boolean;
  title: string;
  intro: string;
  entries: ResumeEntry[];
  images: ResumeImage[];
  logos: ResumeLogo[];
  logoTitle: string;
  logoSpeed: number;
  contacts: {
    wechat: ResumeContact;
    email: ResumeContact;
    phone: ResumeContact;
  };
  socials: ResumeSocial[];
};
// Sample content is explicitly labelled; an existing portfolio needs no migration.
export const defaultResume: Resume = {
  enabled: true,
  title: 'The story\nso far.',
  intro:
    '每一段经历，都在塑造我看待设计的方式。这里将记录我的工作、学习与探索。以下为排版示例，可在后台替换为真实简历。',
  entries: [
    {
      id: 'resume-1',
      kind: 'experience',
      period: '2024 — PRESENT',
      title: 'Product Designer · 示例职位',
      organization: '示例设计工作室',
      description:
        '参与数字产品从概念到落地的设计，关注用户体验、视觉表达与细节。此处可填写职责与代表性成果。',
    },
    {
      id: 'resume-2',
      kind: 'experience',
      period: '2022 — 2024',
      title: 'Visual Designer · 示例职位',
      organization: '示例创意团队',
      description:
        '探索品牌与数字界面的视觉语言。此处可介绍项目方向、协作方式以及你的贡献。',
    },
    {
      id: 'resume-3',
      kind: 'education',
      period: '2018 — 2022',
      title: 'Design Studies · 示例教育经历',
      organization: '院校名称 / 专业',
      description: '在这里介绍学习方向、毕业项目或研究兴趣。',
    },
  ],
  images: [],
  logoTitle: 'LOGO STUDIES / 示例标识',
  logoSpeed: 35,
  contacts: {
    wechat: { enabled: false, value: '' },
    email: { enabled: true, value: 'Grandcanmakeit@outlook.com' },
    phone: { enabled: false, value: '' },
  },
  socials: [
    { id: 'social-instagram', platform: 'instagram', label: 'Instagram', url: '', enabled: false },
    { id: 'social-linkedin', platform: 'linkedin', label: 'LinkedIn', url: '', enabled: false },
    { id: 'social-steam', platform: 'steam', label: 'Steam', url: '', enabled: false },
  ],
  logos: ['FORMA', 'STILL', 'MONO', 'FIELD', 'ARC', 'KIN'].map((name, i) => ({
    id: `logo-${i + 1}`,
    name,
    image: '',
  })),
};
export const resumeKinds = {
  experience: 'EXPERIENCE',
  education: 'EDUCATION',
  award: 'RECOGNITION',
};
export function validateResume(value: unknown): Resume {
  if (!value || typeof value !== 'object') throw Error('简历内容格式不正确');
  const r = value as Resume;
  const text = (v: unknown, max: number, required = false) => {
    if (typeof v !== 'string' || v.length > max || (required && !v.trim()))
      throw Error('请检查简历文字及长度');
    return v;
  };
  const items = (v: unknown, max: number) => {
    if (!Array.isArray(v) || v.length > max)
      throw Error(`简历列表最多 ${max} 项`);
    const ids = new Set();
    for (const item of v) {
      if (
        !item ||
        typeof item.id !== 'string' ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) ||
        ids.has(item.id)
      )
        throw Error('简历条目编号无效');
      ids.add(item.id);
    }
  };
  const image = (v: unknown, optional = false) => {
    text(v, 200);
    if (optional && v === '') return '';
    if (
      typeof v !== 'string' ||
      !/^\/(images\/[a-zA-Z0-9._-]+|api\/media\/[a-f0-9-]{36})$/.test(v)
    )
      throw Error('请使用上传的简历图片');
    return v;
  };
  if (typeof r.enabled !== 'boolean') throw Error('简历显示设置不正确');
  text(r.title, 150, true);
  text(r.intro, 5000);
  text(r.logoTitle, 150);
  if (!Number.isFinite(r.logoSpeed) || r.logoSpeed < 20 || r.logoSpeed > 90)
    throw Error('Logo 滚动周期应为 20–90 秒');
  items(r.entries, 20);
  items(r.images, 6);
  items(r.logos, 20);
  const contact = (value: unknown, enabledByDefault = false) => {
    if (!value || typeof value !== 'object') return { enabled: enabledByDefault, value: '' };
    const item = value as { enabled?: unknown; value?: unknown };
    return {
      enabled: item.enabled === true || (item.enabled === undefined && enabledByDefault),
      value: text(typeof item.value === 'string' ? item.value : '', 200),
    };
  };
  const socials = Array.isArray(r.socials) ? r.socials : defaultResume.socials;
  return {
    enabled: r.enabled,
    title: r.title,
    intro: r.intro,
    logoTitle: r.logoTitle,
    logoSpeed: r.logoSpeed,
    contacts: {
      wechat: contact(r.contacts?.wechat),
      email: contact(r.contacts?.email, true),
      phone: contact(r.contacts?.phone),
    },
    socials: socials.slice(0, 12).map((s, index) => {
      if (!s || typeof s !== 'object') throw Error('社交平台配置无效');
      const social = s as Partial<ResumeSocial>;
      if (!['instagram', 'linkedin', 'steam'].includes(String(social.platform)))
        throw Error('社交平台类型无效');
      if (typeof social.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(social.id))
        throw Error('社交平台编号无效');
      return {
        id: social.id,
        platform: social.platform as ResumeSocial['platform'],
        label: text(typeof social.label === 'string' ? social.label : `Social ${index + 1}`, 80, true),
        url: text(typeof social.url === 'string' ? social.url : '', 500),
        enabled: social.enabled === true,
      };
    }),
    entries: r.entries.map((e) => {
      if (!['experience', 'education', 'award'].includes(e.kind))
        throw Error('简历经历类型无效');
      return {
        id: e.id,
        kind: e.kind,
        period: text(e.period, 80),
        title: text(e.title, 150, true),
        organization: text(e.organization, 150),
        description: text(e.description, 3000),
      };
    }),
    images: r.images.map((i) => {
      if (!['wide', 'half'].includes(i.layout)) throw Error('简历图片排版无效');
      return {
        id: i.id,
        image: image(i.image),
        caption: text(i.caption, 300),
        layout: i.layout,
      };
    }),
    logos: r.logos.map((l) => ({
      id: l.id,
      name: text(l.name, 80, true),
      image: image(l.image, true),
    })),
  };
}
