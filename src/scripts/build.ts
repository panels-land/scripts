import { performance } from 'perf_hooks'

import chalk from 'chalk'
import rollup from 'rollup'

import { inputOptions, outputOptions } from '../utils'

export const build = async () => {
  const now = performance.now()
  console.info(chalk.yellow('Creating production build…'))
  try {
    const bundle = await rollup.rollup(inputOptions)
    await bundle.write(outputOptions)

    console.info(
      chalk`{green Build completed in {bold ${(performance.now() - now).toFixed(
        2
      )}ms}.}\n`
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
      process.exit(1)
    }
    throw error
  }
}
