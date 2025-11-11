"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/action.ts
var core3 = __toESM(require("@actions/core"));

// src/program.ts
var import_commander = require("commander");

// src/commands/auto-label.ts
var import_node_path3 = __toESM(require("path"));
var import_string_argv = require("string-argv");

// src/lib/codex.ts
var import_node_path = __toESM(require("path"));

// src/lib/exec.ts
var import_execa = require("execa");

// src/lib/logger.ts
var core = __toESM(require("@actions/core"));
var inActions = process.env.GITHUB_ACTIONS === "true";
var serialize = (value) => {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
};
var logToConsole = (level, message, details) => {
  const suffix = serialize(details);
  const body = suffix ? `${message} ${suffix}` : message;
  if (inActions) {
    switch (level) {
      case "debug":
        core.debug(body);
        return;
      case "info":
        core.info(body);
        return;
      case "warn":
        core.warning(body);
        return;
      case "error":
        core.error(body);
        return;
    }
  }
  const target = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  target(`[${level.toUpperCase()}] ${body}`);
};
var logger = {
  debug: (message, details) => logToConsole("debug", message, details),
  info: (message, details) => logToConsole("info", message, details),
  warn: (message, details) => logToConsole("warn", message, details),
  error: (message, details) => logToConsole("error", message, details),
  fatal: (error2) => {
    if (error2 instanceof Error) {
      logToConsole("error", error2.message, { stack: error2.stack });
    } else {
      logToConsole("error", "Unknown fatal error", { error: error2 });
    }
  }
};

// src/lib/exec.ts
var runCommand = async ({ command, args = [], silent, ...options }) => {
  logger.debug("exec", { command, args });
  return (0, import_execa.execa)(command, args, {
    stdout: silent ? "pipe" : "inherit",
    stderr: silent ? "pipe" : "inherit",
    stdin: "inherit",
    ...options
  });
};

// src/lib/codex.ts
var decodeCodexAuth = () => {
  if (process.env.CODEX_AUTH_JSON) {
    return process.env.CODEX_AUTH_JSON;
  }
  const encoded = process.env.CODEX_AUTH_JSON_B64;
  if (!encoded) {
    return void 0;
  }
  return Buffer.from(encoded, "base64").toString("utf8");
};
var CodexClient = class {
  constructor(binary = "codex") {
    this.binary = binary;
  }
  buildEnv(extraEnv) {
    const env = { ...process.env };
    const decoded = decodeCodexAuth();
    if (decoded) {
      env.CODEX_AUTH_JSON = decoded;
    }
    if (extraEnv) {
      Object.assign(env, extraEnv);
    }
    return env;
  }
  async run({ args = [], input, promptPath, workingDirectory, extraEnv }) {
    const finalArgs = [...args];
    if (promptPath) {
      finalArgs.push("--prompt", import_node_path.default.resolve(promptPath));
    }
    logger.debug("Invoking Codex CLI", { args: finalArgs });
    const result = await runCommand({
      command: this.binary,
      args: finalArgs,
      cwd: workingDirectory,
      env: this.buildEnv(extraEnv),
      input,
      silent: true
    });
    return result.stdout.trim();
  }
};

// src/lib/context.ts
var import_github = require("@actions/github");
var import_node_fs = __toESM(require("fs"));
var import_node_path2 = __toESM(require("path"));

// src/lib/env.ts
var optionalEnv = (name, fallback) => {
  const value = process.env[name];
  return value ?? fallback;
};

