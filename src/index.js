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
/** @typedef {import("webpack").Compilation} Compilation */

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
 * @typedef {Object} EmittedOptions
 * @property {EmittedCallback} callback
 * @property {string | ((asset: string) => boolean)} [pattern] Specific pattern to filter the asset (e.g. .html), This can be string (glob pattern) or you can provide function instead of string pattern
 */

/**
 * @callback ChunkCallback
 * @param {string} name
 * @param {string} hash
 * @returns {SitemapURL | string | undefined | null}
 */

/**
 * @typedef {Object} ChunkOptions
 * @property {ChunkCallback} callback
 * @property {boolean} img Options for add image sitemap (Default: true)
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
 * @property {EmittedOptions | boolean} [emitted] Optional object to customize each url by webpack emitted assets
 * @property {ChunkOptions} [chunk] Optional object to customize each url by webpack chunk. You can use auxiliary file to make sitemap include image
 * @property {AdditionalOptions} [options] Optional object of configuration settings.
 */

const DEFAULT_PATTERN = '**/*.html';
const DEFAULT_NAME = 'sitemap.xml';
const DEFAULT_FORMAT = false;
const DEFAULT_GZIP = true;
const IMAGE_PATTERN =
  '**/*.{apng,avif,gif,jpg,jpeg,jfif,pjpeg,pjp,png,svg,webp,bmp,ico,cur,tif,tiff}';

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
  emitted: true,
};

const MAX_URL_SIZE = 50000;
const XML_PREFIX = `<?xml version="1" encoding="UTF-8"?>`;
const XML_ATTRS = {
  base: { '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9' },
  image: { '@_xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1' },
};

class SitemapPlugin {
  /**
   * @private
   * @type {PluginOptions & { emitted: boolean | EmittedOptions }}
   */
  options;
  /**
   * @private
   * @type {Omit<SitemapURL, 'loc'>}
   */
  commonURLOptions;

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

    // Set baseURL
    const { baseURL } = this.options;
    this.options.baseURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;

    // Set common options
    const { lastmod, changefreq, priority } = this.options.options || {};
    this.commonURLOptions = { lastmod: undefined, changefreq, priority };

