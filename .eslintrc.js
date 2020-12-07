module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:react/recommended',
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['react', 'prettier', '@typescript-eslint'],
  settings: {
    react: {
      pragma: 'h'
    }
  },
  rules: {
    'react/no-unknown-property': ['error', { ignore: ['class', 'innerHTML'] }],
    'operator-linebreak': ['error', 'before'],
    'multiline-ternary': 0,
    'array-callback-return': 0
  }
}