// src/lib/context.ts
var parseRepo = (value) => {
  if (!value) {
    throw new Error("Unable to determine repository (missing GITHUB_REPOSITORY).");
  }
  const [owner, repo] = value.split("/", 2);
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY value: ${value}`);
  }
  return { owner, repo };
};
var loadActionContext = (overrides) => {
  const token = overrides?.token ?? optionalEnv("GITHUB_TOKEN");
  if (!token) {
    throw new Error("GITHUB_TOKEN is required to call GitHub APIs.");
  }
  const repo = overrides?.repo ?? parseRepo(optionalEnv("GITHUB_REPOSITORY"));
  const workspace = overrides?.workspace ?? optionalEnv("GITHUB_WORKSPACE", process.cwd());
  const eventPath = overrides?.eventPath ?? optionalEnv("GITHUB_EVENT_PATH");
  return {
    token,
    repo,
    workspace,
    eventPath,
    octokit: (0, import_github.getOctokit)(token)
  };
};
var readEventPayload = (eventPath) => {
  const resolvedPath = eventPath ?? optionalEnv("GITHUB_EVENT_PATH");
  if (!resolvedPath) {
    return void 0;
  }
  if (!import_node_fs.default.existsSync(resolvedPath)) {
    throw new Error(`GITHUB_EVENT_PATH points to a missing file: ${resolvedPath}`);
  }
  const raw = import_node_fs.default.readFileSync(resolvedPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error2) {
    throw new Error(`Unable to parse event payload at ${import_node_path2.default.resolve(resolvedPath)}: ${error2.message}`);
  }
};

// src/lib/github.ts
var requirePullRequestNumber = (payload) => {
  const prNumber = payload?.pull_request?.number;
  if (!prNumber) {
    throw new Error("This command must be triggered from a pull_request event.");
  }
  return prNumber;
};
var requireIssueNumber = (payload) => {
  const issueNumber = payload?.issue?.number;
  if (!issueNumber) {
    throw new Error("This command must be triggered from an issue or pull_request event.");
  }
  return issueNumber;
};
var fetchPullRequest = async (ctx, pullNumber) => {
  const response = await ctx.octokit.rest.pulls.get({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: pullNumber
  });
  return response.data;
};
var listPullRequestFiles = async (ctx, pullNumber) => {
  const files = await ctx.octokit.paginate(ctx.octokit.rest.pulls.listFiles, {
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: pullNumber,
    per_page: 100
  });
  return files;
};
var createReview = async (ctx, pullNumber, body, event = "COMMENT") => {
  await ctx.octokit.rest.pulls.createReview({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: pullNumber,
    body,
    event
  });
};
var createIssueComment = async (ctx, issueNumber, body) => {
  await ctx.octokit.rest.issues.createComment({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    issue_number: issueNumber,
    body
  });
};
var ensureLabelsExist = async (ctx, labels) => {
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
var addLabelsToIssue = async (ctx, issueNumber, labels) => {
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
var createOrUpdateRelease = async (ctx, params) => {
  const existing = await ctx.octokit.rest.repos.getReleaseByTag({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    tag: params.tag
  }).catch((error2) => {
    if (error2.status === 404) {
      return void 0;
    }
    throw error2;
  });
  if (existing) {
    logger.info(`Updating existing release ${params.tag}`);
    await ctx.octokit.rest.repos.updateRelease({
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      release_id: existing.data.id,
      tag_name: params.tag,
      target_commitish: params.target ?? "main",
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
    target_commitish: params.target ?? "main",
    name: params.releaseName ?? params.tag,
    body: params.body,
    draft: params.draft ?? false
  });
  return created.data.html_url;
};
var listRecentCommits = async (ctx, params) => {
  const commits = await ctx.octokit.paginate(ctx.octokit.rest.repos.listCommits, {
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    sha: params.target,
    per_page: Math.min(params.limit ?? 50, 100)
  });
  return commits.slice(0, params.limit ?? 50);
};

// src/commands/auto-label.ts
var buildInput = (payload) => {
  const title = payload.issue?.title ?? "Untitled";
  const body = payload.issue?.body ?? "No description provided";
  const type = payload.issue?.pull_request ? "pull request" : "issue";
  return `Title: ${title}
Type: ${type}
---
${body}`;
};
var buildArgs = (options) => {
  const args = ["exec"];
  if (options.model) {
    args.push("--model", options.model);
  }
  if (options.effort) {
    args.push("--effort", options.effort);
  }
  if (options.codexArgs) {
    args.push(...(0, import_string_argv.argv)(options.codexArgs));
  }
  return args;
};
var parseLabels = (raw, limit) => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((label) => String(label).trim()).filter(Boolean).slice(0, limit);
    }
  } catch (error2) {
    logger.warn("Failed to parse Codex JSON output, falling back to line parsing", {
      message: error2.message
    });
  }
  return raw.split(/[,\n]/).map((label) => label.trim()).filter(Boolean).slice(0, limit);
};
var registerAutoLabelCommand = (program) => {
  program.command("auto-label").description("Suggest and apply labels using Codex output").option("--prompt <path>", "Prompt file path", ".github/prompts/codex-auto-label.md").option("--max-labels <number>", "Maximum labels to apply", (value) => Number.parseInt(value, 10), 3).option("--model <name>", "Codex model override").option("--effort <level>", "Codex effort override").option("--codex-args <args>", "Additional Codex CLI flags").option("--codex-bin <path>", "Codex binary", "codex").option("--dry-run", "Print suggested labels without applying", false).option("--event-path <path>", "Event payload override").action(async (opts) => {
    const ctx = loadActionContext({ eventPath: opts.eventPath });
    const payload = readEventPayload(ctx.eventPath) ?? {};
    const input = buildInput(payload);
    const args = buildArgs(opts);
    const codex = new CodexClient(opts.codexBin);
    const raw = await codex.run({ args, input, promptPath: import_node_path3.default.resolve(opts.prompt) });
    const labels = parseLabels(raw, opts.maxLabels);
    if (!labels.length) {
      logger.info("Codex did not return any labels. Nothing to do.");
      return;
    }
    if (opts.dryRun) {
      logger.info(`Suggested labels: ${labels.join(", ")}`);
      return;
    }
    const issueNumber = requireIssueNumber(payload);
    await ensureLabelsExist(ctx, labels);
    await addLabelsToIssue(ctx, issueNumber, labels);
    logger.info(`Applied labels to #${issueNumber}: ${labels.join(", ")}`);
  });
};

// src/commands/doc-sync.ts
var import_node_fs3 = __toESM(require("fs"));
var import_node_path5 = __toESM(require("path"));
var import_string_argv2 = require("string-argv");

