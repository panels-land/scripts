import chalk from 'chalk'
import type {
  Node,
  ExportNamedDeclaration,
  ExportDefaultDeclaration,
  FunctionDeclaration,
  VariableDeclarator,
  Identifier,
} from 'estree'

type NamedExportValidator = (
  declaration: FunctionDeclaration | VariableDeclarator
) => void | {
  warning?: string
  error?: string
}

type NamedExportValidators = Record<string, NamedExportValidator>

const isExportNamedDeclaration = (node: Node): node is ExportNamedDeclaration =>
  node.type === 'ExportNamedDeclaration'

const isExportDefaultDeclaration = (
  node: Node
): node is ExportDefaultDeclaration => node.type === 'ExportDefaultDeclaration'

export const validatePanelAst = (
  name: string,
  ast: Node,
  namedExportValidators: NamedExportValidators
) => {
  const errors: Array<string> = []
  const warnings: Array<string> = []

  const executeValidator = (
    declaration: FunctionDeclaration | VariableDeclarator
  ) => {
    const exportName =
      declaration.type === 'FunctionDeclaration'
        ? declaration.id!.name
        : (declaration.id as Identifier).name

    if (!(exportName in namedExportValidators)) {
      warnings.push(
        chalk`{bold ${name}} has unknown exports ${exportName} that will be ignored.`
      )
      return
    }
    const result = namedExportValidators[exportName](declaration)
    if (result?.warning) {
      warnings.push(result.warning)
    }
    if (result?.error) {
      errors.push(result.error)
    }
  }

  if (ast.type !== 'Program') {
    errors.push(chalk`file {bold ${name}} is not valid`)
    return { warnings, errors }
  }

  const defaultExportDeclaration = ast.body.find(isExportDefaultDeclaration)

  if (!defaultExportDeclaration) {
    errors.push(chalk`Panel {bold ${name}} must have a default export.`)
    return { warnings, errors }
  }

  if (defaultExportDeclaration.declaration.type !== 'FunctionDeclaration') {
    errors.push(
      chalk`The default export of {bold ${name}} has to be a function`
    )
    return { warnings, errors }
  }

  for (const namedExportDeclaration of ast.body.filter(
    isExportNamedDeclaration
  )) {
    const { declaration } = namedExportDeclaration
    if (!declaration) {
      continue
    }

    if (declaration.type === 'ClassDeclaration') {
      warnings.push(
        chalk`the named export {bold ${
          declaration.id!.name
        }} of {bold ${name}} is not a variable nor function and will be ignored.`
      )
      continue
    }

    if (declaration.type === 'FunctionDeclaration') {
      executeValidator(declaration)
      continue
    }

    for (const declarator of declaration.declarations) {
      if (!('name' in declarator.id)) {
        continue
      }

      executeValidator(declarator)
    }
  }
  return { warnings, errors }
}
