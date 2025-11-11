import { runCommand } from './exec';

export const listChangedFiles = async (options: {
  baseRef?: string;
  headRef?: string;
  cwd?: string;
}) => {
  const args = ['diff', '--name-only'];
  if (options.baseRef) {
    args.push(options.baseRef);
  }
  if (options.headRef) {
    args.push(options.headRef);
  }
  const { stdout } = await runCommand({
    command: 'git',
    args,
    cwd: options.cwd,
    silent: true
  });
  return stdout.split('\n').map((line: string) => line.trim()).filter(Boolean);
};

export const commitAll = async (message: string, cwd?: string) => {
  await runCommand({ command: 'git', args: ['add', '--all'], cwd });
  await runCommand({ command: 'git', args: ['commit', '-m', message], cwd });
};

export const pushChanges = async (options: {
  remote?: string;
  ref?: string;
  cwd?: string;
  forceWithLease?: boolean;
}) => {
  const remote = options.remote ?? 'origin';
  const ref = options.ref ?? 'HEAD';
  const args = ['push'];
  if (options.forceWithLease) {
    args.push('--force-with-lease');
  }
  args.push(remote, ref);
  await runCommand({ command: 'git', args, cwd: options.cwd });
};

export const ensureGitUser = async (options?: { name?: string; email?: string; cwd?: string }) => {
  const name = options?.name ?? 'github-actions[bot]';
  const email = options?.email ?? 'github-actions[bot]@users.noreply.github.com';
  await runCommand({ command: 'git', args: ['config', 'user.name', name], cwd: options?.cwd });
  await runCommand({ command: 'git', args: ['config', 'user.email', email], cwd: options?.cwd });
};

export const getHeadSha = async (cwd?: string) => {
  const { stdout } = await runCommand({ command: 'git', args: ['rev-parse', 'HEAD'], cwd, silent: true });
  return stdout.trim();
};
