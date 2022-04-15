import type { MessageRepositoryContract } from '@ioc:Repositories/MessageRepository'
import Channel from 'App/Models/Channel'

export default class MessageRepository implements MessageRepositoryContract {
  public async getAll(channelName: string): Promise<SerializedMessage[]> {
    const channel = await Channel.query()
      .where('name', channelName)
      .preload('messages', (messageQuery) => messageQuery.preload('user'))
      .firstOrFail()

    return channel.messages.map((message) => message.serialize() as SerializedMessage)
  }

  public async create(
    channelName: string,
    userId: string,
    content: string
  ): Promise<SerializedMessage> {
    const channel = await Channel.findOrFail('name', channelName)
    const message = await channel.related('messages').create({ userId: userId, message: content })
    await message.load('user')

    return message.serialize() as SerializedMessage
  }
}