    if (lastmod === true) {
      this.commonURLOptions.lastmod = new Date().toISOString();
    } else if (typeof lastmod === 'string')
      this.commonURLOptions.lastmod = lastmod;
  }

  /**
   * @private
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
   * @private
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
   */
  createSitemapData(sitemapURLs) {
    const imageURL = sitemapURLs.some(
      /** @param {any} url */
      (url) => Array.isArray(url['image:image'])
    );
    const data = {
      urlset: {
        ...XML_ATTRS.base,
        ...(imageURL ? XML_ATTRS.image : {}),
        url: sitemapURLs,
      },
    };
    return data;
  }

  /**
   * @private
   * @param {SitemapURL[]} sitemapURLs
   * @param {string} outputPath
   */
  createXMLSitemap(sitemapURLs, outputPath) {
    const filename = this.options.options?.filename || DEFAULT_NAME;

    const ext = path.extname(filename);
    const basename = filename.substring(0, filename.length - ext.length);
    const rootFilePath = path.join(outputPath, filename);
    const isFormat = this.options.options?.format ?? DEFAULT_FORMAT;
    const isGzip = this.options.options?.gzip ?? DEFAULT_GZIP;

    const builder = new XMLBuilder({
      format: isFormat,
      ignoreAttributes: false,
    });
    const chunkURLs = this.chunkArray(sitemapURLs, MAX_URL_SIZE);
    const chunkSize = chunkURLs.length;

    /** @type {Map<string, object>} */
    const xmlMap = new Map();
    if (chunkSize > 1) {
      // chunk case
      // create sitemapindex file
      const baseURL = this.options.baseURL;

      const xmlRoot = {
        ...XML_ATTRS.base,
        sitemapindex: {
          sitemap: chunkURLs.map((chunkURL, index) => {
            // create chunked sitemap
            const chunkFilename = `${basename}${index + 1}${ext}`;
            xmlMap.set(
              path.join(outputPath, chunkFilename),
              this.createSitemapData(chunkURL)
            );

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
    } else xmlMap.set(rootFilePath, this.createSitemapData(sitemapURLs));

    xmlMap.forEach(async (xml, file) => {
      const data = XML_PREFIX + (isFormat ? `\n` : '') + builder.build(xml);
      fs.writeFileSync(file, data, 'utf-8');

      if (!isGzip) return;
      const compressed = zlib.gzipSync(Buffer.from(data));
      fs.writeFileSync(file + '.gz', compressed);
    });
  }

  /**
   * Generate sitemap data ues emittedAssets
   * @private
   * @param {Compilation} compilation
   * @returns {SitemapURL[]}
   */
  generateSitemapDataFromEmittedAssets(compilation) {
    const { baseURL, emitted } = this.options;

    /** @type {SitemapURL[]} */
    const sitemapURLs = [];
    if (emitted === false) return sitemapURLs;

    // add emitted url
    const emittedParam = emitted === true ? /**@type {any} */ ({}) : emitted;
    const callback = emittedParam?.callback || (() => ({}));
    const pattern = emittedParam?.pattern || DEFAULT_PATTERN;

    compilation.emittedAssets.forEach((assetName) => {
      if (typeof pattern === 'string') {
        if (!minimatch(assetName, pattern, { matchBase: true })) return;
      } else if (!pattern(assetName)) return;

      const location = baseURL + assetName;
      const result = callback(location) || {};
      if (!result || typeof result !== 'object')
        compilation.errors.push(
          new WebpackError(
            `options.emitted.callback should be return object. not to be ${typeof result}`
          )
        );

      /** @type {SitemapURL} */
      const { loc, lastmod, changefreq, priority } = {
        loc: location,
        ...this.commonURLOptions,
        ...result,
      };
      const sitemapURL = Object.entries({
        loc,
        lastmod,
        changefreq,
        priority,
      }).reduce((obj, [k, v]) => {
        const item = URL_VALIDATION_MAP[k];
        if (item && v !== undefined && !item.validate(v)) {
          compilation.errors.push(
            new WebpackError(
              `Invalid options.emitted.callback\nthis callback's returnValue.${k} should be follow below description\n\n${Object.entries(
                item.schema
              )
                .map(([key, desc]) => `${key}: ${desc}`)
                .join('\n')}`
            )
          );
        }
        return { ...obj, [k]: v };
      }, /** @type {any} */ ({}));
      sitemapURLs.push(sitemapURL);
    });

    return sitemapURLs;
  }

  /**
   * Generate sitemap data by custom url options
   * @private
   * @returns {SitemapURL[]}
   */
  generateSitemapDataFromURL() {
    const URLs = this.options.urls || [];

    return URLs.map((url) => {
      const { loc: location, ...item } =
        typeof url === 'string' ? { loc: url } : url;
      const link = location.startsWith('/') ? location.slice(1) : location;
      const { loc, lastmod, changefreq, priority } = {
        loc: this.options.baseURL + link,
        ...this.commonURLOptions,
        ...item,
      };
      return { loc, lastmod, changefreq, priority };
    });
  }

  /**
   * @private
   * @param {Compilation['chunks']} chunks
   * @returns {SitemapURL[]}
   */
  generateSitemapDataFromChunks(chunks) {
    const { callback, img = true } = this.options.chunk || {};
    const { baseURL } = this.options;

    /** @type {SitemapURL[]} */
    const sitemapURLs = [];
    if (typeof callback !== 'function') return sitemapURLs;

    chunks.forEach((chunk) => {
      const { name, hash, auxiliaryFiles } = chunk;
      if (!name || !hash) return;
      const returnValues = callback(name, hash);
      if (!returnValues) return;

      const { loc, lastmod, changefreq, priority } = /** @type {SitemapURL} */ (
        typeof returnValues === 'string' ? { loc: returnValues } : returnValues
      );
      const location = loc.startsWith('/') ? loc.substring(1) : loc;
      /** @type {any} */
      const sitemapURL = {
        loc: baseURL + location,
        lastmod,
        changefreq,
        priority,
      };
      sitemapURLs.push(sitemapURL);

      if (!img) return;
      /** @type {string[]} */
      const images = [];
      auxiliaryFiles.forEach((file) => {
        if (minimatch(file, IMAGE_PATTERN, { matchBase: true }))
          images.push(file);
      });
      if (images.length === 0) return;

      sitemapURL['image:image'] = images.map((img) => ({
        'image:loc': baseURL + img,
      }));
    });

    return sitemapURLs;
  }

  /** @param {Compiler} compiler */
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync(PLUGIN, (compilation, callback) => {
      if (compilation.options.mode !== 'production') return callback();

      const sitemapURLs = [
        ...this.generateSitemapDataFromEmittedAssets(compilation),
        ...this.generateSitemapDataFromURL(),
        ...this.generateSitemapDataFromChunks(compilation.chunks),
      ].sort((a, b) => {
        const comapre = (b.priority ?? 0.5) - (a.priority ?? 0.5);
        return comapre;
      });

      // create sitemap
      const outputPath = compilation.options.output.path;
      this.createXMLSitemap(sitemapURLs, /** @type {any} */ (outputPath));

      callback();
    });
  }
}

module.exports = SitemapPlugin;
