import nextConfig from 'eslint-config-next'

const config = [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      '.velite/**',
      'out/**',
      'build/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
]

export default config
