import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Channel from 'App/Models/Channel'
import Invitation from 'App/Models/Invitation'
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

    let searchText = request.all()['searchText']
    let userId = request.all()['userId']
    const data = await request.validate({ schema: validationSchema })
    // TODO: filter out banned channels and channels where user is already in
    // TODO: allow search by name option - DONE

    let usersBannedChannels = await Database.rawQuery(
      'SELECT * FROM banned_users WHERE user_id=:id',
      {
        id: userId,
      }
    )
    usersBannedChannels = usersBannedChannels.rows

    let usersJoinedChannels = await Database.rawQuery(
      'SELECT * FROM channel_user WHERE user_id=:id',
      {
        id: userId,
      }
    )
    usersJoinedChannels = usersJoinedChannels.rows

    let usersChannels = [...usersBannedChannels, ...usersJoinedChannels]
    const usersChannelsId: string[] = []

    usersChannels.forEach((channel) => {
      usersChannelsId.push(channel.channel_id)
    })

    const channels = await Channel.query()
      .whereNotIn('id', usersChannelsId)
      .where('type', ChannelTypes.Public)
      .where('name', 'ILIKE', searchText + '%')
      .paginate(data.page || 1, data.limit || 50)

    return response.ok(channels)
  }

  /**
   * Creates new channel
   */
  public async create({ auth, request, response }: HttpContextContract) {
    const user = auth.user as User

    const validationSchema = schema.create({
      name: schema.string({ trim: true }),
      type: schema.enum(Object.values(ChannelTypes)),
      invitations: schema.array
        .optional([rules.minLength(1), rules.distinct('*')])
        .members(
          schema.string({ trim: true }, [
            rules.notIn([user.id]),
            rules.exists({ table: 'users', column: 'id' }),
          ])
        ),
    })

    const data = await request.validate({ schema: validationSchema })

    // check if channel with given name already exist
    const existingChannel = await Channel.query().where('name', data.name).first()

    // TODO: if last message was 30 days ago, mark channel as deleted and create channel with the same name

    if (existingChannel) {
      return response.status(422).json({
        errors: [
          {
            field: 'name',
            rule: 'unique',
            message: 'Channel name is already taken',
          },
        ],
      })
    }

    // TODO: transaction

    const channel = await Channel.create({
      ...({ name: data.name, type: data.type } as Channel),
      administratorId: auth.user?.id as string,
    })

    // join administrator in the channel
    await user.related('channels').attach([channel.id])

    data.invitations?.forEach((userId) => {
      Invitation.create({
        userId: userId,
        invitedById: user.id,
        channelId: channel.id,
      })
    })

    await channel.load('administrator')

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

    // check if the channel exist
    const channel = await Channel.findOrFail(id)

    if (!channel) {
      return response.badRequest('Channel does not exist')
    }

    // check if the user was not banned
    const isUserBanned = !!(await user.related('bannedChannels').query()).find(
      (bannedChannel) => bannedChannel.id === id
    )

    if (isUserBanned) {
      return response.badRequest('User is banned')
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

  /**
   * Get channel users
   */
  public async users({ auth, params: { id }, response }: HttpContextContract) {
    const user = auth.user as User

    const channel = (await user.related('channels').query()).find((channel) => channel.id === id)

    if (!channel) {
      return response.badRequest('Channel does not exist or you are not member of the channel')
    }

    await channel.load('users')

    return response.ok(channel.users)
  }

  /**
   * Get invitable users
   */
  public async invitableUsers({ auth, params: { id }, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      page: schema.number.optional([rules.unsigned()]),
      limit: schema.number.optional([rules.range(10, 20)]),
      search: schema.string.optional({ trim: true }),
    })

    const data = await request.validate({ schema: validationSchema })

    const user = auth.user as User

    const channel = (await user.related('channels').query()).find((channel) => channel.id === id)

    if (!channel) {
      return response.badRequest('Channel does not exist or you are not member of the channel')
    }

    const query = User.query()
      .distinct('users.*')
      .joinRaw('left join channel_user on users.id = channel_user.user_id')
      .where('users.id', '!=', user.id)
      .andWhere((query) => {
        query
          .where('channel_user.channel_id', '!=', channel.id)
          .orWhereNull('channel_user.channel_id')
      })
      .andWhereNotIn(
        'users.id',
        User.query()
          .select('users.id')
          .joinRaw('inner join invitations on users.id = invitations.user_id')
          .where('invitations.channel_id', '=', channel.id)
      )

    if (data.search) {
      query
        .where('nickname', 'ILIKE', data.search + '%') // startswith
        .orderBy('nickname', 'asc')
    }

    const users = await query.paginate(data.page || 1, data.limit || 10)

    return response.ok(users)
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

  /**
   * Fetch info about channel
   */
  public async getChannel({ params: { name } }: HttpContextContract) {
    const channel = await Channel.findByOrFail('name', name)

    await channel.load('administrator')

    return channel
  }
}
