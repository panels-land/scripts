import fs from 'fs'
import path from 'path'

import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import autoprefixer from 'autoprefixer'
import type { OutputOptions, RollupOptions } from 'rollup'
// @ts-ignore
import externalGlobals from 'rollup-plugin-external-globals'
import postcss from 'rollup-plugin-postcss'
// @ts-ignore
import tailwindcss from 'tailwindcss'

import { entryRollupPlugin } from './entryRollupPlugin'

const external = [
  '@panels/utils',
  '@panels/ui',
  'solid-js',
  'solid-js/web',
  'solid-js/store',
]

const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

export const inputOptions = (
  mode: 'production' | 'development'
): RollupOptions => ({
  input: '__PANELS__.ts',
  external:
    mode === 'production'
      ? id => !(id.startsWith('.') || path.isAbsolute(id))
      : external,
  watch: {
    exclude: ['**/node_modules/**/*', '**/__PANELS__.ts', '**/build/**/*'],
    chokidar: {
      ignored: ['**/node_modules/**/*', '**/__PANELS__.ts', '**/build/**/*'],
    },
  },
  plugins: [
    entryRollupPlugin(mode),
    nodeResolve(),
    commonjs(),
    postcss({
      plugins: [
        autoprefixer,
        tailwindcss({
          important: `[data-panel="${pkgJson.name}"]`,
          content: ['**/*.{ts,tsx,js,jsx}', '!build/**', '!node_modules/**'],
          corePlugins: {
            preflight: false,
          },
        }),
      ],
    }),
    babel({
      babelHelpers: 'bundled',
      presets: ['solid'],
      plugins: mode === 'development' ? ['solid-refresh/babel'] : [],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
    }),
    typescript(),

    mode === 'development' &&
      externalGlobals((id: string) => {
        if (external.includes(id)) {
          return `window._GLOBAL['${id}']`
        }
      }),
  ],
})

export const outputOptions: OutputOptions = {
  dir: 'build',
  format: 'esm',
  chunkFileNames: '_[name].js',
  entryFileNames: 'index.js',
}
