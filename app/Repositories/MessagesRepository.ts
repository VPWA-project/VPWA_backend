import type {
  MessagesRepositoryContract,
  PaginatedResponse,
  SerializedMessage,
} from '@ioc:Repositories/MessagesRepository'
import Channel from 'App/Models/Channel'

export default class MessagesRepository implements MessagesRepositoryContract {
  public async getMessages(
    name: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<SerializedMessage[]>> {
    // TODO: check if channel exists
    const channel = await Channel.query()
      .where('name', name)
      .preload('messages', (messageQuery) => messageQuery.preload('user'))
      .paginate(page || 1, limit || 10)

    console.log(channel)

    return {
      meta: channel.getMeta(),
      data: channel[0].messages.map((message) => message.serialize() as SerializedMessage),
    }

    // return channel[0].messages.map((message) => message.serialize() as SerializedMessage)
  }

  public async create(id: string, userId: string, content: string): Promise<SerializedMessage> {
    const channel = await Channel.query().where('name', id).firstOrFail()
    const message = await channel.related('messages').create({ userId: userId, message: content })
    await message.load('user')

    return message.serialize() as SerializedMessage
  }
}
