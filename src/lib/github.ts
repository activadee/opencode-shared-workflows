import type { components } from '@octokit/openapi-types';
import { logger } from './logger';
import type { ActionContext } from './context';

export type PullRequest = components['schemas']['pull-request'];
export type Issue = components['schemas']['issue'];

export interface PullRequestEventPayload {
  pull_request?: PullRequest;
  repository?: components['schemas']['repository'];
}

export interface IssueEventPayload {
  issue?: Issue;
}

export const requirePullRequestNumber = (payload?: PullRequestEventPayload): number => {
  const prNumber = payload?.pull_request?.number;
  if (!prNumber) {
    throw new Error('This command must be triggered from a pull_request event.');
  }

  return prNumber;
};

export const requireIssueNumber = (payload?: IssueEventPayload): number => {
  const issueNumber = payload?.issue?.number;
  if (!issueNumber) {
    throw new Error('This command must be triggered from an issue or pull_request event.');
  }

  return issueNumber;
};

export const fetchPullRequest = async (ctx: ActionContext, pullNumber: number) => {
  const response = await ctx.octokit.rest.pulls.get({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: pullNumber
  });

  return response.data;
};

export const listPullRequestFiles = async (ctx: ActionContext, pullNumber: number) => {
  const files = await ctx.octokit.paginate(ctx.octokit.rest.pulls.listFiles, {
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: pullNumber,
    per_page: 100
  });
  return files;
};

export const createReview = async (
  ctx: ActionContext,
  pullNumber: number,
  body: string,
  event: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES' = 'COMMENT'
) => {
  await ctx.octokit.rest.pulls.createReview({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: pullNumber,
    body,
    event
  });
};

export const createIssueComment = async (ctx: ActionContext, issueNumber: number, body: string) => {
  await ctx.octokit.rest.issues.createComment({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    issue_number: issueNumber,
    body
  });
};

export const ensureLabelsExist = async (ctx: ActionContext, labels: string[]) => {
  if (!labels.length) {
    return;
  }

  const existing = await ctx.octokit.paginate(ctx.octokit.rest.issues.listLabelsForRepo, {
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    per_page: 100
  });

  const existingNames = new Set(existing.map((label) => label.name));
  for (const label of labels) {
    if (existingNames.has(label)) {
      continue;
    }

    logger.info(`Creating label ${label}`);
    await ctx.octokit.rest.issues.createLabel({
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      name: label
    });
  }
};

export const addLabelsToIssue = async (ctx: ActionContext, issueNumber: number, labels: string[]) => {
  if (!labels.length) {
    return;
  }

  await ctx.octokit.rest.issues.addLabels({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    issue_number: issueNumber,
    labels
  });
};

export const createOrUpdateRelease = async (
  ctx: ActionContext,
  params: {
    tag: string;
    target?: string;
    releaseName?: string;
    body?: string;
    draft?: boolean;
  }
) => {
  const existing = await ctx.octokit.rest.repos.getReleaseByTag({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    tag: params.tag
  }).catch((error: any) => {
    if (error.status === 404) {
      return undefined;
    }
    throw error;
  });

  if (existing) {
    logger.info(`Updating existing release ${params.tag}`);
    await ctx.octokit.rest.repos.updateRelease({
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      release_id: existing.data.id,
      tag_name: params.tag,
      target_commitish: params.target ?? 'main',
      body: params.body,
      draft: params.draft,
      name: params.releaseName ?? params.tag
    });
    return existing.data.html_url;
  }

  logger.info(`Creating release ${params.tag}`);
  const created = await ctx.octokit.rest.repos.createRelease({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    tag_name: params.tag,
    target_commitish: params.target ?? 'main',
    name: params.releaseName ?? params.tag,
    body: params.body,
    draft: params.draft ?? false
  });

  return created.data.html_url;
};

export const listRecentCommits = async (
  ctx: ActionContext,
  params: { target?: string; limit?: number }
) => {
  const commits = await ctx.octokit.paginate(ctx.octokit.rest.repos.listCommits, {
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    sha: params.target,
    per_page: Math.min(params.limit ?? 50, 100)
  });

  return commits.slice(0, params.limit ?? 50);
};
