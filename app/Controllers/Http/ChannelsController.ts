import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Channel from 'App/Models/Channel'

export enum ChannelTypes {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export default class ChannelsController {
  /**
   * Fetch public channels
   */
  public async index({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      page: schema.number.optional([rules.unsigned()]),
      limit: schema.number.optional([rules.range(10, 50)]),
    })

    const data = await request.validate({ schema: validationSchema })

    // TODO: filter out banned channels and channels where user is already in
    // TODO: allow search by name option

    const channels = await Channel.query()
      .where('type', ChannelTypes.Public)
      .whereNull('deleted_at')
      .paginate(data.page || 1, data.limit || 50)

    return response.ok(channels)
  }

  /**
   * Creates new channel
   */
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

  public async destroy({ auth, response, params: { id } }: HttpContextContract) {
    const channel = await Channel.findOrFail(id)

    if (!channel) {
      return response.badRequest('Channel not found')
    }

    if (channel.administratorId !== auth.user?.id) {
      return response.badRequest('Permission denied')
    }

    // TODO: soft delete

    await channel.delete()

    return response.noContent()
  }
}
