const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const SitemapPlugin = require('../../src/index');

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
  entry,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
  },
  plugins: [
    new SitemapPlugin({
      baseURL: 'http://localhost',
      emitted: {
        callback: (loc) => ({
          loc,
          priority: loc.includes('index') ? 1 : undefined,
          changefreq: 'yearly',
        }),
        ext: (asset) => asset.endsWith('.html') || asset.endsWith('.ejs'),
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
    new CleanWebpackPlugin(),
    ...views,
  ],
};
