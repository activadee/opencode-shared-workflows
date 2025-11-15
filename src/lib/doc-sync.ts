import fs from 'node:fs';
import path from 'node:path';
import { runCommand } from './exec';
import { logger } from './logger';

export const DEFAULT_DOC_GLOBS = ['docs/**', '**/*.md', 'README*'];

export const parseDocPatterns = (input?: string | string[]): string[] => {
  if (!input) {
    return [...DEFAULT_DOC_GLOBS];
  }

  if (Array.isArray(input)) {
    const patterns = input.map((value) => value.trim()).filter(Boolean);
    return patterns.length ? patterns : [...DEFAULT_DOC_GLOBS];
  }

  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length ? lines : [...DEFAULT_DOC_GLOBS];
};

export const writeDocGlobsFile = (patterns: string[], destination: string) => {
  const abs = path.resolve(destination);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${patterns.join('\n')}\n`, 'utf8');
  return abs;
};

export const collectCommitSummary = async (options: {
  baseRef: string;
  headRef?: string;
  headSha?: string;
  outputPath: string;
}) => {
  const { baseRef, headRef, headSha, outputPath } = options;
  const abs = path.resolve(outputPath);
  const headSpecifier = headSha ?? headRef ?? 'HEAD';
  const range = [`origin/${baseRef}..${headSpecifier}`];
  try {
    await runCommand({ command: 'git', args: ['fetch', '--no-tags', 'origin', baseRef] });
  } catch (error) {
    logger.warn('Failed to fetch base ref; continuing with local data', { baseRef, error });
  }

  try {
    const { stdout } = await runCommand({
      command: 'git',
      args: ['log', '--no-merges', "--pretty=format:- %s (%h)", ...range],
      silent: true
    });
    const content = stdout.trim();
    if (content) {
      fs.writeFileSync(abs, `${content}\n`, 'utf8');
    } else {
      fs.writeFileSync(
        abs,
        `- No commits detected between origin/${baseRef} and ${headSha ?? headRef ?? 'HEAD'}.\n`,
        'utf8'
      );
    }
  } catch (error) {
    logger.warn('Unable to collect commit summary; writing fallback message', { error });
    fs.writeFileSync(
      abs,
      `- Unable to compute commits for base ${baseRef} (${(error as Error).message}).\n`,
      'utf8'
    );
  }
};

const escapeRegex = (segment: string) => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const globToRegex = (glob: string) => {
  let pattern = '^';
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === '*') {
      const next = glob[i + 1];
      if (next === '*') {
        pattern += '.*';
        i += 1;
      } else {
        pattern += '[^/]*';
      }
    } else if (char === '?') {
      pattern += '[^/]';
    } else {
      pattern += escapeRegex(char);
    }
  }
  pattern += '$';
  return new RegExp(pattern);
};

const normalisePath = (filePath: string) => filePath.replace(/\\/g, '/').replace(/^\.\//, '');

export const classifyDiffFiles = async (patterns: string[]) => {
  const regexes = patterns.map(globToRegex);
  const { stdout } = await runCommand({ command: 'git', args: ['diff', '--name-only'], silent: true });
  const files = stdout
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter(Boolean);

  const docFiles: string[] = [];
  const otherFiles: string[] = [];

  files.forEach((file: string) => {
    const normalized = normalisePath(file);
    if (regexes.some((regex) => regex.test(normalized))) {
      docFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  });

  return { docFiles, otherFiles };
};

export const assertDocsOnlyChanged = async (patterns: string[]) => {
  const { otherFiles } = await classifyDiffFiles(patterns);
  if (otherFiles.length) {
    throw new Error(`Non-documentation files were modified: ${otherFiles.join(', ')}`);
  }
};

export const saveFileList = (files: string[], outputPath: string) => {
  const abs = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${files.join('\n')}\n`, 'utf8');
};

export const computeDocPatch = async (outputPath: string) => {
  const { stdout } = await runCommand({ command: 'git', args: ['diff', '--binary'], silent: true });
  fs.writeFileSync(path.resolve(outputPath), stdout, 'utf8');
};

export const hasPendingChanges = async () => {
  const { stdout } = await runCommand({
    command: 'git',
    args: ['status', '--porcelain'],
    silent: true
  });
  return Boolean(stdout.trim());
};
