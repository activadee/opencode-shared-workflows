import fs from 'node:fs';
import path from 'node:path';

export const readFileIfExists = (filePath: string): string | undefined => {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  return fs.readFileSync(filePath, 'utf8');
};

export const readPromptFile = (relativePath: string): string => {
  const absPath = path.resolve(relativePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Prompt file not found: ${absPath}`);
  }
  return fs.readFileSync(absPath, 'utf8');
};

export const writeFile = (filePath: string, contents: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
};
