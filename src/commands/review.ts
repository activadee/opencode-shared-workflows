import { Command } from 'commander';
import path from 'node:path';
import stringArgv from 'string-argv';
import { CodexClient } from '../lib/codex';
import { loadActionContext, readEventPayload } from '../lib/context';
import {
  createReview,
  fetchPullRequest,
  listPullRequestFiles,
  requirePullRequestNumber,
  type PullRequestEventPayload
} from '../lib/github';
import { logger } from '../lib/logger';

interface ReviewOptions {
  prompt: string;
  promptExtra?: string;
  model?: string;
  effort?: string;
  codexArgs?: string;
  codexBin?: string;
  dryRun?: boolean;
  eventPath?: string;
  pullNumber?: number;
}

const buildCodexInput = async (
  options: ReviewOptions,
  event: PullRequestEventPayload,
  ctx: ReturnType<typeof loadActionContext>
) => {
  const pullNumber = options.pullNumber ?? requirePullRequestNumber(event);
  const pr = await fetchPullRequest(ctx, pullNumber);
  const files = await listPullRequestFiles(ctx, pullNumber);

  const fileSummaries = files
    .map((file) => {
      const header = `### ${file.filename} (${file.status}${file.changes ? `, ±${file.changes}` : ''})`;
      const patch = file.patch ? `\n\n\`\`\`diff\n${file.patch}\n\`\`\`` : '';
      return `${header}${patch}`;
    })
    .join('\n\n');

  const metadata = [
    `Title: ${pr.title}`,
    `Author: ${pr.user?.login ?? 'unknown'}`,
    `Base: ${pr.base?.ref}`,
    `Head: ${pr.head?.label}`,
    `URL: ${pr.html_url}`,
    pr.body ? `Body:\n${pr.body}` : undefined
  ]
    .filter(Boolean)
    .join('\n\n');

  const guidance = options.promptExtra
    ? `\n\n### Additional Reviewer Guidance\n${options.promptExtra}`
    : '';

  return `${metadata}${guidance}\n\n---\n\n${fileSummaries}`;
};

const buildCodexArgs = (options: ReviewOptions) => {
  const args = ['exec'];
  if (options.model) {
    args.push('--model', options.model);
  }
  if (options.effort) {
    args.push('--effort', options.effort);
  }
  if (options.codexArgs) {
    args.push(...stringArgv(options.codexArgs));
  }
  return args;
};

export const registerReviewCommand = (program: Command) => {
  program
    .command('review')
    .description('Run the Codex PR review workflow')
    .option('--prompt <path>', 'Prompt file to use', '.github/prompts/codex-review.md')
    .option('--prompt-extra <markdown>', 'Additional markdown appended to the prompt')
    .option('--model <name>', 'Codex model override')
    .option('--effort <level>', 'Codex reasoning effort override')
    .option('--codex-args <args>', 'Custom arguments forwarded to `codex exec`')
    .option('--codex-bin <path>', 'Codex CLI binary', 'codex')
    .option('--dry-run', 'Only print the Codex output without submitting a review', false)
    .option('--event-path <path>', 'Path to a GitHub event payload override')
    .option('--pull-number <number>', 'Explicit pull request number override', (value) =>
      Number.parseInt(value, 10)
    )
    .action(async (opts: ReviewOptions) => {
      const ctx = loadActionContext({ eventPath: opts.eventPath });
      const event = readEventPayload<PullRequestEventPayload>(ctx.eventPath) ?? {};
      const input = await buildCodexInput(opts, event, ctx);
      const codex = new CodexClient(opts.codexBin);
      const args = buildCodexArgs(opts);
      const output = await codex.run({ args, input, promptPath: path.resolve(opts.prompt) });

      if (opts.dryRun) {
        logger.info('Codex output (dry-run):');
        logger.info(output);
        return;
      }

      const pullNumber = opts.pullNumber ?? requirePullRequestNumber(event);
      await createReview(ctx, pullNumber, output);
      logger.info(`Submitted review for PR #${pullNumber}`);
    });
};
