import rollup from 'rollup'

import { inputOptions, outputOptions } from '../utils'

export const start = async () => {
  const watcher = rollup.watch({
    ...inputOptions,
    output: outputOptions,
  })

  watcher.on('event', event => {
    // eslint-disable-next-line default-case
    switch (event.code) {
      case 'BUNDLE_END': {
        event.result.close()
      }
    }
  })

  process.on('SIGINT', () => {
    watcher.close()
    process.exit(0)
  })
}
