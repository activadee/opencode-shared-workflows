const path = require('node:path');
const fs = require('node:fs');
const fse = require('fs-extra');

const sdkRoot = path.resolve(__dirname, '../node_modules/@openai/codex-sdk');
const outputRoot = path.resolve(__dirname, '../dist/vendor/codex-sdk');

if (!fs.existsSync(sdkRoot)) {
  console.warn('[@openai/codex-sdk] not found; skipping vendoring.');
  process.exit(0);
}

(async () => {
  await fse.remove(outputRoot);
  await fse.ensureDir(outputRoot);

  for (const entry of ['dist', 'vendor', 'package.json']) {
    const src = path.join(sdkRoot, entry);
    if (!fs.existsSync(src)) {
      continue;
    }
    const dest = path.join(outputRoot, entry);
    await fse.copy(src, dest);
  }

  console.log('Vendored @openai/codex-sdk into dist/vendor/codex-sdk');
})();
