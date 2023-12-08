const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const publishDir = path.join(root, 'publish');

const stringPkg = fs
  .readFileSync(path.join(root, 'package.json'))
  .toString('utf-8');
const pkg = JSON.parse(stringPkg);
const deleteKeys = ['lint-staged'];
deleteKeys.forEach((key) => delete pkg[key]);
pkg.private = false;

if (fs.existsSync(publishDir))
  fs.rmSync(publishDir, { recursive: true, force: true });
fs.mkdirSync(publishDir);

fs.writeFileSync(
  path.join(publishDir, 'package.json'),
  Buffer.from(JSON.stringify(pkg, null, 2), 'utf-8')
);
fs.writeFileSync(
  path.join(publishDir, 'version.txt'),
  Buffer.from(pkg.version, 'utf-8')
);

const copyList = ['LICENSE', 'README.md', 'dist', 'types'];
copyList.forEach((item) => {
  fs.cpSync(path.join(root, item), path.join(publishDir, item), {
    recursive: true,
  });
});
