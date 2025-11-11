import { Command } from 'commander';
import { registerAutoLabelCommand } from './commands/auto-label';
import { registerDocSyncCommand } from './commands/doc-sync';
import { registerGoTestsCommand } from './commands/go-tests';
import { registerReleaseCommand } from './commands/release';
import { registerReviewCommand } from './commands/review';

export const createProgram = () => {
  const program = new Command();
  program
    .name('codex-workflows')
    .description('Unified Codex workflow CLI for GitHub Actions and local use.')
    .version(process.env.npm_package_version ?? '0.0.0');

  registerReviewCommand(program);
  registerGoTestsCommand(program);
  registerReleaseCommand(program);
  registerAutoLabelCommand(program);
  registerDocSyncCommand(program);

  return program;
};
