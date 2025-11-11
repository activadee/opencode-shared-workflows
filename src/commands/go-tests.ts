import { Command } from 'commander';
import { runGoTests } from '../lib/go';
import { logger } from '../lib/logger';

interface GoTestsOptions {
  goVersion?: string;
  goVersionFile?: string;
  workingDirectory?: string;
  testFlags?: string;
  preTest?: string;
  env?: Record<string, string>;
}

const collectKeyValuePairs = (value: string, accumulator: Record<string, string> = {}) => {
  const [key, ...rest] = value.split('=');
  if (!key) {
    throw new Error(`Invalid env pair: ${value}`);
  }
  return { ...accumulator, [key]: rest.join('=') };
};

export const registerGoTestsCommand = (program: Command) => {
  program
    .command('go-tests')
    .description('Execute Go tests with optional on-the-fly Go installation.')
    .option('--go-version <version>', 'Explicit Go version to install (e.g. 1.22.5)')
    .option('--go-version-file <path>', 'File that declares a Go version (defaults to go.mod)')
    .option('--working-directory <path>', 'Working directory for go test', '.')
    .option('--test-flags <flags>', 'Flags forwarded to go test (default: ./...)')
    .option('--pre-test <script>', 'Shell snippet executed before go test')
    .option('--env <key=value>', 'Environment variable forwarded to go test', collectKeyValuePairs, {})
    .action(async (opts: GoTestsOptions) => {
      await runGoTests({
        goVersion: opts.goVersion,
        goVersionFile: opts.goVersionFile,
        workingDirectory: opts.workingDirectory,
        testFlags: opts.testFlags,
        preTest: opts.preTest,
        env: opts.env
      });
      logger.info('Go tests completed');
    });
};
