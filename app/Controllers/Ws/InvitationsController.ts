import Database from '@ioc:Adonis/Lucid/Database'
import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import Channel from 'App/Models/Channel'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'
import { InvitationStatus } from 'App/types/types'
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
    data: { channelId: string; userId?: string; nickname?: string }
  ) {
    const channel = await Channel.findOrFail(data.channelId)
    const invitedUser =
      (data.userId ? await User.find(data.userId) : null) ||
      (await User.findByOrFail('nickname', data.nickname))

    const user = auth.user as User

    // check if user is not inviting himself
    if (user.id === invitedUser.id) {
      throw new Error('You can not invite yourself')
    }

    // check if user is admin if channel is private
    if (user.id !== channel?.administratorId && channel?.type === ChannelTypes.Private) {
      throw new Error('Permission denied')
    }

    // check if user is already in given channel
    const isUserInChannel = !!(await channel.related('users').query()).find(
      (channelUser) => channelUser.id === invitedUser.id
    )

    if (isUserInChannel) {
      throw new Error('User is already in the channel')
    }

    // delete ban if exist
    const bannedChannel = (await invitedUser.related('bannedChannels').query()).find(
      (c) => c.id === channel.id
    )

    const trx = await Database.transaction()

    try {
      if (bannedChannel) await invitedUser.related('bannedChannels').detach([bannedChannel.id], trx)

      // check if invited user was already invited to given channel
      const previousInvitation = (await channel.related('invitations').query()).find(
        (invitation) => invitation.userId === invitedUser.id
      )

      if (previousInvitation) {
        throw new Error('User was already invited')
      }

      const invitation = await Invitation.create(
        {
          channelId: channel.id,
          userId: invitedUser.id,
          invitedById: user.id,
        },
        { client: trx }
      )

      await trx.commit()

      await invitation.load('channel')

      const userRoom = getUserRoom(invitedUser)

      socket.to(userRoom).emit('invitation:receive', { ...invitation, invitedBy: user, channel })
    } catch (err) {
      await trx.rollback()
      throw err
    }
  }

  /**
   * Accepts or declines invitation
   */
  public async resolve(
    { auth, socket, logger }: WsContextContract,
    data: { id: string; status: InvitationStatus }
  ) {
    if (!Object.values(InvitationStatus).includes(data.status))
      throw Error('Invalid invitation status')

    const trx = await Database.transaction()

    try {
      const invitation = await Invitation.findOrFail(data.id, { client: trx })

      if (!invitation) throw Error('Invitation not found')

      const user = auth.user as User

      if (invitation.userId !== user.id) throw Error('Invitation does not belongs to you')

      if (data.status === InvitationStatus.Accept) {
        // add user to channel
        await user.related('channels').attach([invitation.channelId], trx)
      }

      await invitation.load('channel')
      await invitation.load('invitedBy')

      await invitation.delete()

      await trx.commit()

      const userRoom = getUserRoom(user)

      socket.to(userRoom).emit('invitation:resolve', { invitation, status: data.status })

      return invitation
    } catch (err) {
      await trx.rollback()

      throw err
    }
  }
}
