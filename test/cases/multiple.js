export default {
  items: [{ name: 'index' }],
  options: {
    urls: Array.from({ length: 149999 }, (_, i) => ({
      loc: `${i}.html`,
      lastmod:
        i < 50000 ? `2023-12-${Math.floor(Math.random() * 31)}` : undefined,
    })),
  },
};
