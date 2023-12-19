import { webpack } from 'webpack';
import { generateConfig, testRoot } from './utils/generate-config';
import SitemapPlugin from '../src';
import { loadXML } from './utils/xml';
import * as cases from './cases';
import fs from 'fs';
import path from 'path';

const baseURL = 'https://your.website';

describe('* Suite: check sitemap & build result is match', () => {
  it('CASE: only xml file created at production mode', (done) => {
    const config = generateConfig([{ name: 'index' }], 'devmode');
    config.mode = 'development';
    config.plugins.push(new SitemapPlugin({ baseURL }));

    webpack(config, (err, stats) => {
      if (err) expect(err).toBeFalsy();

      const compilationErrors = (stats.compilation.errors || []).join('\n');
      expect(compilationErrors).toBe('');

      const results = loadXML('sitemap.xml', 'devmode');
      // sitemap file should be exist
      expect(results).toBe(false);

      return done();
    });
  });

  Object.keys(cases).forEach((key) => {
    /** @type {{ items: Array<import('./utils/generate-config').EntryItem>; options: Omit<SitemapPlugin.PluginOptions, 'baseURL'> }} */
    // eslint-disable-next-line import/namespace
    const { items, options } = cases[key];

    const filename = options?.options?.filename || 'sitemap.xml';

    it(`CASE: ${key} example`, (done) => {
      const config = generateConfig(items, key);
      config.plugins.push(new SitemapPlugin({ baseURL, ...options }));

      webpack(
        config,
        /** @param {import('webpack').Stats} stats */
        (err, stats) => {
          if (err) expect(err).toBeFalsy();

          const compilationErrors = (stats.compilation.errors || []).join('\n');
          expect(compilationErrors).toBe('');

          const xmlRoot = loadXML(filename, key);
          // sitemap file should be exist
          expect(xmlRoot).not.toBe(false);

          const xmlDatas = [];
          if (Array.isArray(xmlRoot.sitemapindex?.sitemap)) {
            xmlRoot.sitemapindex.sitemap.forEach((item) => {
              const xml = loadXML(item.loc.replace(baseURL + '/', ''), key);
              expect(xml).not.toBe(false);
              xmlDatas.push(xml);
            });
          } else xmlDatas.push(xmlRoot);

          const locationSet = new Set();
          xmlDatas.forEach((xmlData) => {
            expect(Array.isArray(xmlData.urlset.url)).toBe(true);
            xmlData.urlset.url.forEach((url) => locationSet.add(url.loc));
          });

          if (Array.isArray(options?.urls)) {
            options.urls.forEach((url) => {
              const target =
                baseURL +
                `/${typeof url === 'string' ? url : url.loc}`.replace(
                  '//',
                  '/'
                );
              // custom url should be contained
              if (!locationSet.has(target)) console.log(url, target);
              expect(locationSet.has(target)).toBe(true);
              locationSet.delete(target);
            });
          }

          locationSet.forEach((item) => {
            const filePath = path.join(
              testRoot,
              'dist',
              key,
              item.replace(baseURL, '')
            );
            // emitted asset should be exist
            expect(fs.existsSync(filePath)).toBe(true);
          });

          return done();
        }
      );
    });
  });
});
