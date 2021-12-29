import net from 'net'

type Message = { type: string; payload?: any }

type MessageHandler = (message: Message) => void
type ReconnectHandler = (promise: Promise<void>, reason?: string) => void

export const createPanelOSUplink = async (info: {
  port: number
  address: string
}) => {
  const messageHandlers = new Set<MessageHandler>()
  const reconnectHandlers = new Set<ReconnectHandler>()

  let triggerReconnection = (_reason?: string) => {}
  let state: 'idle' | 'connected' | 'reconnecting' = 'idle'

  const createSocket = () => {
    const socket = new net.Socket()

    socket.on('connect', () => {
      state = 'connected'
    })

    socket.on('data', data =>
      messageHandlers.forEach(handler => handler(JSON.parse(data.toString())))
    )

    socket.on('close', () => {
      triggerReconnection()
    })

    return new Promise<net.Socket>((resolve, reject) => {
      socket.on('error', reject)
      socket.connect(info.port, info.address, () => resolve(socket))
    })
  }

  let socket = await createSocket()

  triggerReconnection = reason => {
    if (state === 'reconnecting') {
      return
    }

    state = 'reconnecting'

    const reconnect = async (): Promise<net.Socket> => {
      try {
        return await createSocket()
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return reconnect()
      }
    }

    const socketPromise = reconnect().then(s => {
      socket = s
    })

    reconnectHandlers.forEach(handler => handler(socketPromise, reason))
  }

  let forceReconnectTimeout: NodeJS.Timeout

  messageHandlers.add(message => {
    if (message.type !== 'ping') {
      return
    }
    socket.write(JSON.stringify({ type: 'pong' }))
    clearTimeout(forceReconnectTimeout)
    forceReconnectTimeout = setTimeout(() => {
      socket.end()
    }, 5000)
  })

  return {
    write: async (message: Message) => socket.write(JSON.stringify(message)),
    onMessage: (handler: MessageHandler) => {
      messageHandlers.add(handler)
      return () => messageHandlers.delete(handler)
    },
    onReconnect: (handler: ReconnectHandler) => {
      reconnectHandlers.add(handler)
      return () => reconnectHandlers.delete(handler)
    },
  }
}
