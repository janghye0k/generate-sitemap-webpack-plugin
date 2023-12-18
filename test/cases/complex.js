export default {
  items: [
    { name: 'index' },
    { name: 'daily' },
    { name: 'ejs', viewExt: 'ejs' },
  ],
  options: {
    urls: [
      'string-url.html',
      {
        loc: 'location.html',
        lastmod: '2023-12-11',
        priority: 0.8,
        changefreq: 'monthly',
      },
      '/slashed.html',
    ],
    emitted: {
      callback: (location) =>
        location.includes('daily')
          ? { changefreq: 'daily' }
          : location.includes('ejs')
            ? { priority: 0.3 }
            : undefined,
      pattern: '**/*.{html,ejs}',
    },
    options: {
      filename: 'options.xml',
      lastmod: '2022-02-02',
      changefreq: 'yearly',
      priority: 0.6,
    },
  },
};
