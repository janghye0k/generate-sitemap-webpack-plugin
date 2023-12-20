export = SitemapPlugin;
declare class SitemapPlugin {
  /**
   *
   * @param {PluginOptions} options
   */
  constructor(options: PluginOptions);
  /**
   * @private
   * @type {PluginOptions & { emitted: boolean | EmittedOptions }}
   */
  private options;
  /**
   * @private
   * @type {Omit<SitemapURL, 'loc'>}
   */
  private commonURLOptions;
  /**
   * @private
   * @template T
   * @param {Array<T>} arr
   * @param {number} size
   * @returns {Array<T[]>}
   */
  private chunkArray;
  /**
   * @private
   * @param {SitemapURL[]} arr
   */
  private maxLastmod;
  /**
   * @private
   * @param {SitemapURL[]} sitemapURLs
   */
  private createSitemapData;
  /**
   * @private
   * @param {SitemapURL[]} sitemapURLs
   * @param {string} outputPath
   */
  private createXMLSitemap;
  /**
   * @private
   * @param {Compilation} compilation
   * @param {SitemapURL} sitemapURL
   */
  private validateURL;
  /**
   * Generate sitemap data ues emittedAssets
   * @private
   * @param {Compilation} compilation
   * @returns {SitemapURL[]}
   */
  private generateSitemapDataFromEmittedAssets;
  /**
   * Generate sitemap data by custom url options
   * @private
   * @returns {SitemapURL[]}
   */
  private generateSitemapDataFromURL;
  /**
   * @private
   * @param {Compilation} compilation
   * @returns {SitemapURL[]}
   */
  private generateSitemapDataFromChunks;
  /** @param {Compiler} compiler */
  apply(compiler: Compiler): void;
}
declare namespace SitemapPlugin {
  export {
    Schema,
    Compiler,
    Compilation,
    Changefreq,
    SitemapURL,
    EmittedCallbackReturns,
    EmittedCallback,
    EmittedOptions,
    ChunkCallback,
    ChunkOptions,
    AdditionalOptions,
    PluginOptions,
  };
}
type Schema = import('schema-utils/declarations/validate').Schema;
type Compiler = import('webpack').Compiler;
type Compilation = import('webpack').Compilation;
type Changefreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';
type SitemapURL = {
  /**
   * URL of the page (e.g. some/link). Sum of this value and baseURL must be less than 2,048 characters.
   */
  loc: string;
  /**
   * The date of last modification of the page (e.g. 2023-12-08). This date should be in W3C Datetime format. This format allows you to omit the time portion, if desired, and use YYYY-MM-DD.
   */
  lastmod?: string | undefined;
  /**
   * The priority of this URL relative to other URLs on your site. Valid values range from 0.0 to 1.0.
   */
  priority?: number | undefined;
  /**
   * How frequently the page is likely to change.
   */
  changefreq?: Changefreq | undefined;
};
type EmittedCallbackReturns = Omit<SitemapURL, 'loc'> | null | undefined;
type EmittedCallback = (location: string) => EmittedCallbackReturns;
type EmittedOptions = {
  callback: EmittedCallback;
  /**
   * Specific pattern to filter the asset (e.g. .html), This can be string (glob pattern) or you can provide function instead of string pattern
   */
  pattern?: string | ((asset: string) => boolean) | undefined;
};
type ChunkCallback = (
  name: string,
  hash: string
) => SitemapURL | string | undefined | null;
type ChunkOptions = {
  callback: ChunkCallback;
  /**
   * Options for add image sitemap (Default: true)
   */
  img: boolean;
};
type AdditionalOptions = {
  /**
   * Name of the sitemap file emitted to your build output
   */
  filename?: string | undefined;
  /**
   * Settings for format sitemap file
   */
  format?: boolean | undefined;
  /**
   * Generating a gzipped `.xml.gz` sitemap.  You can provide false to skip generating a gzipped. By default, both xml files are generated
   */
  gzip?: boolean | undefined;
  /**
   * The date for <lastmod> on all urls. Can be overridden by url-specific lastmod config. If value is true, the current date will be used for all urls.
   */
  lastmod?: string | boolean | undefined;
  /**
   * A <priority> to be set globally on all locations. Can be overridden by url-specific priorty config.
   */
  priority?: number | undefined;
  /**
   * A <changefreq> to be set globally on all locations. Can be overridden by url-specific changefreq config.
   */
  changefreq?: Changefreq | undefined;
};
type PluginOptions = {
  /**
   * Root URL of your site (e.g. https://your.site)
   */
  baseURL: string;
  /**
   * Optional array of locations on your site. These can be strings or you can provide object to customize each url.
   */
  urls?: (string | SitemapURL)[] | undefined;
  /**
   * Optional object to customize each url by webpack emitted assets
   */
  emitted?: boolean | EmittedOptions | undefined;
  /**
   * Optional object to customize each url by webpack chunk. You can use auxiliary file to make sitemap include image
   */
  chunk?: ChunkOptions | undefined;
  /**
   * Optional object of configuration settings.
   */
  options?: AdditionalOptions | undefined;
};
