import { chatGPTSignInPath } from '@/app/chatgpt-auth';
import { isAdmin, getAdminSession, isCloudflareHost, isNetlifyHost } from '@/lib/admin';
import { readContent } from '@/db';
import Editor from './editor';
import NetlifyLogin from './netlify-login';
import './admin.css';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '内容管理 · Portfolio',
  robots: { index: false, follow: false },
};
export default async function Admin() {
  const user = await getAdminSession();
  if(!user&&isNetlifyHost())return <NetlifyLogin/>;
  const standalone = isCloudflareHost();
  if (!user && standalone)
    return (
      <main className="cms cms-login">
        <span className="cms-kicker">PORTFOLIO / STUDIO</span>
        <h1>管理员专属入口</h1>
        <p>
          请使用已授权的 Cloudflare Access
          账号登录。若尚未配置访问权限，后台会保持关闭。
        </p>
        <a className="cms-primary" href="/cdn-cgi/access/logout">
          重新登录 →
        </a>
        <a href="/">返回作品集</a>
      </main>
    );
  if (!user)
    return (
      <main className="cms cms-login">
        <span className="cms-kicker">PORTFOLIO / STUDIO</span>
        <h1>让作品集保持新鲜。</h1>
        <p>登录后即可编辑文字、管理作品和调整首页动效。</p>
        <a
          className="cms-primary"
          href={chatGPTSignInPath('/admin')}
          target="_top"
        >
          {process.env.NODE_ENV === 'development'
            ? '进入本地管理后台 →'
            : '使用 ChatGPT 登录 →'}
        </a>
        <a href="/">返回作品集</a>
      </main>
    );
  if (!(await isAdmin()))
    return (
      <main className="cms cms-login">
        <h1>仅管理员可编辑</h1>
        <p>当前账号没有这个网站的管理权限。请使用已配置的管理员账号登录。</p>
        <a href="/signout-with-chatgpt?return_to=/admin">退出并切换账号</a>
      </main>
    );
  try {
    return (
      <Editor
        initial={await readContent()}
        logoutPath={
          isNetlifyHost()?'netlify':standalone
            ? '/cdn-cgi/access/logout'
            : '/signout-with-chatgpt?return_to=/admin'
        }
      />
    );
  } catch {
    return (
      <main className="cms cms-login">
        <h1>暂时无法读取内容</h1>
        <p>数据服务暂不可用，请稍后刷新重试。</p>
        <a href="/admin">重新加载</a>
      </main>
    );
  }
}
