import fs from 'fs/promises'
import { promisify } from 'util'

import chalk from 'chalk'
import _glob from 'glob'
import type { Plugin } from 'rollup'

import { validateConfig } from './validateConfig'
import { validatePanel } from './validatePanel'

const glob = promisify(_glob)

export const entryRollupPlugin = (
  mode: 'development' | 'production'
): Plugin => {
  const panelsFiles: Array<string> = []

  const warnings: Array<string> = []
  const errors: Array<string> = []

  return {
    name: 'panels',
    resolveId(id) {
      if (id === '__PANELS__.ts') {
        return { id, external: false }
      }
    },
    async load(id) {
      if (id !== '__PANELS__.ts') {
        return
      }

      const { name, version } = JSON.parse(
        await fs.readFile('package.json', 'utf-8')
      )

      const filesGlobPattern = 'panels/**/!(_).{js,ts,jsx,tsx}'
      let files = await glob(filesGlobPattern)
      if (files.length === 0) {
        files = await glob(`src/${filesGlobPattern}`)
      }

      if (files.length === 0) {
        errors.push(
          `No panels found. Please create a panel in the "panels" or "src/panels" directory.`
        )
        return
      }

      const simplePanels: Array<string> = []
      const compoundPanels = new Map<string, Array<string>>()

      for (const rawFile of files) {
        const file = rawFile.substring('panels/'.length)

        if (file.match(/^index\.(jsx|tsx)$/)) {
          warnings.push(chalk`{bold panels/${file}} will be ignored`)
          continue
        }

        if (file.match(/\.(ts|js)$/)) {
          warnings.push(
            chalk`{bold only {bold tsx} or {bold jsx} files are valid panels, file {bold panels/${file}} will be ignored`
          )
          continue
        }

        const segments = file.split('/')
        switch (segments.length) {
          case 1: {
            simplePanels.push(file)
            break
          }
          case 2: {
            if (!compoundPanels.has(segments[0])) {
              compoundPanels.set(segments[0], [])
            }
            compoundPanels.get(segments[0])!.push(segments[1])
            break
          }
          default: {
            warnings.push(
              chalk`{bold panels/${file}} has an invalid folder structure an will be ignored`
            )
          }
        }
      }

      const imports: Array<string> = []
      const code: Array<string> = [
        `export const __version = "${version}"`,
        `export const __pkgName = "${name}"`,
      ]

      const processPanel = (name: string, path: string) => {
        imports.push(`import * as ${name}Data from './panels/${path}'`)

        code.push(`
          const { default: ${name}Panel, ...${name}Rest } = ${name}Data
          export const ${name} = {
            component: ${name}Panel,
            ...${name}Rest
          }
        `)
      }

      panelsFiles.push(...simplePanels)

      simplePanels.forEach(file =>
        processPanel(file.replace(/\.(jsx|tsx)$/, ''), file)
      )

      for (const [name, files] of compoundPanels) {
        const indexFile = files.find(file => file.match(/^index\.(jsx|tsx)$/))

        if (!indexFile) {
          warnings.push(
            chalk`{bold panels/${name}/index.jsx} is missing, so {bold panels/${name}} and will be ignored`
          )
          continue
        }

        panelsFiles.push(`${name}/${indexFile}`)
        processPanel(name, `${name}/${indexFile}`)

        const configFile = files.find(file =>
          file.match(/^config\.(jsx|tsx)$/i)
        )

        if (configFile) {
          panelsFiles.push(`${name}/${configFile}`)
          imports.push(
            `import * as ${name}ConfigData from './panels/${name}/${configFile}'`
          )

          code.push(`
            const { default: ${name}ConfigPanel, ...${name}ConfigRest } = ${name}ConfigData
            Object.assign(${name}, {
              config: {
                component: ${name}ConfigPanel,
                ...${name}ConfigRest,
              }
            })
          `)
        }
      }

      return `${imports.join('\n')}\n${code.join('\n')}`
    },
    buildEnd() {
      if (warnings.length > 0 || errors.length > 0) {
        console.info('')
      }

      if (warnings.length > 0) {
        console.warn(
          chalk`{yellow {underline Build warnings:}\n> ${warnings.join(
            '\n> '
          )}}\n`
        )
      }

      if (errors.length > 0) {
        throw new Error(
          chalk`{red {underline Build errors:}\n> ${errors.join('\n> ')}}\n`
        )
      }
    },

    moduleParsed(info) {
      if (mode === 'development') {
        return
      }
      const panelFile = panelsFiles.find(file => info.id.endsWith(file))
      if (!panelFile) {
        return
      }

      if (!info.ast) {
        return
      }

      const result = info.id.match(/\/Config\.(tsx|jsx)$/i)
        ? validateConfig(info.ast, panelFile)
        : validatePanel(info.ast, panelFile)

      warnings.push(...result.warnings)
      errors.push(...result.errors)
    },
  }
}
