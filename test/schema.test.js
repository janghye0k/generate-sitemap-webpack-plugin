import SitemapPlugin from '../src';
import { webpack } from 'webpack';
import { generateConfig } from './utils/generate-config';

const baseURL = 'https://your.website/';
const typeCase = {
  string: 'string',
  number: 123,
  boolean: true,
  array: [],
  object: {},
};

describe('* Suite: check plugin option schema', () => {
  test('CASE: check options.baseURL is undefined', () => {
    expect(() => new SitemapPlugin()).toThrow();
  });

  test('CASE: check options.urls is array', () => {
    const types = { ...typeCase };
    delete types.array;
    Object.values(types).forEach((urls) => {
      expect(() => new SitemapPlugin({ baseURL, urls })).toThrow();
    });
    expect(
      () => new SitemapPlugin({ baseURL, urls: [{ loc: 'test.html' }] })
    ).not.toThrow();
  });

  test('CASE: check options.url is string or SitemapURL', () => {
    const types = { ...typeCase };
    delete types.string;
    Object.values(types).forEach((url) => {
      expect(() => new SitemapPlugin({ baseURL, urls: [url] })).toThrow();
    });
    expect(
      () => new SitemapPlugin({ baseURL, urls: [{ loc: 'test.html' }] })
    ).not.toThrow();
  });

  test('CASE: check options.url.priority is in range(0, 1)', () => {
    const failValues = [-1, 1.5, 100, false, 'test'];
    failValues.forEach((value) =>
      expect(
        () =>
          new SitemapPlugin({
            baseURL,
            urls: [{ loc: 'test.html', priority: value }],
          })
      ).toThrow()
    );
    expect(
      () =>
        new SitemapPlugin({
          baseURL,
          urls: [{ loc: 'test.html', priority: 0.5 }],
        })
    ).not.toThrow();
  });

  const changefreqList = [
    'always',
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'never',
  ];

  test(`CASE: check options.url.changefreq in ${changefreqList.reduce(
    (acc, v, i) => `${acc}${i ? ' | ' : ''}'${v}'`
  )}`, () => {
    const failValues = ['today', 'week', false, 123];
    const changefreqListLength = changefreqList.length;
    [...changefreqList, ...failValues].forEach((value, index) => {
      const result = expect(
        () =>
          new SitemapPlugin({
            baseURL,
            urls: [{ loc: 'test.html', changefreq: value }],
          })
      );
      index < changefreqListLength ? result.not.toThrow() : result.toThrow();
    });
  });

  test('CASE: check options.emitted is boolean or Emitted object', () => {
    const { boolean, object, ...types } = typeCase;
    Object.values(types).forEach((emitted) => {
      expect(() => new SitemapPlugin({ baseURL, emitted })).toThrow();
    });
    [boolean, object].forEach((emitted) =>
      expect(() => new SitemapPlugin({ baseURL, emitted })).not.toThrow()
    );
  });

  test(`CASE: make sure options.emitted.pattern is the correct type`, () => {
    const successValues = ['**/*.html', () => true];
    const sucessValueLength = successValues.length;
    const types = { ...typeCase };
    delete types.string;
    const callback = (loc) => loc;
    [...successValues, ...Object.values(types)].forEach((pattern, index) => {
      const result = expect(
        () => new SitemapPlugin({ baseURL, emitted: { callback, pattern } })
      );
      index < sucessValueLength ? result.not.toThrow() : result.toThrow();
    });
  });

  test('CASE: check options.emitted.callback return correct value', (done) => {
    const config = generateConfig([{ name: 'index' }], 'emitted-incorrect');
    config.plugins.push(
      new SitemapPlugin({
        baseURL,
        emitted: { callback: () => ({ lastmod: false }) },
      }),
      new SitemapPlugin({
        baseURL,
        emitted: { callback: () => 123 },
      })
    );

    webpack(
      config,
      /** @param {import('webpack').Stats} stats */
      (err, stats) => {
        if (err) return done(err);
        const errors = stats.compilation.errors || [];
        expect(errors.length >= 2).toBe(true);
        return done();
      }
    );
  });

  test('CASE: check options.options.filename is string', () => {
    const types = { ...typeCase };
    delete types.string;
    Object.values(types).forEach((filename) => {
      expect(
        () => new SitemapPlugin({ baseURL, options: { filename } })
      ).toThrow();
    });
    expect(
      () => new SitemapPlugin({ baseURL, options: { filename: 'sitemap.xml' } })
    ).not.toThrow();
  });

  test('CASE: check options.options.format is boolean', () => {
    const { boolean, ...types } = typeCase;
    Object.values(types).forEach((format) => {
      expect(
        () => new SitemapPlugin({ baseURL, options: { format } })
      ).toThrow();
    });
    expect(
      () => new SitemapPlugin({ baseURL, options: { format: boolean } })
    ).not.toThrow();
  });

  test('CASE: check options.options.gzip is boolean', () => {
    const { boolean, ...types } = typeCase;
    Object.values(types).forEach((gzip) => {
      expect(() => new SitemapPlugin({ baseURL, options: { gzip } })).toThrow();
    });
    expect(
      () => new SitemapPlugin({ baseURL, options: { gzip: boolean } })
    ).not.toThrow();
  });
});
