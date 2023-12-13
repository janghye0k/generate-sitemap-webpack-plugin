import fs from 'fs';
import path from 'path';

/**
 * @param {string} target
 */
export function readFile(target) {
  const targetPath = path.resolve(__dirname, '..', 'dist', target);
  if (!fs.existsSync(targetPath)) return false;
  const fileText = fs.readFileSync(targetPath, {
    encoding: 'utf-8',
    flag: 'r',
  });

  const parser = new DOMParser();
  const results = parser.parseFromString(fileText, 'text/xml');
  return results;
}
