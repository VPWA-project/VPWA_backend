import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Channel from 'App/Models/Channel'

export enum ChannelTypes {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export default class ChannelsController {
  public async index({}: HttpContextContract) {}

  public async create({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      name: schema.string({ trim: true }),
      type: schema.enum(Object.values(ChannelTypes)),
    })

    const data = await request.validate({ schema: validationSchema })

    // check if channel with given name already exist
    const existingChannel = await Channel.query()
      .where('name', data.name)
      .whereNull('deleted_at')
      .first()

    // TODO: if last message was 30 days ago, mark channel as deleted and create channel with the same name

    if (existingChannel) {
      return response.badRequest('Channel name is already taken')
    }

    const channel = await Channel.create({
      ...(data as Channel),
      administratorId: auth.user?.id as string,
    })

    return response.created(channel)
  }

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
