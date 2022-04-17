import type {
  MessagesRepositoryContract,
  PaginatedResponse,
  SerializedMessage,
} from '@ioc:Repositories/MessagesRepository'
import Channel from 'App/Models/Channel'
import Message from 'App/Models/Message'

export default class MessagesRepository implements MessagesRepositoryContract {
  public async getMessages(
    name: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<SerializedMessage[]>> {
    const channel = await Channel.query().where('name', name).firstOrFail()

    const messages = await Message.query()
      .where('channel_id', channel.id)
      .preload('user')
      .orderBy('created_at', 'desc')
      .paginate(page || 1, limit || 10)

    return {
      meta: messages.getMeta(),
      data: messages.all().map((message) => message.serialize() as SerializedMessage),
    }
  }

  public async create(id: string, userId: string, content: string): Promise<SerializedMessage> {
    const channel = await Channel.query().where('name', id).firstOrFail()
    const message = await channel.related('messages').create({ userId: userId, message: content })
    await message.load('user')

    return message.serialize() as SerializedMessage
  }
}
