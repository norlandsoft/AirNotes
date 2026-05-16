/**
 * ESLint 配置文件
 *
 * 基于 @umijs/lint 推荐配置，用于前端代码质量检查
 *
 * Created by ChaiMingXu, on 2026/3/29
 */

module.exports = {
  parser: require.resolve('@babel/eslint-parser'),
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    // 关闭可能导致大量告警的规则
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'no-console': 'off',
    'no-debugger': 'warn',
  },
  overrides: [
    {
      parser: require.resolve('@typescript-eslint/parser'),
      plugins: ['@typescript-eslint/eslint-plugin'],
      files: ['**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    babelOptions: {
      babelrc: false,
      configFile: false,
      browserslistConfigFile: false,
      presets: [require.resolve('@umijs/babel-preset-umi')],
    },
    requireConfigFile: false,
    warnOnUnsupportedTypeScriptVersion: false,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.umi/',
    '.umi-production/',
    'src/.umi/',
    'src/.umi-production/',
  ],
};
