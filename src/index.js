const path = require('path');
const zlib = require('zlib');
const fs = require('fs');
const schema = require('./options.json');
const { validate } = require('schema-utils');
const { minimatch } = require('minimatch');
const { XMLBuilder } = require('fast-xml-parser');
const { WebpackError } = require('webpack');

/** @typedef {import("schema-utils/declarations/validate").Schema} Schema */
/** @typedef {import("webpack").Compiler} Compiler */

/**
 * @typedef {'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' |'never'} Changefreq
 */

/**
 * @typedef {Object} SitemapURL
 * @property {string} loc URL of the page (e.g. some/link). Sum of this value and baseURL must be less than 2,048 characters.
 * @property {string} [lastmod] The date of last modification of the page (e.g. 2023-12-08). This date should be in W3C Datetime format. This format allows you to omit the time portion, if desired, and use YYYY-MM-DD.
 * @property {number} [priority] The priority of this URL relative to other URLs on your site. Valid values range from 0.0 to 1.0.
 * @property {Changefreq} [changefreq] How frequently the page is likely to change.
 */

/**
 * @typedef {Omit<SitemapURL, 'loc'> | null | undefined} EmittedCallbackReturns
 */

/**
 * @callback EmittedCallback
 * @param {string} location URL location created by asset filename (e.g. http://your.site/emitted.html)
 * @returns {EmittedCallbackReturns}
 */

/**
 * @typedef {Object} Emitted
 * @property {EmittedCallback} callback
 * @property {string | ((asset: string) => boolean)} [pattern] Specific pattern to filter the asset (e.g. .html), This can be string (glob pattern) or you can provide function instead of string pattern
 */

/**
 * @typedef {Object} AdditionalOptions
 * @property {string} [filename] Name of the sitemap file emitted to your build output
 * @property {boolean} [format] Settings for format sitemap file
 * @property {boolean} [gzip] Generating a gzipped `.xml.gz` sitemap.  You can provide false to skip generating a gzipped. By default, both xml files are generated
 * @property {string | boolean} [lastmod] The date for <lastmod> on all urls. Can be overridden by url-specific lastmod config. If value is true, the current date will be used for all urls.
 * @property {number} [priority] A <priority> to be set globally on all locations. Can be overridden by url-specific priorty config.
 * @property {Changefreq} [changefreq] A <changefreq> to be set globally on all locations. Can be overridden by url-specific changefreq config.
 */

/**
 * @typedef {Object} PluginOptions
 * @property {string} baseURL Root URL of your site (e.g. https://your.site)
 * @property {Array<string | SitemapURL>} [urls] Optional array of locations on your site. These can be strings or you can provide object to customize each url.
 * @property {Emitted | boolean} [emitted] Optional object to customize each url by webpack emitted assets
 * @property {AdditionalOptions} [options] Optional object of configuration settings.
 */

const DEFAULT_PATTERN = '**/*.html';
const DEFAULT_NAME = 'sitemap.xml';
const DEFAULT_FORMAT = false;
const DEFAULT_GZIP = true;

const PLUGIN = 'GenerateSitemapWebpackPlugin';
/** @type {Record<string, { validate: (value: any) => boolean; schema: object }>} */
const URL_VALIDATION_MAP = {
  lastmod: {
    validate: (value) => typeof value === 'string',
    schema: schema.definitions.SitemapURL.properties.lastmod,
  },
  priority: {
    validate: (value) => 0 <= value && value <= 1,
    schema: schema.definitions.SitemapURL.properties.priority,
  },
  changefreq: {
    validate: (value) =>
      [
        'always',
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'never',
      ].includes(value),
    schema: schema.definitions.SitemapURL.properties.changefreq,
  },
};

const DEFAULT_CONFIG = {
  urls: [],
  emitted: true,
  options: {},
};

const MAX_URL_SIZE = 50000;

const XML_PREFIX = `<?xml version="1" encoding="UTF-8"?>\n`;

const XML_ATTRS = {
  sitemap: { '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9' },
};

class SitemapPlugin {
  /**
   * @private
   * @type {{baseURL: string; urls: Array<string | SitemapURL>; emitted: Emitted | boolean; options: AdditionalOptions}}
   */
  options;

  /**
   *
   * @param {PluginOptions} options
   */
  constructor(options) {
    const opts = { ...DEFAULT_CONFIG, ...(options || {}) };
    validate(/** @type {Schema} */ (schema), opts, {
      name: 'Sitemap Plugin',
      baseDataPath: 'options',
    });

    this.options = opts;
  }

  /**
   * @template T
   * @param {Array<T>} arr
   * @param {number} size
   * @returns {Array<T[]>}
   */
  chunkArray(arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  }

  /**
   *
   * @param {SitemapURL[]} arr
   */
  maxLastmod(arr) {
    return arr.reduce(
      /** @param {string | undefined} result */
      (result, url) => {
        if (!url.lastmod) return result;
        if (!result) return url.lastmod;
        const a = new Date(result);
        const b = new Date(url.lastmod);
        return a > b ? result : url.lastmod;
      },
      undefined
    );
  }

