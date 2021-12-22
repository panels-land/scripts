import chalk from 'chalk'
import type { Node } from 'estree'
import type { ModuleInfo } from 'rollup'

import * as schemas from './schemas'
import { validatePanelAst } from './validatePanelAst'

export const validatePanel = (info: ModuleInfo, name: string) =>
  validatePanelAst(name, info.ast as Node, {
    sizes: declaration => {
      try {
        schemas.panel.size.parse(declaration)
      } catch {
        return {
          error: chalk`the export {bold sizes} of {bold ${name}} has an invalid shape`,
        }
      }
    },
    defaultConfig: declaration => {
      try {
        schemas.panel.defaultConfig.parse(declaration)
      } catch {
        return {
          error: chalk`the export {bold defaultConfig} of {bold ${name}} has an invalid shape`,
        }
      }
    },
    description: declaration => {
      try {
        schemas.panel.description.parse(declaration)
      } catch {
        return {
          error: chalk`the export {bold description} of {bold ${name}} has an invalid shape`,
        }
      }
    },
  })
