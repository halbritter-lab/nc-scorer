// commitlint.config.cjs
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep header limit if desired
    'header-max-length': [2, 'always', 100],
    // Disable body line length limit (or keep increased limit)
    'body-max-line-length': [0, 'always', Infinity],
    // Disable footer line length limit
    'footer-max-line-length': [0, 'always', Infinity], // <-- CHANGE THIS LINE (Set level to 0)
  },
};