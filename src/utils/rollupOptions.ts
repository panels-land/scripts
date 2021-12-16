import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import autoprefixer from 'autoprefixer'
import type { OutputOptions, RollupOptions } from 'rollup'
import del from 'rollup-plugin-delete'
import postcss from 'rollup-plugin-postcss'
// @ts-ignore
import tailwindcss from 'tailwindcss'

import { entryRollupPlugin } from './entryRollupPlugin'

const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

export const inputOptions: RollupOptions = {
  input: 'panels.ts',
  external: id => !(id.startsWith('.') || path.isAbsolute(id)),
  treeshake: 'smallest',
  plugins: [
    del({
      targets: ['build/**/*'],
    }),
    entryRollupPlugin(),
    postcss({
      plugins: [
        autoprefixer,
        tailwindcss({
          important: `.panel-${crypto
            .createHash('md5')
            .update(pkgJson.name)
            .digest('hex')
            .substring(0, 8)}`,
          content: ['**/*.{ts,tsx}', '!build/**', '!node_modules/**'],
          corePlugins: {
            preflight: false,
          },
        }),
      ],
    }),
    babel({
      babelHelpers: 'bundled',
      presets: ['solid'],
      extensions: ['.ts', '.tsx'],
    }),
    typescript(),
  ],
}

export const outputOptions: OutputOptions = {
  dir: 'build',
  format: 'esm',
  chunkFileNames: '_[name].js',
  entryFileNames: 'index.js',
}
