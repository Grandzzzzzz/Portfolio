import { execFileSync } from 'node:child_process';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] }).trim();
}

const status = git('status', '--short');
if (!status) {
  console.log('没有待同步的本地修改。');
  process.exit(0);
}

git('add', '-A');
const staged = git('diff', '--cached', '--name-only');
if (!staged) {
  console.log('没有可提交的文件。');
  process.exit(0);
}

const message = process.argv.slice(2).join(' ') || 'Update portfolio website';
git('commit', '-m', message);
git('push');
console.log(`已同步到 GitHub：${message}`);