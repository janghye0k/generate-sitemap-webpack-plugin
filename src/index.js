const path = require('path');
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
const PLUGIN = 'GenerateSitemapWebpackPlugin';
/** @type {Record<string, { validate: (value: any) => boolean; schema: object }>} */
const URL_VALIDATION_MAP = {
  loc: {
    validate: (value) => typeof value === 'string',
    schema: schema.definitions.SitemapURL.properties.loc,
  },
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

const defaultConfig = {
  urls: [],
  emitted: true,
  options: {},
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
    const opts = { ...defaultConfig, ...(options || {}) };
    validate(/** @type {Schema} */ (schema), opts, {
      name: 'Sitemap Plugin',
      baseDataPath: 'options',
    });

    this.options = opts;
  }

  /**
   * @private
   * @param {SitemapURL[]} sitemapURLs
   * @returns {string}
   */
  createXMLSitemap(sitemapURLs) {
    const xmlObject = {
      urlset: {
        '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        url: sitemapURLs,
      },
    };

    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    return `<?xml version="1" encoding="UTF-8"?>\n` + builder.build(xmlObject);
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
            if (!item.validate(v)) {
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
        const item = typeof url === 'string' ? { loc: url } : url;
        const link = item.loc.startsWith('/') ? item.loc.slice(1) : item.loc;
        const loc = base + link;
        const sitemapURL = { ...commonURLOptions, ...item, loc };
        sitemapURLs.push(sitemapURL);
      });

      const sortedURLs = sitemapURLs.sort((a, b) => {
        const comapre = (b.priority ?? 0.5) - (a.priority ?? 0.5);
        return comapre;
      });

      // create sitemap
      /** @type {any} */
      const outputPath = compilation.options.output.path;
      const sitemapPath = path.resolve(outputPath, filename || DEFAULT_NAME);
      fs.writeFileSync(sitemapPath, this.createXMLSitemap(sortedURLs), {
        encoding: 'utf8',
      });

      callback();
    });
  }
}

module.exports = SitemapPlugin;
