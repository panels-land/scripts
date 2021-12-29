import chalk from 'chalk'

export const log = {
  warn: (message: string) => console.warn(chalk`{yellow ${message}}`),
  error: (message: string) => console.error(chalk`{red ${message}}`),
  info: (message: string) => console.info(chalk`{blue ${message}}`),
  success: (message: string) => console.info(chalk`{green ${message}}`),
}
