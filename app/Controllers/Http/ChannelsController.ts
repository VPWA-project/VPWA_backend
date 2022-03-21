import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Channel from 'App/Models/Channel'
import User from 'App/Models/User'

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

    const user = auth.user as User

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

    // join administrator in the channel
    await user.related('channels').attach([channel.id])

    return response.created(channel)
  }

  /**
   * Joins to a channel
   */
  public async join({ auth, response, params: { id } }: HttpContextContract) {
    const user = auth.user as User

    // check if user is already in the channel
    const alreadyInChannel = !(await user.related('channels').query()).find(
      (channel) => channel.id === id
    )

    if (alreadyInChannel) {
      return response.badRequest('You are already in the channel')
    }

    // TODO: check if the was not banned

    // check if the channel exist
    const channel = await Channel.findOrFail(id)

    if (!channel) {
      return response.badRequest('Channel does not exist')
    }

    if (channel.deletedAt !== null) {
      return response.badRequest('Channel is deleted')
    }

    // if channel is private, check if user has valid invitation
    if (channel.type === ChannelTypes.Private) {
      const invitation = (await user.related('receivedInvitations').query()).find(
        (invitation) => invitation.channelId === channel.id
      )

      if (!invitation) {
        return response.badRequest('You dont have invitation')
      }
    }

    // join channel
    await user.related('channels').attach([channel.id])

    return response.ok(channel)
  }

  /**
   * Leaves a channel
   */
  public async leave({ auth, response, params: { id } }: HttpContextContract) {
    const user = auth.user as User

    // check if the user is in the channel
    const channel = (await user.related('channels').query()).find((channel) => channel.id === id)

    if (!channel) {
      return response.badRequest('Channel does not exist or you are not member of the channel')
    }

    // check if the channel exists
    if (channel.deletedAt !== null) {
      return response.badRequest('Channel is deleted')
    }

    // check if the user is admin of the channel
    if (channel.administratorId === user.id) {
      // delete the channel
      // TODO: soft delete
      await channel.delete()

      return response.noContent()
    } else {
      // leave the channel
      await user.related('channels').detach([channel.id])
    }

    return response.ok({})
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
