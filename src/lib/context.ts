import { getOctokit } from '@actions/github';
import fs from 'node:fs';
import path from 'node:path';
import { requireEnv, optionalEnv } from './env';

export type RepoRef = {
  owner: string;
  repo: string;
};

export interface ActionContext {
  token: string;
  repo: RepoRef;
  workspace: string;
  eventPath?: string;
  octokit: ReturnType<typeof getOctokit>;
}

const parseRepo = (value?: string): RepoRef => {
  if (!value) {
    throw new Error('Unable to determine repository (missing GITHUB_REPOSITORY).');
  }
  const [owner, repo] = value.split('/', 2);
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY value: ${value}`);
  }

  return { owner, repo };
};

export const loadActionContext = (overrides?: Partial<{ token: string; repo: RepoRef; workspace: string; eventPath: string }>): ActionContext => {
  const token = overrides?.token ?? optionalEnv('GITHUB_TOKEN');
  if (!token) {
    throw new Error('GITHUB_TOKEN is required to call GitHub APIs.');
  }

  const repo = overrides?.repo ?? parseRepo(optionalEnv('GITHUB_REPOSITORY'));
  const workspace = overrides?.workspace ?? optionalEnv('GITHUB_WORKSPACE') ?? process.cwd();
  const eventPath = overrides?.eventPath ?? optionalEnv('GITHUB_EVENT_PATH');

  return {
    token,
    repo,
    workspace,
    eventPath,
    octokit: getOctokit(token)
  };
};

export const readEventPayload = <T>(eventPath?: string): T | undefined => {
  const resolvedPath = eventPath ?? optionalEnv('GITHUB_EVENT_PATH');
  if (!resolvedPath) {
    return undefined;
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`GITHUB_EVENT_PATH points to a missing file: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Unable to parse event payload at ${path.resolve(resolvedPath)}: ${(error as Error).message}`);
  }
};
