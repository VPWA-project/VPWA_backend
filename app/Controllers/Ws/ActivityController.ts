import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import Channel from 'App/Models/Channel'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'
import { ChannelTypes } from '../Http/ChannelsController'

export default class ActivityController {
  private getUserRoom(user: User): string {
    return `user:${user.id}`
  }

  public async onConnected({ socket, auth, logger }: WsContextContract) {
    // all connections for the same authenticated user will be in the room
    const room = this.getUserRoom(auth.user!)
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

    const allSockets = await socket.nsp.except(room).fetchSockets()
    const onlineIds = new Set<string>()

    for (const remoteSocket of allSockets) {
      onlineIds.add(remoteSocket.data.userId)
    }

    const onlineUsers = await User.findMany([...onlineIds])

    socket.emit('user:list', onlineUsers)

    logger.info('new websocket connection')
  }

  public async createInvitation(
    { socket, auth }: WsContextContract,
    data: { channelId: string; userId: string }
  ) {
    const channel = await Channel.findOrFail(data.channelId)
    const invitedUser = await User.findOrFail(data.userId)

    const user = auth.user as User

    // check if user is not inviting himself
    if (user.id === data.userId) {
      throw new Error('You can not invite yourself')
    }

    // check if user is admin if channel is private
    if (user.id !== channel?.administratorId && channel?.type === ChannelTypes.Private) {
      throw new Error('Permission denied')
    }

    // check if user is already in given channel
    const isUserInChannel = !!(await channel.related('users').query()).find(
      (channelUser) => channelUser.id === data.userId
    )

    if (isUserInChannel) {
      throw new Error('User is already in the channel')
    }

    // delete ban if exist
    ;(await user.related('bannedChannels').query())
      .find((bannedChannel) => bannedChannel.id === channel?.id)
      ?.delete()

    // check if invited user was already invited to given channel
    const previousInvitation = (await channel.related('invitations').query()).find(
      (invitation) => invitation.userId === data.userId
    )

    if (previousInvitation) {
      throw new Error('User was already invited')
    }

    const invitation = await Invitation.create({
      ...data,
      invitedById: user.id,
    })

    const userRoom = this.getUserRoom(invitedUser)

    socket.to(userRoom).emit('invitation:receive', { ...invitation, invitedBy: user, channel })
  }

  public async onDisconnected({ socket, auth, logger }: WsContextContract, reason: string) {
    const room = this.getUserRoom(auth.user!)
    const userSockets = await socket.in(room).allSockets()

    // user is disconnected
    if (userSockets.size === 0) {
      // notify other users
      socket.broadcast.emit('user:online', auth.user)
    }

    logger.info('websocket disconnected', reason)
  }
}
