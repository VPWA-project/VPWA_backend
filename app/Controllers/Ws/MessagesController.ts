import { inject } from '@adonisjs/core/build/standalone'
import { MessagesRepositoryContract } from '@ioc:Repositories/MessagesRepository'
import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'

@inject(['Repositories/MessagesRepository'])
export default class MessagesController {
  constructor(private messageRepository: MessagesRepositoryContract) {}

  public async loadMessages(
    { params, logger }: WsContextContract,
    beforeId?: number,
    page?: number,
    limit?: number
  ) {
    logger.info(params.name, page, limit)
    return this.messageRepository.getMessages(params.name, beforeId, page, limit)
  }

  public async addMessage(
    { params, socket, auth }: WsContextContract,
    content: string,
    tags?: string[]
  ) {
    const message = await this.messageRepository.create(params.name, auth.user!.id, content, tags)

    socket.broadcast.emit('message', message)

    return message
  }

  public async sendTypingMessage(
    { params: { name }, socket, auth }: WsContextContract,
    message: string
  ) {
    const user = auth.user!

    socket.broadcast.emit('channel:receiveTyping', {
      content: message,
      author: user,
      channel: name,
    })
    return message
  }
}
