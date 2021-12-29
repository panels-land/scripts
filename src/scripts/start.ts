import c from 'chalk'
import { Spinner } from 'cli-spinner'

import {
  createPanelOSUplink,
  startDevServer,
  findPanelOS,
  wait,
  clearScreen,
  lime,
} from '../utils'

export const start = async () => {
  process.env.ROLLUP_WATCH = 'true'

  const panelOSInfo = await wait(
    'Looking for PanelOS on local network…',
    'Found PanelOS',
    findPanelOS()
  )

  const panelOSUplink = await wait(
    'Connecting to PanelOS…',
    'Connected to PanelOS',
    createPanelOSUplink(panelOSInfo)
  )

  let reconnecting = false
  let spinner: Spinner
  let lastCompileMs: number | undefined
  let publish = () => {}

  const updateScreen = (ms?: number, warning?: string | null) => {
    if (reconnecting) {
      return
    }
    lastCompileMs = ms
    clearScreen()
    if (warning) {
      console.info(c`{gray Dev server running with warning}\n`)
      console.info(c.yellow(warning))
    } else {
      console.info(c`{gray Dev server running}\n`)
    }
    spinner = new Spinner(
      lime.bold('%s ') +
        (ms
          ? c.gray('compiled in ') + lime.bold(ms) + lime('ms')
          : c.gray('compiling…'))
    )
    spinner.setSpinnerString(24)
    spinner.start()
  }

  panelOSUplink.onReconnect((reconnected, reason) => {
    spinner?.stop()
    clearScreen()
    reconnecting = true

    if (reason) {
      console.info(c`{gray PanelOS disconnected}\n`)
      console.info(c.red(reason))
    }

    wait(
      'Reconnecting to PanelOS…',
      'Reconnected to PanelOS',
      reconnected.then(() => {
        reconnecting = false
        publish()
        setTimeout(() => updateScreen(lastCompileMs), 1000)
      })
    )
  })

  const devServer = await wait(
    'Starting dev server…',
    'Dev server started.',
    startDevServer()
  )

  publish = () => {
    panelOSUplink.write({
      type: 'dev-server',
      payload: `http://${devServer.address}:${devServer.port}`,
    })
  }

  updateScreen()

  let warning: string | null = null
  devServer.onWarn(warn => {
    warning = warn
  })

  devServer.onCompiled(ms => {
    spinner?.stop()
    updateScreen(ms, warning)
    warning = null
  })

  publish()
}
