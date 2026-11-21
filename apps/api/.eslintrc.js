module.exports = {
  extends: [require.resolve('@repo/shared-config/eslint/nest')],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'jest.config.js', 'dist'],
};
