export = SitemapPlugin;
declare class SitemapPlugin {
  /**
   *
   * @param {PluginOptions} options
   */
  constructor(options: PluginOptions);
  /**
   * @private
   * @type {{baseURL: string; urls: Array<string | SitemapURL>; emitted: Emitted | boolean; options: AdditionalOptions}}
   */
  private options;
  /**
   * @private
   * @param {SitemapURL[]} urls
   * @returns {string}
   */
  private createXMLSitemap;
  /** @param {Compiler} compiler */
  apply(compiler: Compiler): void;
}
declare namespace SitemapPlugin {
  export {
    Schema,
    Compiler,
    Changefreq,
    SitemapURL,
    EmittedCallback,
    Emitted,
    AdditionalOptions,
    PluginOptions,
  };
}
type Schema = import('schema-utils/declarations/validate').Schema;
type Compiler = import('webpack').Compiler;
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
type EmittedCallback = (location: string) => string | SitemapURL;
type Emitted = {
  callback: EmittedCallback;
  /**
   * Specific file extensions to use the asset (e.g. .html), This can be string or you can provide function to filtering asset
   */
  ext?: string | ((asset: string) => boolean) | undefined;
};
type AdditionalOptions = {
  /**
   * Name of the sitemap file emitted to your build output
   */
  filename?: string | undefined;
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
  emitted?: boolean | Emitted | undefined;
  /**
   * Optional object of configuration settings.
   */
  options?: AdditionalOptions | undefined;
};
