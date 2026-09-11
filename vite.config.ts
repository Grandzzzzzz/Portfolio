import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import hostingConfig from './.openai/hosting.json';
import {fileURLToPath} from 'node:url';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: 'vinext/server/fetch-handler',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
};

export default defineConfig(async () => {
  const netlify = process.env.PORTFOLIO_DEPLOY_TARGET === 'netlify';
  if(netlify){
    const {nitro}=await import('nitro/vite');
    return {resolve:{alias:[{find:/^@\/db$/,replacement:fileURLToPath(new URL('./db/netlify.ts',import.meta.url))},...Object.entries({'tailwindcss':'./node_modules/tailwindcss/index.css','tw-animate-css':'./node_modules/tw-animate-css/dist/tw-animate.css','shadcn/tailwind.css':'./node_modules/shadcn/dist/tailwind.css'}).map(([find,path])=>({find,replacement:fileURLToPath(new URL(path,import.meta.url))}))]},css:{postcss:{plugins:[tailwindcss()]}},plugins:[{name:'portfolio-netlify-storage',enforce:'pre' as const,load(id:string){if(id===fileURLToPath(new URL('./db/index.ts',import.meta.url)))return "export * from './netlify';"}},vinext(),nitro()]};
  }
  const vercel = process.env.PORTFOLIO_DEPLOY_TARGET === 'vercel';
  if(vercel){
    return {resolve:{alias:[{find:/^@\/db$/,replacement:fileURLToPath(new URL('./db/vercel.ts',import.meta.url))},...Object.entries({'tailwindcss':'./node_modules/tailwindcss/index.css','tw-animate-css':'./node_modules/tw-animate-css/dist/tw-animate.css','shadcn/tailwind.css':'./node_modules/shadcn/dist/tailwind.css'}).map(([find,path])=>({find,replacement:fileURLToPath(new URL(path,import.meta.url))}))]},css:{postcss:{plugins:[tailwindcss()]}},plugins:[{name:'portfolio-vercel-storage',enforce:'pre' as const,load(id:string){if(id===fileURLToPath(new URL('./db/index.ts',import.meta.url)))return "export * from './vercel';";}},vinext(),(await import('nitro/vite')).nitro()]};
  }
  const standalone = process.env.PORTFOLIO_DEPLOY_TARGET === 'cloudflare';
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      ...(!standalone ? [sites()] : []),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        ...(standalone
          ? { configPath: './wrangler.cloudflare.json' }
          : { config: localBindingConfig }),
      }),
    ],
  };
});