// src/lib/doc-sync.ts
var import_node_fs2 = __toESM(require("fs"));
var import_node_path4 = __toESM(require("path"));
var DEFAULT_DOC_GLOBS = ["docs/**", "**/*.md", "README*"];
var parseDocPatterns = (input) => {
  if (!input) {
    return [...DEFAULT_DOC_GLOBS];
  }
  if (Array.isArray(input)) {
    const patterns = input.map((value) => value.trim()).filter(Boolean);
    return patterns.length ? patterns : [...DEFAULT_DOC_GLOBS];
  }
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.length ? lines : [...DEFAULT_DOC_GLOBS];
};
var writeDocGlobsFile = (patterns, destination) => {
  const abs = import_node_path4.default.resolve(destination);
  import_node_fs2.default.mkdirSync(import_node_path4.default.dirname(abs), { recursive: true });
  import_node_fs2.default.writeFileSync(abs, `${patterns.join("\n")}
`, "utf8");
  return abs;
};
var collectCommitSummary = async (options) => {
  const { baseRef, headRef, headSha, outputPath } = options;
  const abs = import_node_path4.default.resolve(outputPath);
  const range = headRef ? [`origin/${baseRef}..${headRef}`] : [`origin/${baseRef}..HEAD`];
  try {
    await runCommand({ command: "git", args: ["fetch", "--no-tags", "origin", baseRef] });
  } catch (error2) {
    logger.warn("Failed to fetch base ref; continuing with local data", { baseRef, error: error2 });
  }
  try {
    const result = await runCommand({
      command: "git",
      args: ["log", "--no-merges", "--pretty=format:- %s (%h)", ...range],
      silent: true
    });
    const content = result.stdout.trim();
    if (content) {
      import_node_fs2.default.writeFileSync(abs, `${content}
`, "utf8");
    } else {
      import_node_fs2.default.writeFileSync(
        abs,
        `- No commits detected between origin/${baseRef} and ${headSha ?? headRef ?? "HEAD"}.
`,
        "utf8"
      );
    }
  } catch (error2) {
    logger.warn("Unable to collect commit summary; writing fallback message", { error: error2 });
    import_node_fs2.default.writeFileSync(
      abs,
      `- Unable to compute commits for base ${baseRef} (${error2.message}).
`,
      "utf8"
    );
  }
};
var escapeRegex = (segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var globToRegex = (glob) => {
  let pattern = "^";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*") {
      const next = glob[i + 1];
      if (next === "*") {
        pattern += ".*";
        i += 1;
      } else {
        pattern += "[^/]*";
      }
    } else if (char === "?") {
      pattern += "[^/]";
    } else {
      pattern += escapeRegex(char);
    }
  }
  pattern += "$";
  return new RegExp(pattern);
};
var normalisePath = (filePath) => filePath.replace(/\\/g, "/").replace(/^\.\//, "");
var classifyDiffFiles = async (patterns) => {
  const regexes = patterns.map(globToRegex);
  const diff = await runCommand({ command: "git", args: ["diff", "--name-only"], silent: true });
  const files = diff.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const docFiles = [];
  const otherFiles = [];
  files.forEach((file) => {
    const normalized = normalisePath(file);
    if (regexes.some((regex) => regex.test(normalized))) {
      docFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  });
  return { docFiles, otherFiles };
};
var assertDocsOnlyChanged = async (patterns) => {
  const { otherFiles } = await classifyDiffFiles(patterns);
  if (otherFiles.length) {
    throw new Error(`Non-documentation files were modified: ${otherFiles.join(", ")}`);
  }
};
var renderPromptTemplate = (options) => {
  const template = import_node_fs2.default.readFileSync(import_node_path4.default.resolve(options.templatePath), "utf8");
  let rendered = template;
  for (const [key, value] of Object.entries(options.variables)) {
    const needle = new RegExp(escapeRegex(key), "g");
    rendered = rendered.replace(needle, value);
  }
  import_node_fs2.default.writeFileSync(import_node_path4.default.resolve(options.outputPath), rendered, "utf8");
};
var saveFileList = (files, outputPath) => {
  const abs = import_node_path4.default.resolve(outputPath);
  import_node_fs2.default.mkdirSync(import_node_path4.default.dirname(abs), { recursive: true });
  import_node_fs2.default.writeFileSync(abs, `${files.join("\n")}
`, "utf8");
};
var computeDocPatch = async (outputPath) => {
  const diff = await runCommand({ command: "git", args: ["diff", "--binary"], silent: true });
  import_node_fs2.default.writeFileSync(import_node_path4.default.resolve(outputPath), diff.stdout, "utf8");
};
var hasPendingChanges = async () => {
  const status = await runCommand({
    command: "git",
    args: ["status", "--porcelain"],
    silent: true
  });
  return Boolean(status.stdout.trim());
};

// src/lib/git.ts
var commitAll = async (message, cwd) => {
  await runCommand({ command: "git", args: ["add", "--all"], cwd });
  await runCommand({ command: "git", args: ["commit", "-m", message], cwd });
};
var pushChanges = async (options) => {
  const remote = options.remote ?? "origin";
  const ref = options.ref ?? "HEAD";
  const args = ["push"];
  if (options.forceWithLease) {
    args.push("--force-with-lease");
  }
  args.push(remote, ref);
  await runCommand({ command: "git", args, cwd: options.cwd });
};
var ensureGitUser = async (options) => {
  const name = options?.name ?? "github-actions[bot]";
  const email = options?.email ?? "github-actions[bot]@users.noreply.github.com";
  await runCommand({ command: "git", args: ["config", "user.name", name], cwd: options?.cwd });
  await runCommand({ command: "git", args: ["config", "user.email", email], cwd: options?.cwd });
};
var getHeadSha = async (cwd) => {
  const result = await runCommand({ command: "git", args: ["rev-parse", "HEAD"], cwd, silent: true });
  return result.stdout.trim();
};

// src/commands/doc-sync.ts
var buildCodexArgs = (options) => {
  const args = ["exec"];
  if (options.safetyStrategy) {
    args.push("--safety-strategy", options.safetyStrategy);
  }
  if (options.model) {
    args.push("--model", options.model);
  }
  if (options.effort) {
    args.push("--effort", options.effort);
  }
  if (options.codexArgs) {
    args.push(...(0, import_string_argv2.argv)(options.codexArgs));
  }
  return args;
};
var readFileOrDefault = (filePath, fallback) => {
  if (!import_node_fs3.default.existsSync(filePath)) {
    return fallback;
  }
  const contents = import_node_fs3.default.readFileSync(filePath, "utf8").trim();
  return contents || fallback;
};
var collectDocPatterns = (options) => {
  if (options.docGlob?.length) {
    return parseDocPatterns(options.docGlob.join("\n"));
  }
  if (options.docGlobs) {
    return parseDocPatterns(options.docGlobs);
  }
  return [...DEFAULT_DOC_GLOBS];
};
var ensureGitIgnoreEntries = (paths) => {
  const excludePath = import_node_path5.default.resolve(".git/info/exclude");
  import_node_fs3.default.mkdirSync(import_node_path5.default.dirname(excludePath), { recursive: true });
  const existing = import_node_fs3.default.existsSync(excludePath) ? import_node_fs3.default.readFileSync(excludePath, "utf8").split(/\r?\n/).filter(Boolean) : [];
  const entries = new Set(existing);
  let changed = false;
  paths.map((entry) => entry.trim()).filter(Boolean).forEach((entry) => {
    if (!entries.has(entry)) {
      entries.add(entry);
      changed = true;
    }
  });
  if (changed) {
    import_node_fs3.default.writeFileSync(excludePath, `${Array.from(entries).join("\n")}
`, "utf8");
  }
};
var registerDocSyncCommand = (program) => {
  program.command("doc-sync").description("Run the documentation sync workflow end-to-end.").option("--doc-globs <multiline>", "Newline-separated glob list defining documentation scope").option("--doc-glob <pattern>", "Additional doc glob (can be repeated)", (value, prev = []) => {
    prev.push(value);
    return prev;
  }).option("--doc-globs-file <path>", "Path where doc globs manifest will be written", "doc-globs.txt").option("--prompt-template <path>", "Codex prompt template", ".github/prompts/codex-doc-sync.md").option("--prompt-path <path>", "Rendered prompt destination", "codex_prompt.md").option("--report-path <path>", "Doc summary markdown path", "doc-sync-report.md").option("--commits-path <path>", "Commit summary path", "doc-commits.md").option("--patch-path <path>", "Diff patch output", "doc-changes.patch").option("--files-path <path>", "Touched file list output", "doc-changes.txt").option("--base-ref <ref>", "Base branch ref (default: PR base or main)").option("--head-ref <ref>", "Head branch ref (default: PR head)").option("--head-sha <sha>", "Head commit SHA override").option("--pull-number <number>", "Pull request number", (value) => Number.parseInt(value, 10)).option("--codex-bin <path>", "Codex CLI binary", "codex").option("--model <name>", "Codex model override").option("--effort <level>", "Codex effort override").option("--safety-strategy <mode>", "Codex safety strategy (drop-sudo/read-only/etc)").option("--codex-args <args>", "Additional Codex CLI flags").option("--dry-run", "Skip committing/pushing, only show summary", false).option("--no-auto-commit", "Do not create a git commit").option("--no-auto-push", "Do not push changes upstream").option("--no-comment", "Skip PR comment").option("--event-path <path>", "Event payload override path").action(async (opts) => {
    const ctx = loadActionContext({ eventPath: opts.eventPath });
    const payload = readEventPayload(ctx.eventPath) ?? {};
    const repoFull = `${ctx.repo.owner}/${ctx.repo.repo}`;
    const pullNumber = opts.pullNumber ?? (payload.pull_request ? requirePullRequestNumber(payload) : void 0);
    if (!pullNumber) {
      throw new Error("doc-sync requires a pull request context or --pull-number");
    }
    const headRepoFull = payload.pull_request?.head?.repo?.full_name;
    if (headRepoFull && headRepoFull !== repoFull) {
      throw new Error(
        `Head repo ${headRepoFull} differs from workflow repo ${repoFull}; doc-sync cannot push.`
      );
    }
    const baseRef = opts.baseRef ?? payload.pull_request?.base?.ref ?? process.env.GITHUB_BASE_REF ?? "main";
    const headRef = opts.headRef ?? payload.pull_request?.head?.ref ?? process.env.GITHUB_HEAD_REF ?? "HEAD";
    const headSha = opts.headSha ?? payload.pull_request?.head?.sha ?? process.env.GITHUB_SHA;
    const docPatterns = collectDocPatterns(opts);
    ensureGitIgnoreEntries([
      opts.reportPath,
      opts.commitsPath,
      opts.docGlobsFile,
      opts.promptPath,
      opts.patchPath,
      opts.filesPath
    ]);
    const docGlobsPath = writeDocGlobsFile(docPatterns, opts.docGlobsFile);
    await collectCommitSummary({ baseRef, headRef, headSha, outputPath: opts.commitsPath });
    const docScope = docPatterns.map((pattern) => `- ${pattern}`).join("\n");
    const commitSummary = readFileOrDefault(opts.commitsPath, "- No commits provided.");
    renderPromptTemplate({
      templatePath: opts.promptTemplate,
      outputPath: opts.promptPath,
      variables: {
        "{{BASE_REF}}": baseRef,
        "{{HEAD_REF}}": headRef,
        "{{PR_NUMBER}}": String(pullNumber),
        "{{REPOSITORY}}": repoFull,
        "{{DOC_SCOPE}}": docScope,
        "{{COMMIT_SUMMARY}}": commitSummary,
        "{{REPORT_PATH}}": opts.reportPath
      }
    });
    const codex = new CodexClient(opts.codexBin);
    const args = buildCodexArgs(opts);
    const extraEnv = {
      DOC_REPORT_PATH: import_node_path5.default.resolve(opts.reportPath),
      DOC_BASE_REF: baseRef,
      DOC_HEAD_REF: headRef,
      DOC_HEAD_SHA: headSha ?? "",
      DOC_PR_NUMBER: String(pullNumber),
      DOC_REPOSITORY: repoFull,
      DOC_GLOBS_FILE: docGlobsPath,
      GH_TOKEN: process.env.GITHUB_TOKEN ?? "",
      GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? ""
    };
    await codex.run({ args, promptPath: import_node_path5.default.resolve(opts.promptPath), extraEnv });
    await assertDocsOnlyChanged(docPatterns);
    const { docFiles } = await classifyDiffFiles(docPatterns);
    if (!docFiles.length) {
      logger.info("Codex did not modify documentation files.");
      return;
    }
    await saveFileList(docFiles, opts.filesPath);
    await computeDocPatch(opts.patchPath);
    if (opts.dryRun) {
      logger.info("Doc-sync dry run complete. Files touched:");
      docFiles.forEach((file) => logger.info(` - ${file}`));
      return;
    }
    const pendingChanges = await hasPendingChanges();
    if (pendingChanges && opts.autoCommit === false) {
      logger.warn("auto-commit disabled; documentation edits remain uncommitted.");
    }
    if (pendingChanges && opts.autoCommit !== false) {
      await ensureGitUser();
      await commitAll(`[skip ci][doc-sync] Auto-update docs for PR #${pullNumber}`);
    }
    const commitSha = await getHeadSha();
    if (opts.autoPush !== false) {
      if (opts.autoCommit === false && pendingChanges) {
        throw new Error("Cannot push documentation updates when auto-commit is disabled.");
      }
      await pushChanges({ ref: `HEAD:${headRef}` });
      logger.info(`Pushed documentation updates to ${headRef}`);
    } else {
      logger.info("autoPush disabled; skipping git push.");
    }
    if (opts.comment !== false) {
      const report = readFileOrDefault(opts.reportPath, "Doc sync completed.");
      const filesList = docFiles.map((file) => `- ${file}`).join("\n") || "- (none)";
      const body = [
        "\u{1F916} Documentation synchronized automatically.",
        "",
        report,
        "",
        "Updated files:",
        filesList,
        "",
        `Commit: ${commitSha}`
      ].join("\n");
      await createIssueComment(ctx, pullNumber, body);
      logger.info("Posted documentation summary comment.");
    }
  });
};

// src/lib/go.ts
var core2 = __toESM(require("@actions/core"));
var tc = __toESM(require("@actions/tool-cache"));
var import_node_fs4 = __toESM(require("fs"));
var import_node_path6 = __toESM(require("path"));
var import_semver = __toESM(require("semver"));
var import_string_argv3 = require("string-argv");
var PLATFORM_MAP = {
  linux: "linux",
  darwin: "darwin",
  win32: "windows",
  aix: "linux",
  freebsd: "linux",
  openbsd: "linux",
  sunos: "linux",
  android: "linux"
};
var ARCH_MAP = {
  x64: "amd64",
  arm64: "arm64",
  arm: "armv6l",
  ia32: "386",
  ppc64: "ppc64le",
  s390x: "s390x"
};
var normaliseVersion = (value) => {
  const cleaned = value.replace(/^go/i, "");
  const coerced = import_semver.default.coerce(cleaned);
  return coerced?.version ?? cleaned;
};
var detectPlatform = () => PLATFORM_MAP[process.platform] ?? "linux";
var detectArch = () => ARCH_MAP[process.arch] ?? "amd64";
var installGo = async (version) => {
  const normalized = normaliseVersion(version);
  if (!normalized) {
    throw new Error(`Unable to parse Go version: ${version}`);
  }
  const cached = tc.find("go", normalized);
  if (cached) {
    const bin = import_node_path6.default.join(cached, "bin");
    core2.addPath(bin);
    return bin;
  }
  const platform = detectPlatform();
  const arch = detectArch();
  const ext = platform === "windows" ? "zip" : "tar.gz";
  const filename = `go${normalized}.${platform}-${arch}.${ext}`;
  const url = `https://go.dev/dl/${filename}`;
  logger.info(`Downloading Go ${normalized} from ${url}`);
  const downloadPath = await tc.downloadTool(url);
  const extracted = ext === "zip" ? await tc.extractZip(downloadPath) : await tc.extractTar(downloadPath);
  const cachePath = await tc.cacheDir(import_node_path6.default.join(extracted, "go"), "go", normalized);
  const binPath = import_node_path6.default.join(cachePath, "bin");
  core2.addPath(binPath);
  return binPath;
};
var readVersionFromFile = (filePath) => {
  if (!import_node_fs4.default.existsSync(filePath)) {
    return void 0;
  }
  const raw = import_node_fs4.default.readFileSync(filePath, "utf8");
  const match = raw.match(/^go\s+(\d+\.\d+(?:\.\d+)?)$/m);
  return match?.[1];
};
var runGoTests = async (options) => {
  const workingDirectory = options.workingDirectory ?? process.cwd();
  let resolvedVersion = options.goVersion;
  if (!resolvedVersion && options.goVersionFile) {
    resolvedVersion = readVersionFromFile(import_node_path6.default.resolve(options.goVersionFile));
  }
  if (resolvedVersion) {
    await installGo(resolvedVersion);
  }
  if (options.preTest) {
    await runCommand({
      command: "bash",
      args: ["-lc", options.preTest],
      cwd: workingDirectory
    });
  }
  const flags = options.testFlags ? (0, import_string_argv3.argv)(options.testFlags) : ["./..."];
  await runCommand({
    command: "go",
    args: ["test", ...flags],
    cwd: workingDirectory,
    env: { ...process.env, ...options.env }
  });
};

// src/commands/go-tests.ts
var collectKeyValuePairs = (value, accumulator = {}) => {
  const [key, ...rest] = value.split("=");
  if (!key) {
    throw new Error(`Invalid env pair: ${value}`);
  }
  return { ...accumulator, [key]: rest.join("=") };
};
var registerGoTestsCommand = (program) => {
  program.command("go-tests").description("Execute Go tests with optional on-the-fly Go installation.").option("--go-version <version>", "Explicit Go version to install (e.g. 1.22.5)").option("--go-version-file <path>", "File that declares a Go version (defaults to go.mod)").option("--working-directory <path>", "Working directory for go test", ".").option("--test-flags <flags>", "Flags forwarded to go test (default: ./...)").option("--pre-test <script>", "Shell snippet executed before go test").option("--env <key=value>", "Environment variable forwarded to go test", collectKeyValuePairs, {}).action(async (opts) => {
    await runGoTests({
      goVersion: opts.goVersion,
      goVersionFile: opts.goVersionFile,
      workingDirectory: opts.workingDirectory,
      testFlags: opts.testFlags,
      preTest: opts.preTest,
      env: opts.env
    });
    logger.info("Go tests completed");
  });
};

// src/commands/release.ts
var import_node_path7 = __toESM(require("path"));
var import_string_argv4 = require("string-argv");
var buildCodexArgs2 = (options) => {
  const args = ["exec"];
  if (options.model) {
    args.push("--model", options.model);
  }
  if (options.effort) {
    args.push("--effort", options.effort);
  }
  if (options.codexArgs) {
    args.push(...(0, import_string_argv4.argv)(options.codexArgs));
  }
  return args;
};
var buildNotesInput = (commits, extra) => {
  const commitLines = commits.map((commit) => `- ${commit.sha?.slice(0, 7)} ${commit.commit?.message?.split("\n")[0] ?? ""}`).join("\n");
  const extraBlock = extra ? `

### Extra Context
${extra}` : "";
  return `## Commits
${commitLines}${extraBlock}`;
};
var registerReleaseCommand = (program) => {
  program.command("release").description("Generate release notes with Codex and publish a GitHub release").requiredOption("--tag-name <tag>", "Tag to publish (e.g. v1.2.3)").option("--release-title <title>", "Release display name (defaults to tag)").option("--target <ref>", "Target ref/commit for the release", "main").option("--draft", "Create the release as a draft", false).option("--skip-tests", "Skip Go test execution", false).option("--go-version <version>", "Explicit Go version to install").option("--go-version-file <path>", "File with Go version (default go.mod)").option("--test-flags <flags>", "Flags forwarded to go test (default ./...)").option("--pre-test <script>", "Shell snippet executed before go test").option("--prompt <path>", "Prompt file path for release notes", ".github/prompts/codex-release-template.md").option("--model <name>", "Codex model override").option("--effort <level>", "Codex reasoning effort override").option("--codex-args <args>", "Additional Codex CLI flags").option("--codex-bin <path>", "Codex CLI binary path", "codex").option("--notes-extra <markdown>", "Extra markdown context appended to Codex input").option("--commit-limit <number>", "Number of commits to include", (value) => Number.parseInt(value, 10), 50).option("--dry-run", "Print notes without publishing release", false).action(async (opts) => {
    const ctx = loadActionContext();
    if (!opts.skipTests) {
      await runGoTests({
        goVersion: opts.goVersion,
        goVersionFile: opts.goVersionFile,
        testFlags: opts.testFlags,
        preTest: opts.preTest
      });
    } else {
      logger.info("Skipping Go tests");
    }
    const commits = await listRecentCommits(ctx, { target: opts.target, limit: opts.commitLimit });
    const input = buildNotesInput(commits, opts.notesExtra);
    const codex = new CodexClient(opts.codexBin);
    const args = buildCodexArgs2(opts);
    const notes = await codex.run({ args, input, promptPath: import_node_path7.default.resolve(opts.prompt) });
    if (opts.dryRun) {
      logger.info("Generated release notes (dry-run):");
      logger.info(notes);
      return;
    }
    const url = await createOrUpdateRelease(ctx, {
      tag: opts.tagName,
      target: opts.target,
      releaseName: opts.releaseTitle,
      body: notes,
      draft: opts.draft
    });
    logger.info(`Release ready at ${url}`);
  });
};

// src/commands/review.ts
var import_node_path8 = __toESM(require("path"));
var import_string_argv5 = require("string-argv");
var buildCodexInput = async (options, event, ctx) => {
  const pullNumber = options.pullNumber ?? requirePullRequestNumber(event);
  const pr = await fetchPullRequest(ctx, pullNumber);
  const files = await listPullRequestFiles(ctx, pullNumber);
  const fileSummaries = files.map((file) => {
    const header = `### ${file.filename} (${file.status}${file.changes ? `, \xB1${file.changes}` : ""})`;
    const patch = file.patch ? `

\`\`\`diff
${file.patch}
\`\`\`` : "";
    return `${header}${patch}`;
  }).join("\n\n");
  const metadata = [
    `Title: ${pr.title}`,
    `Author: ${pr.user?.login ?? "unknown"}`,
    `Base: ${pr.base?.ref}`,
    `Head: ${pr.head?.label}`,
    `URL: ${pr.html_url}`,
    pr.body ? `Body:
${pr.body}` : void 0
  ].filter(Boolean).join("\n\n");
  const guidance = options.promptExtra ? `

### Additional Reviewer Guidance
${options.promptExtra}` : "";
  return `${metadata}${guidance}

---

${fileSummaries}`;
};
var buildCodexArgs3 = (options) => {
  const args = ["exec"];
  if (options.model) {
    args.push("--model", options.model);
  }
  if (options.effort) {
    args.push("--effort", options.effort);
  }
  if (options.codexArgs) {
    args.push(...(0, import_string_argv5.argv)(options.codexArgs));
  }
  return args;
};
var registerReviewCommand = (program) => {
  program.command("review").description("Run the Codex PR review workflow").option("--prompt <path>", "Prompt file to use", ".github/prompts/codex-review.md").option("--prompt-extra <markdown>", "Additional markdown appended to the prompt").option("--model <name>", "Codex model override").option("--effort <level>", "Codex reasoning effort override").option("--codex-args <args>", "Custom arguments forwarded to `codex exec`").option("--codex-bin <path>", "Codex CLI binary", "codex").option("--dry-run", "Only print the Codex output without submitting a review", false).option("--event-path <path>", "Path to a GitHub event payload override").option(
    "--pull-number <number>",
    "Explicit pull request number override",
    (value) => Number.parseInt(value, 10)
  ).action(async (opts) => {
    const ctx = loadActionContext({ eventPath: opts.eventPath });
    const event = readEventPayload(ctx.eventPath) ?? {};
    const input = await buildCodexInput(opts, event, ctx);
    const codex = new CodexClient(opts.codexBin);
    const args = buildCodexArgs3(opts);
    const output = await codex.run({ args, input, promptPath: import_node_path8.default.resolve(opts.prompt) });
    if (opts.dryRun) {
      logger.info("Codex output (dry-run):");
      logger.info(output);
      return;
    }
    const pullNumber = opts.pullNumber ?? requirePullRequestNumber(event);
    await createReview(ctx, pullNumber, output);
    logger.info(`Submitted review for PR #${pullNumber}`);
  });
};

// src/program.ts
var createProgram = () => {
  const program = new import_commander.Command();
  program.name("codex-workflows").description("Unified Codex workflow CLI for GitHub Actions and local use.").version(process.env.npm_package_version ?? "0.0.0");
  registerReviewCommand(program);
  registerGoTestsCommand(program);
  registerReleaseCommand(program);
  registerAutoLabelCommand(program);
  registerDocSyncCommand(program);
  return program;
};

// src/action.ts
var truthy = (value, defaultValue = false) => {
  if (value === void 0 || value === null || value === "") {
    return defaultValue;
  }
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
};
var pushOption = (args, flag, value) => {
  if (value) {
    args.push(flag, value);
  }
};
var pushBooleanFlag = (args, flag, enabled) => {
  if (enabled) {
    args.push(flag);
  }
};
var buildReviewArgs = () => {
  const args = [];
  pushOption(args, "--prompt", core3.getInput("prompt_path") || ".github/prompts/codex-review.md");
  pushOption(args, "--prompt-extra", core3.getInput("prompt_extra"));
  pushOption(args, "--model", core3.getInput("model"));
  pushOption(args, "--effort", core3.getInput("effort"));
  pushOption(args, "--codex-args", core3.getInput("codex_args"));
  pushOption(args, "--codex-bin", core3.getInput("codex_bin"));
  pushOption(args, "--event-path", core3.getInput("event_path"));
  const pullNumber = core3.getInput("pull_number");
  if (pullNumber) {
    args.push("--pull-number", pullNumber);
  }
  if (truthy(core3.getInput("dry_run"))) {
    args.push("--dry-run");
  }
  return args;
};
var buildGoTestArgs = () => {
  const args = [];
  pushOption(args, "--go-version", core3.getInput("go_version"));
  pushOption(args, "--go-version-file", core3.getInput("go_version_file"));
  pushOption(args, "--working-directory", core3.getInput("working_directory"));
  pushOption(args, "--test-flags", core3.getInput("test_flags"));
  pushOption(args, "--pre-test", core3.getInput("pre_test"));
  const envLines = core3.getMultilineInput("env");
  envLines.forEach((line) => {
    if (line.trim()) {
      args.push("--env", line.trim());
    }
  });
  return args;
};
var buildReleaseArgs = () => {
  const args = [];
  pushOption(args, "--tag-name", core3.getInput("tag_name", { required: true }));
  pushOption(args, "--release-title", core3.getInput("release_title"));
  pushOption(args, "--target", core3.getInput("target") || "main");
  pushBooleanFlag(args, "--draft", truthy(core3.getInput("draft")));
  pushBooleanFlag(args, "--skip-tests", truthy(core3.getInput("skip_tests")));
  pushOption(args, "--go-version", core3.getInput("go_version"));
  pushOption(args, "--go-version-file", core3.getInput("go_version_file"));
  pushOption(args, "--test-flags", core3.getInput("test_flags"));
  pushOption(args, "--pre-test", core3.getInput("pre_test"));
  pushOption(args, "--prompt", core3.getInput("prompt_path") || ".github/prompts/codex-release-template.md");
  pushOption(args, "--model", core3.getInput("model"));
  pushOption(args, "--effort", core3.getInput("effort"));
  pushOption(args, "--codex-args", core3.getInput("codex_args"));
  pushOption(args, "--codex-bin", core3.getInput("codex_bin"));
  pushOption(args, "--notes-extra", core3.getInput("notes_extra"));
  const commitLimit = core3.getInput("commit_limit");
  if (commitLimit) {
    args.push("--commit-limit", commitLimit);
  }
  if (truthy(core3.getInput("dry_run"))) {
    args.push("--dry-run");
  }
  return args;
};
var buildAutoLabelArgs = () => {
  const args = [];
  pushOption(args, "--prompt", core3.getInput("prompt_path") || ".github/prompts/codex-auto-label.md");
  const maxLabels = core3.getInput("max_labels");
  if (maxLabels) {
    args.push("--max-labels", maxLabels);
  }
  pushOption(args, "--model", core3.getInput("model"));
  pushOption(args, "--effort", core3.getInput("effort"));
  pushOption(args, "--codex-args", core3.getInput("codex_args"));
  pushOption(args, "--codex-bin", core3.getInput("codex_bin"));
  pushOption(args, "--event-path", core3.getInput("event_path"));
  if (truthy(core3.getInput("dry_run"))) {
    args.push("--dry-run");
  }
  return args;
};
var buildDocSyncArgs = () => {
  const args = [];
  const docGlobsMultiline = core3.getMultilineInput("doc_globs");
  if (docGlobsMultiline.length) {
    args.push("--doc-globs", docGlobsMultiline.join("\n"));
  }
  pushOption(args, "--doc-globs-file", core3.getInput("doc_globs_file"));
  pushOption(args, "--prompt-template", core3.getInput("prompt_template"));
  pushOption(args, "--prompt-path", core3.getInput("prompt_path"));
  pushOption(args, "--report-path", core3.getInput("report_path"));
  pushOption(args, "--commits-path", core3.getInput("commits_path"));
  pushOption(args, "--patch-path", core3.getInput("patch_path"));
  pushOption(args, "--files-path", core3.getInput("files_path"));
  pushOption(args, "--base-ref", core3.getInput("base_ref"));
  pushOption(args, "--head-ref", core3.getInput("head_ref"));
  pushOption(args, "--head-sha", core3.getInput("head_sha"));
  pushOption(args, "--pull-number", core3.getInput("pull_number"));
  pushOption(args, "--codex-bin", core3.getInput("codex_bin"));
  pushOption(args, "--model", core3.getInput("model"));
  pushOption(args, "--effort", core3.getInput("effort"));
  pushOption(args, "--codex-args", core3.getInput("codex_args"));
  pushOption(args, "--safety-strategy", core3.getInput("safety_strategy"));
  if (truthy(core3.getInput("dry_run"))) {
    args.push("--dry-run");
  }
  if (!truthy(core3.getInput("auto_commit"), true)) {
    args.push("--no-auto-commit");
  }
  if (!truthy(core3.getInput("auto_push"), true)) {
    args.push("--no-auto-push");
  }
  if (!truthy(core3.getInput("comment"), true)) {
    args.push("--no-comment");
  }
  return args;
};
var buildArgsForCommand = (command) => {
  switch (command) {
    case "review":
      return buildReviewArgs();
    case "go-tests":
      return buildGoTestArgs();
    case "release":
      return buildReleaseArgs();
    case "auto-label":
      return buildAutoLabelArgs();
    case "doc-sync":
      return buildDocSyncArgs();
    default:
      throw new Error(`Unsupported command: ${command}`);
  }
};
async function run() {
  try {
    const command = core3.getInput("command", { required: true }).trim();
    const args = buildArgsForCommand(command);
    const program = createProgram();
    await program.parseAsync(["node", "action", command, ...args]);
  } catch (error2) {
    logger.fatal(error2);
    core3.setFailed(error2 instanceof Error ? error2.message : String(error2));
  }
}
run();
//# sourceMappingURL=action.cjs.map