/* eslint-disable no-console */
import os from 'os'
import { promisify } from 'util'

import chalk from 'chalk'
// @ts-ignore
import cors from 'cors'
// @ts-ignore
import detect from 'detect-port-alt'
// @ts-ignore
import NollupDevServer from 'nollup/lib/dev-server'
// @ts-ignore
import NollupContext from 'nollup/lib/impl/NollupContext'
// @ts-ignore
import PluginErrorHandler from 'nollup/lib/impl/PluginErrorHandler'

import { log } from './log'
import { inputOptions, outputOptions } from './rollupOptions'

function getLocalNetworkAddress() {
  return Object.values(os.networkInterfaces())
    .flatMap(nInterface => nInterface ?? [])
    .filter(
      detail =>
        detail && detail.address && detail.family === 'IPv4' && !detail.internal
    )
    .map(detail => detail.address)?.[0]
}

function format(error: any) {
  if (typeof error !== 'object') {
    return String(error)
  }
  let output = ''

  if (error.pluginCode) {
    output += `${error.pluginCode}: `
  }

  if (error.message) {
    output += error.message
  }

  if (!error.loc && error.filename) {
    let appendment = ''
    appendment += error.filename.replace(process.cwd(), '')
    if (error.start)
      appendment += ` (${error.start.line}:${error.start.column})`

    output += `\n${chalk.white(appendment)}`
  }

  if (error.loc && error.loc.file) {
    let appendment = ''
    appendment += error.loc.file.replace(process.cwd(), '')
    appendment += ` (${error.loc.line}:${error.loc.column})`
    output += `\n${chalk.white(appendment)}`
  }

  if (error.frame) {
    output += `\n${chalk.white(error.frame)}`
  }

  return output
}

type CompiledHandler = (ms: number) => void
type WarnHandler = (warning: string) => void

const { invalidate } = NollupContext.prototype

NollupContext.prototype.invalidate = function (filePath: string) {
  invalidate.call(this, filePath)

  for (const [key, value] of Object.entries(this.watchFiles)) {
    if (filePath.startsWith(key)) {
      this.files[value].invalidate = true
      this.plugins.hooks.watchChange(filePath)
    }
  }
}

export const startDevServer = () =>
  new Promise<{
    port: number
    address: string
    onWarn: (handler: WarnHandler) => () => void
    onCompiled: (handler: CompiledHandler) => () => void
  }>(async resolve => {
    const compiledHandlers = new Set<CompiledHandler>()
    const warnHandlers = new Set<WarnHandler>()

    const originalLog = console.log.bind(console)
    const port: number = await promisify(detect)(3000, '0.0.0.0')
    const address = getLocalNetworkAddress()

    if (!address) {
      log.error('Could not find local network address')
      process.exit(1)
    }

    PluginErrorHandler.prototype.warn = (warning: any) => {
      const error = format(warning)
      warnHandlers.forEach(handler => handler(error))
    }

    console.log = (...args) => {
      const nollupLog: string = args.find(
        arg => typeof arg === 'string' && arg.startsWith('[Nollup]')
      )
      if (nollupLog) {
        let matches = nollupLog.match(/^\[Nollup\] Listening/)
        if (matches) {
          resolve({
            port,
            address,
            onCompiled: handler => {
              compiledHandlers.add(handler)
              return () => compiledHandlers.delete(handler)
            },
            onWarn: handler => {
              warnHandlers.add(handler)
              return () => warnHandlers.delete(handler)
            },
          })
          return
        }

        matches = nollupLog.match(/\[Nollup\] Compiled in (\d+)ms/)
        if (matches) {
          compiledHandlers.forEach(handler => handler(Number(matches![1])))
        } else {
          originalLog(`Panel ${nollupLog.substring('[Nollup]'.length).trim()}`)
        }
        return
      }
      originalLog(...args)
    }

    NollupDevServer({
      config: {
        ...inputOptions('development'),
        output: outputOptions,
      },
      verbose: false,
      hot: true,
      host: '0.0.0.0',
      hmrHost: `${address}:${port}`,
      port,
      contentBase: './public',
      before: (app: any) => {
        app.use(
          cors({
            origin: true,
            credentials: true,
          })
        )
      },
    })
  })
