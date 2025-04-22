// commitlint.config.cjs
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep header limit if desired
    'header-max-length': [2, 'always', 100],
    // Disable body line length limit (or increase significantly, e.g., [2, 'always', 200])
    'body-max-line-length': [0, 'always', Infinity], // Rule disabled
    // Keep footer limit if desired
    'footer-max-line-length': [2, 'always', 100],
  },
};