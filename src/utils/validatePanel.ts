import chalk from 'chalk'
import type { Node } from 'estree'
import type { ModuleInfo } from 'rollup'

import { validatePanelAst } from './validatePanelAst'

export const validatePanel = (info: ModuleInfo, name: string) =>
  validatePanelAst(name, info.ast as Node, {
    defaultConfig: declaration => {
      if (
        declaration.type === 'FunctionDeclaration' ||
        !('name' in declaration.id)
      ) {
        return
      }

      if (!declaration.init) {
        return {
          error: chalk`the export {bold ${declaration.id.name}} of {bold ${name}} needs a value.`,
        }
      }

      if (
        declaration.init.type !== 'ObjectExpression' &&
        declaration.init.type !== 'ArrowFunctionExpression'
      ) {
        return {
          error: chalk`the export {bold ${declaration.id.name}} of {bold ${name}} has an invalid type. Only object expressions and arrow functions are allowed.`,
        }
      }
    },
    description: declaration => {
      if (
        declaration.type === 'FunctionDeclaration' ||
        !('name' in declaration.id)
      ) {
        return
      }

      if (!declaration.init) {
        return {
          error: chalk`the export {bold ${declaration.id.name}} of {bold ${name}} needs a value.`,
        }
      }

      if (
        declaration.init.type !== 'Literal' &&
        declaration.init.type !== 'ArrowFunctionExpression'
      ) {
        return {
          error: chalk`the export {bold ${declaration.id.name}} of {bold ${name}} has an invalid type. Only string literals and arrow functions are allowed.`,
        }
      }
    },
  })
