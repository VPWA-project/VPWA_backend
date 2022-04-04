import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Channel from 'App/Models/Channel'
import User from 'App/Models/User'

export default class MessagesController {
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
