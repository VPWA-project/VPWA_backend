import { inject } from '@adonisjs/core/build/standalone'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { MessageRepositoryContract } from '@ioc:Repositories/MessageRepository'
import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import Channel from 'App/Models/Channel'
import User from 'App/Models/User'

@inject(['Repositories/MessageRepository'])
export default class MessagesController {
  constructor(private messageRepository: MessageRepositoryContract) {}

  public async loadMessages({ params }: WsContextContract) {
    return this.messageRepository.getAll(params.name)
  }

  public async addMessage({ params, socket, auth }: WsContextContract, content: string) {
    const message = await this.messageRepository.create(params.name, auth.user!.id, content)

    socket.broadcast.emit('message', message)

    return message
  }

  public async index({}: HttpContextContract) {}

  /**
   * Creates a new message
   */
  public async create({ auth, request, response, params: { id } }: HttpContextContract) {
    const validationSchema = schema.create({
      message: schema.string({ trim: true }),
    })

    // TODO: tags

    const data = await request.validate({ schema: validationSchema })
    const user = auth.user as User

    const channel = await Channel.findOrFail(id)

    // check if channel exists
    if (!channel) {
      return response.badRequest('Channel does not exist')
    }

    // user must be in the channel
    const isUserInTheChannel = !!(await channel.related('users').query()).find(
      (member) => member.id === user.id
    )

    if (!isUserInTheChannel) {
      return response.badRequest('You are not in the channel')
    }

    const message = await channel.related('messages').create({
      userId: user.id,
      message: data.message,
    })

    return response.ok(message)
  }

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
