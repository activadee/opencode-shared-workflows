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
  outExtension() {
    return { js: '.cjs' };
  },
  env: {
    NODE_ENV: process.env.NODE_ENV ?? 'production'
  }
});
