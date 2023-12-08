const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const SitemapPlugin = require('../../src/index');

const entries = ['index'];
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
      urls: [
        'first',
        { loc: 'second.html', lastmod: '2023-12-11', priority: 0.3 },
      ],
    }),
    new CleanWebpackPlugin(),
    ...views,
  ],
};
