import Database from '@ioc:Adonis/Lucid/Database'
import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import User from 'App/Models/User'
import { ChannelTypes } from '../Http/ChannelsController'

export enum KickType {
  Kick = 'KICK',
  Revoke = 'REVOKE',
}

export default class ChannelsController {
  public async kick(
    { auth, socket, params: { name } }: WsContextContract,
    data: { method: KickType; userId: string }
  ) {
    // TODO: add to migration

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

    if (data.method === KickType.Kick) {
      const numberOfKicks = (
        await channel.related('kickedUsers').query().where('kicked_user_id', userToBeKicked.id)
      ).length

      if (isKickerAdmin) {
        // ban
        await userToBeKicked.related('bannedChannels').attach([channel.id])

        // remove kicks
        await channel.related('kickedUsers').detach([userToBeKicked.id])
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
          await Database.table('kicked_users').insert({
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
          await userToBeKicked.related('bannedChannels').attach([channel.id])
          // remove kicks
          await channel.related('kickedUsers').detach([userToBeKicked.id])
        }
      }
    }

    // remove channel
    await userToBeKicked.related('channels').detach([channel.id])

    socket.broadcast.emit('user:receiveKick', {
      userId: userToBeKicked.id,
      channelName: channel.name,
    })
  }
}