  /**
   * @private
   * @param {SitemapURL[]} sitemapURLs
   * @param {string} outputPath
   * @param {string} filename
   */
  createXMLSitemap(sitemapURLs, outputPath, filename = DEFAULT_NAME) {
    const ext = path.extname(filename);
    const basename = filename.substring(0, filename.length - ext.length);

    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const chunkURLs = this.chunkArray(sitemapURLs, MAX_URL_SIZE);
    const chunkSize = chunkURLs.length;

    const rootFilePath = path.join(outputPath, filename);

    const isGzip = this.options.options?.gzip ?? DEFAULT_GZIP;

    /** @type {Map<string, object>} */
    const xmlMap = new Map();
    const xmlBase = { ...XML_ATTRS.sitemap };
    if (chunkSize === 1) {
      const xml = { ...xmlBase, urlset: { url: sitemapURLs } };
      xmlMap.set(rootFilePath, xml);
    } else {
      // chunk case
      // create sitemapindex file

      const baseURL = this.options.baseURL;

      const xmlRoot = {
        ...xmlBase,
        sitemapindex: {
          sitemap: chunkURLs.map((chunkURL, index) => {
            // create chunked sitemap
            const chunkFilename = `${basename}${index + 1}${ext}`;
            const xml = { ...xmlBase, urlset: { url: chunkURL } };
            xmlMap.set(path.join(outputPath, chunkFilename), xml);

            // create sitemap instance
            const sitemap = {
              loc: baseURL + chunkFilename,
              lastmod: this.maxLastmod(chunkURL),
            };
            if (isGzip) sitemap.loc += '.gz';
            return sitemap;
          }),
        },
      };
      xmlMap.set(rootFilePath, xmlRoot);
    }

    const isFormat = this.options.options?.format ?? DEFAULT_FORMAT;

    xmlMap.forEach(async (xml, file) => {
      let data = XML_PREFIX + builder.build(xml);
      if (isFormat) data = data.replace(/\\n/gi, '');
      fs.writeFileSync(file, data, 'utf-8');

      if (!isGzip) return;
      const compressed = zlib.gzipSync(Buffer.from(data));
      fs.writeFileSync(file + '.gz', compressed);
    });
  }

  /** @param {Compiler} compiler */
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync(PLUGIN, (compilation, callback) => {
      if (compilation.options.mode !== 'production') return callback();

      const { baseURL, urls, emitted, options } = this.options;
      const { filename, lastmod, ...ele } = options;
      /** @type {Omit<SitemapURL, 'loc'>} */
      const commonURLOptions = ele;

      if (lastmod === true) {
        commonURLOptions.lastmod = new Date().toISOString();
      } else if (typeof lastmod === 'string')
        commonURLOptions.lastmod = lastmod;

      // Set baseURL
      const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
      this.options.baseURL = base;

      /** @type {SitemapURL[]} */
      const sitemapURLs = [];
      if (emitted !== false) {
        // add emitted url
        const emittedParam =
          emitted === true ? /**@type {any} */ ({}) : emitted;
        compilation.emittedAssets.forEach((assetName) => {
          const emittedCallback = emittedParam?.callback || (() => ({}));
          const pattern = emittedParam?.pattern || DEFAULT_PATTERN;

          if (typeof pattern === 'string') {
            if (!minimatch(assetName, pattern, { matchBase: true })) return;
          } else if (!pattern(assetName)) return;

          const location = base + assetName;
          const result = emittedCallback(location) || {};
          if (!result || typeof result !== 'object')
            compilation.errors.push(
              new WebpackError(
                `options.emitted.callback should be return object. not to be ${typeof result}`
              )
            );
          const url = { loc: location, ...commonURLOptions, ...result };
          const sitemapURL = Object.entries(url).reduce((obj, [k, v]) => {
            const item = URL_VALIDATION_MAP[k];
            if (item && !item.validate(v)) {
              compilation.errors.push(
                new WebpackError(`Invalid options.emitted.callback\nthis callback's returnValue.${k} should be follow below description\n\n${Object.entries(
                  item.schema
                )
                  .map(([key, desc]) => `${key}: ${desc}`)
                  .join('\n')}
          `)
              );
            }

            return { ...obj, [k]: v };
          }, /** @type {any} */ ({}));
          sitemapURLs.push(sitemapURL);
        });
      }

      // add custom url
      urls.forEach((url) => {
        const { loc, ...item } = typeof url === 'string' ? { loc: url } : url;
        const link = loc.startsWith('/') ? loc.slice(1) : loc;
        const sitemapURL = { loc: base + link, ...commonURLOptions, ...item };
        sitemapURLs.push(sitemapURL);
      });

      const sortedURLs = sitemapURLs
        .sort((a, b) => {
          const comapre = (b.priority ?? 0.5) - (a.priority ?? 0.5);
          return comapre;
        })
        .map(({ loc, lastmod, changefreq, priority }) => ({
          loc,
          lastmod,
          changefreq,
          priority,
        }));

      // create sitemap
      const outputPath = compilation.options.output.path;
      this.createXMLSitemap(
        sortedURLs,
        /** @type {any} */ (outputPath),
        filename
      );

      callback();
    });
  }
}

module.exports = SitemapPlugin;
