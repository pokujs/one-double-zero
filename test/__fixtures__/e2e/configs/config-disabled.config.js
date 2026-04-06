const { coverage } = require('../../../../lib/index.js');

/** @type {import('poku').PokuConfig} */
module.exports = {
  include: ['test/'],
  plugins: [
    coverage({
      config: false,
      reporters: ['text'],
      sources: ['**/src/**'],
    }),
  ],
};
