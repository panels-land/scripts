import fs from 'fs/promises'
import path from 'path'

import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'build/index.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node',
  },
  external: id => !(id.startsWith('.') || path.isAbsolute(id)),
  plugins: [
    typescript(),
    {
      async writeBundle(options) {
        await fs.chmod(options.file, '755')
      },
    },
  ],
})
