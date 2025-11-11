import fs from 'node:fs';
import path from 'node:path';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface RenderTemplateOptions {
  templatePath: string;
  outputPath: string;
  variables: Record<string, string>;
}

export const renderTemplateFile = ({ templatePath, outputPath, variables }: RenderTemplateOptions) => {
  const template = fs.readFileSync(path.resolve(templatePath), 'utf8');
  let rendered = template;
  for (const [needle, replacement] of Object.entries(variables)) {
    const regex = new RegExp(escapeRegex(needle), 'g');
    rendered = rendered.replace(regex, replacement);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(path.resolve(outputPath), rendered, 'utf8');
};
