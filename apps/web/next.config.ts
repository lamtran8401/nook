import { join } from 'node:path'

import type { NextConfig } from 'next'

const repo = join(import.meta.dirname, '..', '..')

const config: NextConfig = {
  transpilePackages: ['@nook/shared', '@nook/desk', '@nook/core', '@nook/engineering'],
  // the repo checks the types with its own tsc run, inside `bun run check`
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: repo,
  turbopack: { root: repo },
}

export default config
