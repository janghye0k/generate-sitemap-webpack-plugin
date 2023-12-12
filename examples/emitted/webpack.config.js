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
          priority: loc.includes('index') ? 1 : 0.5,
          changefreq: 'yearly',
        }),
        pattern: `**/*.{html,ejs}`,
      },
    }),
    new CleanWebpackPlugin(),
    ...views,
  ],
};
