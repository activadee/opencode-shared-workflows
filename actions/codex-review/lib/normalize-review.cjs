'use strict';

const fs = require('fs');

const OUTPUT_PATH = process.env.CODEX_REVIEW_OUTPUT_PATH || 'codex-output.json';

if (!fs.existsSync(OUTPUT_PATH)) {
  throw new Error('codex-output.json is missing');
}

const MAX_FINDINGS = 10;
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

const rawOutput = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));

const coerceString = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeSeverity = (value) => {
  if (typeof value !== 'string') return 'medium';
  const lowered = value.trim().toLowerCase();
  return SEVERITY_ORDER.includes(lowered) ? lowered : 'medium';
};

const rawFindings = Array.isArray(rawOutput.findings) ? rawOutput.findings : [];
const normalizedFindings = [];

for (const finding of rawFindings) {
  if (!finding || typeof finding !== 'object') {
    continue;
  }

  if (normalizedFindings.length >= MAX_FINDINGS) {
    break;
  }

  const title = coerceString(finding.title);
  const details = coerceString(finding.details);
  if (!title && !details) {
    continue;
  }

  const severity = normalizeSeverity(finding.severity);
  const resolved = Boolean(finding.resolved);
  const files = Array.isArray(finding.files)
    ? finding.files.map(coerceString).filter(Boolean).slice(0, 5)
    : [];

  normalizedFindings.push({
    title: title || details.slice(0, 80) || 'General finding',
    details: details || title,
    severity,
    resolved,
    files,
  });
}

const summary =
  typeof rawOutput.summary === 'string' && rawOutput.summary.trim().length > 0
    ? rawOutput.summary.trim()
    : normalizedFindings.length > 0
      ? `Found ${normalizedFindings.length} finding${normalizedFindings.length === 1 ? '' : 's'} that should be reviewed.`
      : '✅ No issues found in the current changes.';

fs.writeFileSync('review-comments.json', JSON.stringify({ summary, findings: normalizedFindings }, null, 2));
