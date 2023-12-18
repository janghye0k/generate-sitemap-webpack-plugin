<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![install size](https://packagephobia.com/badge?p=sitemap-generator-webpack-plugin)](https://packagephobia.com/result?p=sitemap-generator-webpack-plugin)

# sitemap-generator-webpack-plugin

Webpack plugin to generate a sitemap.

## Getting Started

To begin, you'll need to install sitemap-generator-webpack-plugin:

```shell
npm install sitemap-generator-webpack-plugin --save-dev
```

```shell
yarn add -D sitemap-generator-webpack-plugin
```

```shell
pnpm add -D sitemap-generator-webpack-plugin
```

Then add the plugin to your webpack config. For example:

**webpack.config.js**

```javascript
const SitemapPlugin = require('sitemap-generator-webpack-plugin');

module.exports = {
  plugins: [new SitemapPlugin({ baseURL: 'https://your.website' })],
};
```

**sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your.website/index.html</loc>
  </url>
</urlset>
```

> **Note**
>
> `sitemap-generator-webpack-plugin` is to use files that already exist in the source tree, as part of the build process.

> **Note**
>
> If you want to add custom locations for sitemap.xml, you can use urls options

<br/>
<br/>

## Usage

The plugin's signature:

**webpack.config.js**

```javascript
const SitemapPlugin = require('sitemap-generator-webpack-plugin');

module.exports = {
  plugins: [new SitemapPlugin({ baseURL, urls, emitted, options })],
};
```

- **[`baseURL`](#baseURL)**
- **[`urls`](#urls)**
- **[`emitted`](#emitted)**
- **[`options`](#options)**

<br/>

### `baseURL` <small>(required)</small>

Root URL of your site (e.g. https://your.website)

Type: `string`

<br/>

### `urls`

Optional array of locations on your site. These can be strings or you can provide object to customize each url.

Type:

```typescript
type urls = Array<string | SitemapURL>;

type SitemapURL = {
  loc: string;
  lastmod?: string;
  priority?: number;
  changefreq?: Changefreq;
};
```

> **Note**
>
> If you provide the object in array, the following attributes may be set on each path object.

| Name                 | Type     | Default     | Description                                                                                                                                                                                                     |
| -------------------- | -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loc`<br/>(required) | `string` | N/A         | URL of the page (e.g. some/link). Sum of this value and baseURL must be less than 2,048 characters.                                                                                                             |
| `lastmod`            | `string` | `undefined` | The date of last modification of the page (e.g. 2023-12-08). This date should be in W3C Datetime format. This format allows you to omit the time portion, if desired, and use YYYY-MM-DD.                       |
| `priority`           | `number` | `undefined` | The priority of this URL relative to other URLs on your site. Valid values range from 0.0 to 1.0.                                                                                                               |
| `changefreq`         | `string` | `undefined` | How frequently the page is likely to change. List of applicable values based on [sitemaps.org](https://www.sitemaps.org/protocol.html):<br/>`always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never` |

<br/>

### `emitted`

Optional object to customize each url by webpack emitted assets. If you set to boolean `true`, the emitted all `.html` file being used

- **[`callback`](#callback)**
- **[`pattern`](#pattern)**

#### `callback`

Callback function for use emitted asset filename

Type:

```typescript
type callback = (location: string) => string | SitemapURL;
```

<small>

- **[sitemapURL](#urls)**

</small>

Default:

```javascript
const callback = (location) => location;
```

#### `pattern`

Specific pattern to filter the asset (e.g. .html), This can be string (glob pattern) or you can provide function instead of string pattern

Type:

```typescript
type pattern = string | ((asset: string) => boolean) | undefined;
```

Default: `**/*.html`

> Note
>
> `pattern` use glob pattern to filter asset.
> For more information, follow the links below
>
> - [Glob Pattern Reference | Visual Studio Code](https://code.visualstudio.com/docs/editor/glob-patterns)
> - [Featrues | minimatch](https://github.com/isaacs/minimatch#features)

<br/>

### `options`

Optional object of configuration settings.

| Name         | Type                 | Default       | Description                                                                                                                                         |
| ------------ | -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filename`   | `string`             | `sitemap.xml` | Name of the sitemap file emitted to your build output                                                                                               |
| `lastmod`    | `string` / `boolean` | `false`       | The date for <lastmod> on all urls. Can be overridden by url-specific lastmod config. If value is true, the current date will be used for all urls. |
| `priority`   | `number`             | `undefined`   | A <priority> to be set globally on all locations. Can be overridden by url-specific priorty config.0.                                               |
| `changefreq` | `string`             | `undefined`   | A <changefreq> to be set globally on all locations. Can be overridden by url-specific changefreq config.                                            |

[npm]: https://img.shields.io/npm/v/sitemap-generator-webpack-plugin.svg
[npm-url]: https://www.npmjs.com/package/sitemap-generator-webpack-plugin
[node]: https://img.shields.io/node/v/sitemap-generator-webpack-plugin.svg
[node-url]: https://nodejs.org
[size]: https://packagephobia.now.sh/badge?p=sitemap-generator-webpack-plugin
[size-url]: https://packagephobia.now.sh/result?p=sitemap-generator-webpack-plugin

## Examples

**webpack.config.js**

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SitemapPlugin = require('sitemap-generator-webpack-plugin');

const entries = ['index', 'help', 'ejs'];
const entry = {};
const views = [];
entries.forEach((name) => {
  entry[name] = path.resolve(__dirname, `src/js/${name}.js`);

  const htmlPlugin = new HtmlWebpackPlugin({
    chunks: [name],
    minify: false,
    filename: `${name}.${name.includes('ejs') ? 'ejs' : 'html'}`,
    template: path.resolve(__dirname, `src/views/${name}.ejs`),
  });

  views.push(htmlPlugin);
});

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve(__dirname, 'path/to/index.js')
    entry: path.resolve(__dirname, 'path/to/entry.js')
    ejs: path.resolve(__dirname, 'path/to/ejs.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
  },
  plugins: [
    new SitemapPlugin({
      baseURL: 'https://your.website',
      emitted: {
        callback: (location) => ({
          priority: location.includes('index') ? 1 : undefined,
          changefreq: 'yearly',
        }),
        pattern: `**/*.{html,ejs}`,
      },
      urls: [
        'first',
        { loc: 'second.html', lastmod: '2023-12-11', priority: 0.3 },
      ],
      options: {
        filename: 'my-sitemap.xml',
        changefreq: 'monthly',
        lastmod: true,
        priority: 0.6,
      },
    }),
    new HtmlWebpackPlugin({
      chunks: ['index'],
      filename: 'index.html',
      template: path.resolve(__dirname, 'path/to/index.html'),
    }),
    new HtmlWebpackPlugin({
      chunks: ['entry'],
      filename: 'entry.html',
      template: path.resolve(__dirname, 'path/to/entry.html'),
    }),
    new HtmlWebpackPlugin({
      chunks: ['ejs'],
      filename: 'ejs.ejs',
      template: path.resolve(__dirname, 'path/to/ejs.html'),
    }),
  ],
};
```

**my-sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>https://your.website/index.html</loc>
		<lastmod>2023-12-11T03:29:51.291Z</lastmod>
		<changefreq>yearly</changefreq>
		<priority>1</priority>
	</url>
	<url>
		<loc>https://your.website/first</loc>
		<lastmod>2023-12-11T03:29:51.291Z</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.6</priority>
	</url>
	<url>
		<loc>https://your.website/entry.html</loc>
		<lastmod>2023-12-11T03:29:51.291Z</lastmod>
		<changefreq>yearly</changefreq>
	</url>
	<url>
		<loc>https://your.website/ejs.ejs</loc>
		<lastmod>2023-12-11T03:29:51.291Z</lastmod>
		<changefreq>yearly</changefreq>
	</url>
	<url>
		<loc>https://your.website/second.html</loc>
		<lastmod>2023-12-11</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.3</priority>
	</url>
</urlset>
```

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/sitemap-generator-webpack-plugin.svg
[npm-url]: https://npmjs.com/package/sitemap-generator-webpack-plugin
[node]: https://img.shields.io/node/v/sitemap-generator-webpack-plugin.svg
[node-url]: https://nodejs.org
