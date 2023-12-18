export default {
  items: [
    { name: 'index' },
    { name: 'daily' },
    { name: 'ejs', viewExt: 'ejs' },
  ],
  options: {
    emitted: {
      pattern: /** @param {string} asset */ (asset) => asset.endsWith('.ejs'),
    },
  },
};
