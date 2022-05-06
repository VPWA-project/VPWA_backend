import Database from '@ioc:Adonis/Lucid/Database'
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
      .preload('tags')
      .orderBy('created_at', 'desc')
      .paginate(page || 1, limit || 10)

    return {
      meta: messages.getMeta(),
      data: messages.all().map((message) => message.serialize() as SerializedMessage),
    }
  }

  public async create(
    id: string,
    userId: string,
    content: string,
    tags?: string[]
  ): Promise<SerializedMessage> {
    const trx = await Database.transaction()

    try {
      const channel = await Channel.query({ client: trx }).where('name', id).firstOrFail()

      const message = await channel.related('messages').create({ userId: userId, message: content })

      if (tags && tags.length) {
        const taggedUsers = await channel.related('users').query().whereIn('nickname', tags)

        if (taggedUsers.length)
          await message.related('tags').attach(
            taggedUsers.map((user) => user.id),
            trx
          )
      }

      await trx.commit()

      await message.load('user')
      await message.load('tags')

      return message.serialize() as SerializedMessage
    } catch (err) {
      await trx.rollback()
      return err
    }
  }
}
