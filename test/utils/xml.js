import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const isArrayKeys = ['url', 'sitemap'];

/**
 * @param {string} target
 * @param {string} [dir]
 */
export function loadXML(target, dir = '.') {
  const targetPath = path.resolve(__dirname, '..', 'dist', dir, target);
  if (!fs.existsSync(targetPath)) return false;
  const fileText = fs.readFileSync(targetPath, {
    encoding: 'utf-8',
    flag: 'r',
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => isArrayKeys.includes(name),
  });
  const results = parser.parse(fileText);
  return results;
}

/**
 * @param {string} target
 * @param {string} [dir]
 */
export function hasGzip(target, dir = '.') {
  const targetPath = path.resolve(__dirname, '..', 'dist', dir, `${target}.gz`);
  return fs.existsSync(targetPath);
}
