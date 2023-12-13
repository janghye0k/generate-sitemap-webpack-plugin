import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

/**
 * @typedef {Object} EntryItem
 * @property {string} name
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
  fs.writeFileSync(filePath, Buffer.from(content, 'utf-8'));
  return filePath;
}

/**
 *
 * @param {EntryItem} item
 */
function checkEntryItem(item) {
  const { name, viewExt = 'html' } = item;
  const view = checkFile(`${name}.${viewExt}`, htmlContent);
  const js = checkFile(`${name}.js`, item.content || '');
  return { js, view, name, viewExt };
}

/**
 * @param {EntryItem[]} items
 */
function generateConfig(items = [{ name: 'index' }], assets = ['sample.png']) {
  const views = [];
  const entry = {};
  const assetImportText = assets.reduce((acc, asset, index) => {
    const assetPath = `assets/${asset}`;
    checkFile(assetPath);
    return acc + `import asset${index} from './${assetPath}'`;
  }, '');
  items.forEach((item, index) => {
    if (index === 0) item.content = assetImportText;
    const { js, view, name, viewExt } = checkEntryItem(item);
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
      path: path.join(testRoot, 'dist'),
      filename: '[name].js',
    },
    module: {
      rules: [
        {
          test: /\.(?:jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]',
          },
        },
      ],
    },
    plugins: [new CleanWebpackPlugin(), ...views],
  };
}

export { generateConfig };
