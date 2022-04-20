import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import Channel from 'App/Models/Channel'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'
import { ChannelTypes } from '../Http/ChannelsController'
import { getUserRoom } from './ActivityController'

export default class InvitationsController {
  public async onConnected({ socket, auth }: WsContextContract) {
    const userRoom = getUserRoom(auth.user!)

    socket.join(userRoom)
  }

  /**
   * Creates new invitation
   */
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

    const userRoom = getUserRoom(invitedUser)

    socket.to(userRoom).emit('invitation:receive', { ...invitation, invitedBy: user, channel })
  }
}
