import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Channel from 'App/Models/Channel'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'
import { ChannelTypes } from './ChannelsController'

enum InvitationStatus {
  Accept = 'ACCEPT',
  Decline = 'DECLINE',
}

export default class InvitationsController {
  /**
   * Get all user's invitations
   */
  public async index({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    const invitations = await Invitation.query()
      .where('invited_by_id', user.id)
      .whereNull('accepted_at')
      .orWhere('user_id', user.id)
      .whereNull('accepted_at')
      .orderBy('created_at', 'desc')

    const sendedInvitations = invitations.filter(
      (invitation) => invitation.invited_by_id === user.id
    )
    const receivedInvitations = invitations.filter((invitation) => invitation.user_id === user.id)

    return response.ok({
      sended: sendedInvitations,
      received: receivedInvitations,
    })
  }

  /**
   * Creates new invitation
   */
  public async createInvitation({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      channelId: schema.string({ trim: true }, [rules.exists({ table: 'channels', column: 'id' })]),
      userId: schema.string({ trim: true }, [rules.exists({ table: 'users', column: 'id' })]),
    })

    const data = await request.validate({ schema: validationSchema })
    const user = auth.user as User

    // check if user is not inviting himself
    if (user.id === data.userId) {
      return response.badRequest('You can not invite yourself')
    }

    const channel = await Channel.find(data.channelId)

    // check if user is admin if channel is private
    if (user.id !== channel?.administrator_id && channel?.type === ChannelTypes.Private) {
      return response.badRequest('Permission denied')
    }

    // check if user is already in given channel
    const isUserInChannel = !!(await user.related('channels').query()).find(
      (memberChannel) => memberChannel.id === channel?.id
    )

    if (isUserInChannel) {
      return response.badRequest('User is already in the channel')
    }

    // delete ban if exist
    ;(await user.related('bannedChannels').query())
      .find((bannedChannel) => bannedChannel.id === channel?.id)
      ?.delete()

    // check if invited user was already invited to given channel
    const previousInvitation = await Invitation.query()
      .where('user_id', data.userId)
      .where('channel_id', data.channelId)
      .whereNull('accepted_at')
      .first()

    if (previousInvitation) {
      return response.badRequest('User was already invited')
    }

    const invitation = await Invitation.create({
      ...data,
      invited_by_id: user.id,
    })

    return response.created(invitation)
  }

  /**
   * Accepts or declines invitation
   */
  public async resolve({ auth, request, response, params: { id } }: HttpContextContract) {
    const validationSchema = schema.create({
      status: schema.enum(Object.values(InvitationStatus)),
    })

    const data = await request.validate({ schema: validationSchema })

    const invitation = await Invitation.findOrFail(id)

    if (!invitation) {
      return response.badRequest('Invitation not found')
    }

    const user = auth.user as User

    if (invitation.user_id !== user.id) {
      return response.badRequest('Invitation does not belongs to you')
    }

    //invitation.acceptedAt = DateTime.local()

    //await invitation.save()

    if (data.status === InvitationStatus.Accept) {
      // add user to channel
      await user.related('channels').attach([invitation.channel_id])
    }

    // TODO: add resolve status to invitation schema or delete after
    await invitation.delete()

    return response.ok({})
  }

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  /**
   * Deletes invitation
   */
  public async destroy({ auth, response, params: { id } }: HttpContextContract) {
    const invitation = await Invitation.findOrFail(id)

    if (!invitation) {
      return response.badRequest('Invitation not found')
    }

    const user = auth.user as User

    // administrator of the channel can also delete invitation
    if (invitation.invited_by_id !== user.id && invitation.channel.administrator_id !== user.id) {
      return response.badRequest('Permission denied')
    }

    await invitation.delete()

    return response.noContent()
  }
}
