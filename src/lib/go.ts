import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import semver from 'semver';
import stringArgv from 'string-argv';
import { runCommand } from './exec';
import { logger } from './logger';

const PLATFORM_MAP: Partial<Record<NodeJS.Platform, string>> = {
  linux: 'linux',
  darwin: 'darwin',
  win32: 'windows',
  aix: 'linux',
  freebsd: 'linux',
  openbsd: 'linux',
  sunos: 'linux',
  android: 'linux',
  haiku: 'linux',
  cygwin: 'windows'
};

const ARCH_MAP: Partial<Record<NodeJS.Architecture, string>> = {
  x64: 'amd64',
  arm64: 'arm64',
  arm: 'armv6l',
  ia32: '386',
  ppc64: 'ppc64le',
  s390x: 's390x',
  loong64: 'loong64',
  mips: 'mips',
  mipsel: 'mipsle',
  riscv64: 'riscv64'
};

const normaliseVersion = (value: string) => {
  const cleaned = value.replace(/^go/i, '');
  const coerced = semver.coerce(cleaned);
  return coerced?.version ?? cleaned;
};

const detectPlatform = () => PLATFORM_MAP[process.platform] ?? 'linux';
const detectArch = () => ARCH_MAP[process.arch] ?? 'amd64';

export const installGo = async (version: string) => {
  const normalized = normaliseVersion(version);
  if (!normalized) {
    throw new Error(`Unable to parse Go version: ${version}`);
  }

  const cached = tc.find('go', normalized);
  if (cached) {
    const bin = path.join(cached, 'bin');
    core.addPath(bin);
    return bin;
  }

  const platform = detectPlatform();
  const arch = detectArch();
  const ext = platform === 'windows' ? 'zip' : 'tar.gz';
  const filename = `go${normalized}.${platform}-${arch}.${ext}`;
  const url = `https://go.dev/dl/${filename}`;
  logger.info(`Downloading Go ${normalized} from ${url}`);

  const downloadPath = await tc.downloadTool(url);
  const extracted =
    ext === 'zip' ? await tc.extractZip(downloadPath) : await tc.extractTar(downloadPath);
  const cachePath = await tc.cacheDir(path.join(extracted, 'go'), 'go', normalized);
  const binPath = path.join(cachePath, 'bin');
  core.addPath(binPath);
  return binPath;
};

const readVersionFromFile = (filePath: string): string | undefined => {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^go\s+(\d+\.\d+(?:\.\d+)?)$/m);
  return match?.[1];
};

export interface GoTestOptions {
  goVersion?: string;
  goVersionFile?: string;
  workingDirectory?: string;
  testFlags?: string;
  preTest?: string;
  env?: Record<string, string>;
}

export const runGoTests = async (options: GoTestOptions) => {
  const workingDirectory = options.workingDirectory ?? process.cwd();
  let resolvedVersion = options.goVersion;
  if (!resolvedVersion && options.goVersionFile) {
    resolvedVersion = readVersionFromFile(path.resolve(options.goVersionFile));
  }

  if (resolvedVersion) {
    await installGo(resolvedVersion);
  }

  if (options.preTest) {
    await runCommand({
      command: 'bash',
      args: ['-lc', options.preTest],
      cwd: workingDirectory
    });
  }

  const flags = options.testFlags ? stringArgv(options.testFlags) : ['./...'];
  await runCommand({
    command: 'go',
    args: ['test', ...flags],
    cwd: workingDirectory,
    env: { ...process.env, ...options.env }
  });
};
