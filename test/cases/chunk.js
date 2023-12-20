export default {
  items: [
    { name: 'index', assets: ['sample.png', 'move.gif'] },
    { name: 'skip' },
  ],
  options: {
    chunk: {
      callback: (name) => (name === 'skip' ? null : name + '.html'),
    },
    emitted: false,
    options: {
      format: true,
    },
  },
};
