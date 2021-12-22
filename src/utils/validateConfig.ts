import chalk from 'chalk'
import type { Node } from 'estree'
import type { ModuleInfo } from 'rollup'

import * as schemas from './schemas'
import { validatePanelAst } from './validatePanelAst'

export const validateConfig = (info: ModuleInfo, name: string) =>
  validatePanelAst(name, info.ast as Node, {
    size: declaration => {
      try {
        schemas.config.size.parse(declaration)
      } catch {
        return {
          error: chalk`the export {bold size} of {bold ${name}} has an invalid shape`,
        }
      }
    },
  })
