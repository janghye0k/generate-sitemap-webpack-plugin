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

          const results = loadXML(filename, key);
          // sitemap file should be exist
          expect(results).not.toBe(false);

          const skipMap = {};

          if (Array.isArray(options?.urls)) {
            options.urls.forEach((url) => {
              const target = typeof url === 'string' ? url : url.loc;
              const find = results.urlset.url.find((item) =>
                item.loc.includes(target)
              );
              // custom url should be contained
              expect(find).not.toBe(undefined);
              if (find) skipMap[find.loc] = true;
            });
          }

          results.urlset.url.forEach((item) => {
            if (skipMap[item.loc]) return;
            const filePath = path.join(
              testRoot,
              'dist',
              key,
              item.loc.replace(baseURL, '')
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
