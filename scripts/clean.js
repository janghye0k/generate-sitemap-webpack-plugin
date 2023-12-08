const path = require('path');
const fs = require('fs');

const deletePaths = ['dist', 'types'];
deletePaths.forEach((item) => {
  const distPath = path.resolve(__dirname, '..', item);
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true });
    fs.mkdirSync(distPath);
  }
});
