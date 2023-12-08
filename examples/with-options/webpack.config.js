const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const SitemapPlugin = require('../../src/index');

const entries = ['index', 'help'];
const entry = {};
const views = [];
entries.forEach((name) => {
  entry[name] = path.resolve(__dirname, `src/js/${name}.js`);

  const htmlPlugin = new HtmlWebpackPlugin({
    chunks: [name],
    minify: false,
    filename: `${name}.html`,
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
