const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(`build sitemap-generator-webpack-plugin's examples`);

const examplePath = path.resolve(__dirname, '..', 'examples');
fs.readdirSync(examplePath).forEach((dir) => {
  console.log(`Build "${dir}" folder ...\n`);
  const configFile = path.join(examplePath, dir, 'webpack.config.js');
  const buffer = execSync(`npx webpack --config ${configFile}`);
  console.log(buffer.toString());
});

console.log('Success to build examples');
