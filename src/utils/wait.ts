import chalk from 'chalk'
import { Spinner } from 'cli-spinner'

import { lime } from './lime'

export const wait = async <T>(
  enter: string,
  exit: string,
  promise: Promise<T>
): Promise<T> => {
  const spinner = new Spinner(lime.bold('%s ') + chalk.gray(enter))
  spinner.setSpinnerString(24)
  spinner.start()

  const result = await promise
  spinner.stop(true)
  console.info(lime.bold('✓ ') + chalk.gray(exit))
  return result
}
