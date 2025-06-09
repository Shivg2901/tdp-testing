import * as fs from 'fs';
import * as path from 'path';

export const ALLOWED_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.pdf',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
];

export function getDirectories(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath)
    .filter((f) => fs.statSync(path.join(dirPath, f)).isDirectory());
}

export function getFiles(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath)
    .filter((f) => fs.statSync(path.join(dirPath, f)).isFile());
}

export function findFirstFileWithExtension(
  files: string[],
  extensions: string[],
): string | undefined {
  return files.find((f) =>
    extensions.some((ext) => f.toLowerCase().endsWith(ext)),
  );
}

export function findDifferentialExpressionFiles(files: string[]): string[] {
  return files.filter(
    (f) =>
      f === 'DifferentialExpression.csv' ||
      (f.startsWith('DifferentialExpression-') && f.endsWith('.csv')),
  );
}
