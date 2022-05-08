import Database from '@ioc:Adonis/Lucid/Database'
import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import User from 'App/Models/User'
import { ChannelTypes } from '../Http/ChannelsController'
import { getUserRoom } from './ActivityController'

export enum KickType {
  Kick = 'KICK',
  Revoke = 'REVOKE',
}

export default class ChannelsController {
  public async onConnected({ socket, auth }: WsContextContract) {
    const userRoom = getUserRoom(auth.user!)

    socket.join(userRoom)

    socket.broadcast.emit('channel:connect', auth.user)
  }

  public async onDisconnected({ socket, auth }: WsContextContract) {
    socket.broadcast.emit('channel:disconnect', auth.user)
  }

  public async kick(
    { auth, socket, params: { name } }: WsContextContract,
    data: { method: KickType; userId: string }
  ) {
    const user = auth.user as User

    // check if user wants to kick himself
    if (user.id === data.userId) {
      throw new Error('You can not kick/revoke yourself')
    }

    // check if the channel exist
    const channel = (await user.related('channels').query()).find(
      (channel) => channel.name === name
    )

    // check if kicker is in the channel
    if (!channel) {
      throw new Error('You are not in the channel')
    }

    const isKickerAdmin = user.id === channel.administratorId

    // check if not kicking admin
    if (data.userId === channel.administratorId) {
      throw new Error('Permission denied')
    }

    // check if kicker has permisions
    if (data.method === KickType.Revoke && !isKickerAdmin) {
      throw new Error('You must be administrator of the channel to revoke users')
    }

    // kicker must be admin to kick in private channels
    if (channel.type === ChannelTypes.Private && !isKickerAdmin) {
      throw new Error('Permission denied')
    }

    // check if user is in the channel
    const userToBeKicked = (await channel.related('users').query()).find(
      (user) => user.id === data.userId
    )

    if (!userToBeKicked) {
      throw new Error('User is not channel member')
    }

    const trx = await Database.transaction()

    try {
      if (data.method === KickType.Kick) {
        const numberOfKicks = (
          await channel.related('kickedUsers').query().where('kicked_user_id', userToBeKicked.id)
        ).length

        if (isKickerAdmin) {
          // ban
          await userToBeKicked.related('bannedChannels').attach([channel.id], trx)

          // remove kicks
          await channel.related('kickedUsers').detach([userToBeKicked.id], trx)
        } else {
          // check if the user has already kicked the user before
          const wasUserKickedByKickerBefore = !!(await channel
            .related('kickedUsers')
            .query()
            .where('kicked_user_id', userToBeKicked.id)
            .where('kicked_by_user_id', user.id)
            .first())

          if (!wasUserKickedByKickerBefore) {
            // kick
            await trx.table('kicked_users').insert({
              kicked_user_id: userToBeKicked.id,
              kicked_by_user_id: user.id,
              channel_id: channel.id,
            })
          } else {
            throw new Error('You have already kicked the user')
          }

          // 3x kick = ban
          if (numberOfKicks + 1 >= 3) {
            // ban
            await userToBeKicked.related('bannedChannels').attach([channel.id], trx)
            // remove kicks
            await channel.related('kickedUsers').detach([userToBeKicked.id], trx)
          }
        }
      }

      // remove channel
      await userToBeKicked.related('channels').detach([channel.id], trx)

      await trx.commit()

      socket.broadcast.emit('user:receiveKick', {
        userId: userToBeKicked.id,
      })

      return true
    } catch (err) {
      await trx.rollback()
      throw err
    }
  }

  /**
   * Leaves a channel
   */
  public async leave({ auth, socket, params: { name } }: WsContextContract) {
    const user = auth.user as User

    // check if the user is in the channel
    const channel = (await user.related('channels').query()).find(
      (channel) => channel.name === name
    )

    if (!channel) throw new Error('Channel does not exist or you are not member of the channel')

    // check if the user is admin of the channel
    if (channel.administratorId === user.id) {
      // delete the channel
      await channel.delete()

      socket.broadcast.emit('channel:delete')
    } else {
      // leave the channel
      await user.related('channels').detach([channel.id])
    }

    socket.nsp.emit('channel:leave', { user })

    // disconnect all user's sockets
    const userRoom = getUserRoom(user)
    const userSockets = await socket.in(userRoom).fetchSockets()

    userSockets.forEach((socket) => {
      socket.disconnect()
    })
  }
}
