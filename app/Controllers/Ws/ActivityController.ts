import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import User from 'App/Models/User'
import { UserStatus } from 'App/types/types'

export const getUserRoom = (user: User): string => {
  return `user:${user.id}`
}

export default class ActivityController {
  public async onConnected({ socket, auth, logger }: WsContextContract) {
    // all connections for the same authenticated user will be in the room
    const room = getUserRoom(auth.user!)
    const userSockets = await socket.in(room).allSockets()

    // this is first connection for given user
    if (userSockets.size === 0) {
      socket.broadcast.emit('user:online', auth.user)
    }

    // add this socket to user room
    socket.join(room)
    // add userId to data shared between Socket.IO servers
    // https://socket.io/docs/v4/server-api/#namespacefetchsockets
    socket.data.userId = auth.user!.id
    socket.data.userStatus = UserStatus.Online

    const allSockets = await socket.nsp.except(room).fetchSockets()
    const onlineIds = new Set<string>()
    const dndIds = new Set<string>()

    for (const remoteSocket of allSockets) {
      if (remoteSocket.data.userStatus === UserStatus.Online) {
        onlineIds.add(remoteSocket.data.userId)
      } else if (remoteSocket.data.userStatus === UserStatus.DND) {
        dndIds.add(remoteSocket.data.userId)
      }
    }

    const onlineUsers = await User.findMany([...onlineIds])
    const dndUsers = await User.findMany([...dndIds])

    socket.emit('user:list', onlineUsers, dndUsers)
    socket.emit('user:online', auth.user)

    logger.info('new websocket connection')
  }

  public async onDisconnected({ socket, auth, logger }: WsContextContract, reason: string) {
    const room = getUserRoom(auth.user!)
    const userSockets = await socket.in(room).allSockets()

    // user is disconnected
    if (userSockets.size === 0) {
      // notify other users
      socket.broadcast.emit('user:offline', auth.user)
    }

    logger.info('websocket disconnected', reason)
  }

  public async changeStatus({ socket, auth }: WsContextContract, status: string) {
    socket.data.userStatus = status
    if (status === UserStatus.OFFLINE) {
      socket.broadcast.emit('user:offline', auth.user)
    } else {
      socket.broadcast.emit('user:receiveStatus', { ...(auth.user?.serialize() as User), status })
    }
  }
}
