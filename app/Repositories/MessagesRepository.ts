import type {
  MessagesRepositoryContract,
  SerializedMessage,
} from '@ioc:Repositories/MessagesRepository'
import Channel from 'App/Models/Channel'

export default class MessagesRepository implements MessagesRepositoryContract {
  public async getAll(name: string): Promise<SerializedMessage[]> {
    const channel = await Channel.query()
      .where('name', name)
      .preload('messages', (messageQuery) => messageQuery.preload('user'))
      .firstOrFail()

    return channel.messages.map((message) => message.serialize() as SerializedMessage)
  }

  public async create(id: string, userId: string, content: string): Promise<SerializedMessage> {
    const channel = await Channel.findOrFail(id)
    const message = await channel.related('messages').create({ userId: userId, message: content })
    await message.load('user')

    return message.serialize() as SerializedMessage
  }
}
