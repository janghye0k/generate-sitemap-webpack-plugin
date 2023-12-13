import { webpack } from 'webpack';
import { generateConfig } from './utils/generate-config';
import SitemapPlugin from '../src';

describe('sitemap-generator-webpack-plugin', () => {
  it('test', (done) => {
    const config = generateConfig();
    config.plugins.push(
      new SitemapPlugin({
        baseURL: 'https://your.website',
      })
    );

    webpack(
      config,
      /** @param {import('webpack').Stats} stats */
      (err, stats) => {
        expect(err).toBeFalsy();

        const compilationErrors = (stats.compilation.errors || []).join('\n');
        expect(compilationErrors).toBe('');

        console.log(Object.keys(stats.compilation.assets));

        return done();
      }
    );
  });
});
