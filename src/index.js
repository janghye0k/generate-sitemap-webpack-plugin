const path = require('path');
const fs = require('fs');
const schema = require('./options.json');
const { escape } = require('./utils');
const { validate } = require('schema-utils');

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
 * @callback EmittedCallback
 * @param {string} location URL location created by asset filename (e.g. http://your.site/emitted.html)
 * @returns {string | SitemapURL}
 */

/**
 * @typedef {Object} Emitted
 * @property {EmittedCallback} callback
 * @property {string | ((asset: string) => boolean)} [ext] Specific file extensions to use the asset (e.g. .html), This can be string or you can provide function to filtering asset
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

const DEFAULT_ASSET_EXT = '.html';
const DEFAULT_NAME = 'sitemap.xml';
const PLUGIN = 'GenerateSitemapWebpackPlugin';

const defaultConfig = {
  urls: [],
  /** @type {{callback: EmittedCallback; ext: string}} */
  emitted: { callback: (location) => location, ext: DEFAULT_ASSET_EXT },
  options: {
    filename: DEFAULT_NAME,
  },
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
    validate(/** @type {Schema} */ (schema), options || {}, {
      name: 'Sitemap Plugin',
      baseDataPath: 'options',
    });

    // Set default options
    /** @type {any} */
    const opts = { ...defaultConfig };
    Object.keys(opts).forEach((key) => {
      // @ts-ignore
      opts[key] = Object.assign(opts[key], options[key] || {});
    });
    opts.baseURL = options?.baseURL;

    this.options = opts;
  }

  /**
   * @private
   * @param {SitemapURL[]} urls
   * @returns {string}
   */
  createXMLSitemap(urls = []) {
    const xmlUrls = urls
      .map((url) => {
        /** @type {Record<string, string>} */
        const items = {};
        Object.entries(url).forEach(([tagName, value]) => {
          const item =
            value !== undefined && value !== null
              ? `\n\t\t<${tagName}>${escape(`${value}`)}</${tagName}>`
              : '';
          items[tagName] = item;
        });
        const {
          loc = '',
          lastmod = '',
          changefreq = '',
          priority = '',
        } = items;
        return `\t<url>${loc + lastmod + changefreq + priority}\n\t</url>`;
      })
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlUrls}\n</urlset>`;
  }

  /** @param {Compiler} compiler */
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync(PLUGIN, (compilation, callback) => {
      if (compilation.options.mode !== 'production') return callback();

      const { baseURL, urls, emitted, options } = this.options;
      const { filename, ...commonURLOptions } = options || {};

      if (commonURLOptions.lastmod === true) {
        commonURLOptions.lastmod = new Date().toISOString();
      } else if (commonURLOptions.lastmod === false)
        delete commonURLOptions.lastmod;

      // Set baseURL
      const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;

      /** @type {SitemapURL[]} */
      const sitemapURLs = [];
      if (emitted !== false) {
        // add emitted url
        const emittedParam = emitted === true ? defaultConfig.emitted : emitted;
        compilation.emittedAssets.forEach((assetName) => {
          const callback = emittedParam.callback;
          const ext = emittedParam.ext || DEFAULT_ASSET_EXT;
          if (typeof ext === 'string') {
            if (!assetName.endsWith(ext)) return;
          } else if (!ext(assetName)) return;
          const location = base + assetName;
          const result = callback(location);
          const url = typeof result === 'string' ? { loc: result } : result;
          const sitemapURL = Object.assign({}, commonURLOptions, url);
          sitemapURLs.push(sitemapURL);
        });
      }

      // add custom url
      urls.forEach((url) => {
        const item = typeof url === 'string' ? { loc: url } : url;
        const link = item.loc.startsWith('/') ? item.loc.slice(1) : item.loc;
        const loc = base + link;
        const sitemapURL = Object.assign({}, commonURLOptions, item, { loc });
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
