export default {
  items: [
    { name: 'index' },
    { name: 'daily' },
    { name: 'ejs', viewExt: 'ejs' },
  ],
  options: {
    emitted: {
      callback: (location) =>
        location.includes('daily')
          ? { changefreq: 'daily' }
          : location.includes('ejs')
            ? { priority: 0.3 }
            : undefined,
      pattern: '**/*.{html,ejs}',
    },
  },
};
