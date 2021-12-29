/* eslint-disable guard-for-in */
/* eslint-disable radix */
/* eslint-disable no-bitwise */
import dgram from 'dgram'
import os from 'os'

type PanelOSInfo = { address: string; port: number; version: string }

const generateDevelopmentPort = (application: string) => {
  let hash = 0
  for (let i = 0; i < application.length; i++) {
    hash = (31 * hash + application.charCodeAt(i)) & 0xffff
  }
  while ((hash & 0xffff) < 0xff) {
    hash = (hash * 0xffff) & 0xffff
  }
  const serverPort = hash & 0xffff
  while ((hash & 0xffff) < 0xff || (hash & 0xffff) === serverPort) {
    hash = (hash * 0xffff) & 0xffff
  }
  return {
    clientPort: hash & 0xffff,
    serverPort,
  }
}

const getBroadcastAddresses = () => {
  const result = []
  const interfaces = os.networkInterfaces()
  for (const i in interfaces) {
    for (const data of interfaces[i]!) {
      if (data.family !== 'IPv4') {
        continue
      }
      if (data.address === '127.0.0.1') {
        continue
      }
      const address = data.address.split('.').map(e => parseInt(e))
      const netmask = data.netmask.split('.').map(e => parseInt(e))
      result.push(address.map((e, i) => (~netmask[i] & 0xff) | e).join('.'))
    }
  }
  return result
}

const socket = dgram.createSocket('udp4')

const application = 'panels'
const version = '1.0'

export const findPanelOS = () =>
  new Promise<PanelOSInfo>(resolve => {
    let interval: NodeJS.Timeout

    const { clientPort, serverPort } = generateDevelopmentPort(application)
    socket.on('message', (buffer, remoteInfo) => {
      if (buffer.length < 2 || buffer[0] !== 0xaf || buffer[1] !== 0xcf) {
        return
      }

      socket.close()
      clearInterval(interval)

      const info: PanelOSInfo = {
        address: remoteInfo.address,
        ...JSON.parse(buffer.slice(2).toString()),
      }

      resolve(info)
    })

    socket.on('listening', () => {
      socket.setBroadcast(true)
      const message = Buffer.alloc(application.length + version.length + 6)
      message.writeUInt8(0xaf, 0)
      message.writeUInt8(0xbf, 1)
      message.writeUInt16BE(application.length, 2)
      message.write(application, 4)
      message.writeUInt16BE(version.length, application.length + 4)
      message.write(version, application.length + 6)
      getBroadcastAddresses().forEach(address =>
        socket.send(message, serverPort, address)
      )
      interval = setInterval(
        () =>
          getBroadcastAddresses().forEach(address =>
            socket.send(message, serverPort, address)
          ),
        1000
      )
    })

    socket.bind(clientPort)
  })
