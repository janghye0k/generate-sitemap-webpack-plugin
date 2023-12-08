const escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/**
 * @param {string} text
 * @returns {string}
 */
function escape(text) {
  return Object.entries(escapeMap).reduce(
    (result, [target, transform]) =>
      result.replace(new RegExp(target, 'gi'), transform),
    text
  );
}

module.exports = {
  escape,
};
