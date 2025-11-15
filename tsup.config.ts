import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/cli.ts',
    action: 'src/action.ts'
  },
  format: ['cjs'],
  target: 'node20',
  sourcemap: true,
  splitting: false,
  clean: true,
  dts: true,
  shims: false,
  minify: false,
  noExternal: [
    '@actions/core',
    '@actions/github',
    '@actions/io',
    '@actions/tool-cache',
    '@octokit/openapi-types',
    'commander',
    'execa',
    'fast-glob',
    'fs-extra',
    'semver',
    'string-argv',
    'yaml',
    'zod'
  ],
  outExtension() {
    return { js: '.cjs' };
  },
  env: {
    NODE_ENV: process.env.NODE_ENV ?? 'production'
  }
});
