import type { NextConfig } from 'next'

const isDev = process.argv.indexOf('dev') !== -1
const isBuild = process.argv.indexOf('build') !== -1

const nextConfig: NextConfig = process.env.TURBOPACK_ROOT
  ? { turbopack: { root: process.env.TURBOPACK_ROOT } }
  : {}

// Velite must finish generating `.velite/` before Next compiles the app, so the
// config is an async function that awaits the content build first.
export default async function config(): Promise<NextConfig> {
  if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
    process.env.VELITE_STARTED = '1'
    const { build } = await import('velite')
    await build({ watch: isDev, clean: !isDev })
  }
  return nextConfig
}
