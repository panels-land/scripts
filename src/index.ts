import yargs from 'yargs'

import { build, start } from './scripts'

yargs
  .scriptName('panel')
  .usage('$0 <cmd> [args]')
  .command('build', 'build the project', build)
  .command('start', 'start developing the project', start)
  .demandCommand(1, '')
  .strict()
  .help().argv
