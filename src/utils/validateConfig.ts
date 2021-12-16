import chalk from 'chalk'
import type { Node } from 'estree'
import type { ModuleInfo } from 'rollup'

import { validatePanelAst } from './validatePanelAst'

export const validateConfig = (info: ModuleInfo, name: string) =>
  validatePanelAst(name, info.ast as Node, {
    size: declaration => {
      if (declaration.type === 'FunctionDeclaration') {
        return {
          error: chalk`the export {bold ${
            declaration.id!.name
          }} of {bold ${name}} must be a variable, not a function.`,
        }
      }

      if (!('name' in declaration.id)) {
        return
      }

      if (declaration.init?.type !== 'ObjectExpression') {
        return {
          error: chalk`the export {bold ${declaration.id.name}} of {bold ${name}} must be an object.`,
        }
      }

      const mandatoryKeys = ['width', 'height']

      const keys: Array<string> = []
      for (const property of declaration.init.properties) {
        if (property.key.type !== 'Identifier') {
          continue
        }

        keys.push(property.key.name)

        if (!mandatoryKeys.includes(property.key.name)) {
          continue
        }

        if (
          property.value.type !== 'Literal' ||
          typeof property.value.value !== 'number'
        ) {
          return {
            error: chalk`the key {bold ${property.key.name}} of export {bold ${declaration.id.name}} in file {bold ${name}} must be a number.`,
          }
        }
      }

      for (const mandatoryKey of mandatoryKeys) {
        if (!keys.includes(mandatoryKey)) {
          return {
            error: chalk`the export {bold ${declaration.id.name}} must have a {bold ${mandatoryKey}} key.`,
          }
        }
      }

      for (const key of keys) {
        if (!mandatoryKeys.includes(key)) {
          return {
            warning: chalk`the key {bold ${key}} of export {bold ${declaration.id.name}} in file {bold ${name}} is unknown and will be ignored.`,
          }
        }
      }
    },
  })
