import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

/**
 * @typedef {Object} EntryItem
 * @property {string} name
 * @property {string[]} assets
 * @property {string} [viewExt]
 */

const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body></body>
</html>
`;

const testRoot = path.resolve(__dirname, '..');

/**
 *
 * @param {string} dir
 * @param {string} content
 * @returns
 */
function checkFile(dir, content = '') {
  const filePath = path.join(testRoot, 'fixtures', dir);
  const fileDir = path.dirname(filePath);
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(content, 'utf-8'));
  return filePath;
}

/**
 * @param {EntryItem} item
 * @param {string} [dir]
 */
function checkEntryItem(item, dir = '.') {
  const { name, assets = [], viewExt = 'html' } = item;
  const view = checkFile(`${dir}/${name}.${viewExt}`, htmlContent);
  const content = assets.reduce((acc, asset, index) => {
    const assetPath = `assets/${asset}`;
    checkFile(`${dir}/${assetPath}`);
    return acc + `import asset${index} from './${assetPath}';\n`;
  }, '');
  const js = checkFile(`${dir}/${name}.js`, content || '');
  return { js, view, name, viewExt };
}

/**
 * @param {EntryItem[]} items
 * @param {string} [dir]
 */
function generateConfig(items, dir = '.') {
  const views = [];
  const entry = {};

  items.forEach((item) => {
    const { js, view, name, viewExt } = checkEntryItem(item, dir);
    const htmlPlugin = new HtmlWebpackPlugin({
      chunks: [name],
      filename: `${name}.${viewExt}`,
      template: view,
    });
    views.push(htmlPlugin);

    entry[name] = js;
  });

  return {
    mode: 'production',
    entry,
    output: {
      path: path.join(testRoot, 'dist', dir),
      filename: '[name].js',
    },
    module: {
      rules: [
        {
          test: /\.(?:jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name]-[hash][ext]',
          },
        },
      ],
    },
    plugins: [new CleanWebpackPlugin(), ...views],
  };
}

export { generateConfig, testRoot };
