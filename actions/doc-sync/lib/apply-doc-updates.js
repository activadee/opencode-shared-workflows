#!/usr/bin/env node
'use strict';

const fs = require('fs');
const OUTPUT_PATH = process.env.CODEX_DOC_SYNC_OUTPUT_PATH || 'codex-output.json';
const ALLOWLIST_PATH = process.env.CODEX_DOC_SYNC_ALLOWLIST_PATH || 'doc-allowlist.json';
const SUMMARY_PATH = process.env.CODEX_DOC_SYNC_SUMMARY_PATH || 'doc-sync-summary.json';

const readJson = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`Expected JSON file at ${file}`);
  }
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${file}: ${error.message}`);
  }
};

const allowlist = new Set(readJson(ALLOWLIST_PATH));
const output = readJson(OUTPUT_PATH);
const edits = Array.isArray(output.edits) ? output.edits : [];
const followUps = Array.isArray(output.follow_ups) ? output.follow_ups : [];
const summary = typeof output.summary === 'string' ? output.summary.trim() : '';

const applied = [];

for (let index = 0; index < edits.length; index += 1) {
  const edit = edits[index];
  if (!edit || typeof edit !== 'object') {
    continue;
  }
  const targetPath = typeof edit.path === 'string' ? edit.path.trim() : '';
  if (!targetPath) {
    throw new Error(`Edit #${index + 1} is missing a path.`);
  }
  if (!allowlist.has(targetPath)) {
    throw new Error(`Edit #${index + 1} targets ${targetPath}, which is not an allowed documentation file.`);
  }
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Edit #${index + 1} references ${targetPath}, but the file does not exist in the workspace.`);
  }
  const content = typeof edit.content === 'string' ? edit.content : null;
  if (content === null) {
    throw new Error(`Edit #${index + 1} for ${targetPath} is missing replacement content.`);
  }

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const finalContent = normalizedContent.endsWith('\n') ? normalizedContent : `${normalizedContent}\n`;

  fs.writeFileSync(targetPath, finalContent, 'utf8');

  applied.push({
    path: targetPath,
    justification:
      typeof edit.justification === 'string' && edit.justification.trim().length > 0
        ? edit.justification.trim()
        : null,
  });
}

const resultPayload = {
  summary: summary || (applied.length ? `Updated ${applied.length} documentation file${applied.length === 1 ? '' : 's'}.` : 'No documentation changes were applied.'),
  applied,
  follow_ups: followUps,
};

fs.writeFileSync(SUMMARY_PATH, JSON.stringify(resultPayload, null, 2));

console.log(`Codex doc sync applied ${applied.length} edit(s). Summary written to ${SUMMARY_PATH}.`);
