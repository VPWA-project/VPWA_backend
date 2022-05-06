import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
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

    const sendedInvitations = invitations.filter((invitation) => invitation.invitedById === user.id)
    const receivedInvitations = invitations.filter((invitation) => invitation.userId === user.id)

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

    const channel = (await Channel.find(data.channelId)) as Channel

    // check if user is admin if channel is private
    if (user.id !== channel?.administratorId && channel?.type === ChannelTypes.Private) {
      return response.badRequest('Permission denied')
    }

    // check if user is already in given channel
    const isUserInChannel = !!(await channel.related('users').query()).find(
      (channelUser) => channelUser.id === data.userId
    )

    if (isUserInChannel) {
      return response.badRequest('User is already in the channel')
    }

    const trx = await Database.transaction()

    try {
      // delete ban if exist
      const bannedChannel = (await user.related('bannedChannels').query()).find(
        (c) => c.id === channel.id
      )

      if (bannedChannel) await user.related('bannedChannels').detach([bannedChannel.id], trx)

      // check if invited user was already invited to given channel
      const previousInvitation = (await channel.related('invitations').query()).find(
        (invitation) => invitation.userId === data.userId
      )

      if (previousInvitation) {
        return response.badRequest('User was already invited')
      }

      const invitation = await Invitation.create(
        {
          ...data,
          invitedById: user.id,
        },
        { client: trx }
      )

      await trx.commit()

      return response.created(invitation)
    } catch (err) {
      await trx.rollback()
      return response.abort(err)
    }
  }

  /**
   * Accepts or declines invitation
   */
  public async resolve({ auth, request, response, params: { id } }: HttpContextContract) {
    const validationSchema = schema.create({
      status: schema.enum(Object.values(InvitationStatus)),
    })

    const data = await request.validate({ schema: validationSchema })

    const trx = await Database.transaction()

    try {
      const invitation = await Invitation.findOrFail(id, { client: trx })

      if (!invitation) {
        return response.badRequest('Invitation not found')
      }

      const user = auth.user as User

      if (invitation.userId !== user.id) {
        return response.badRequest('Invitation does not belongs to you')
      }

      if (data.status === InvitationStatus.Accept) {
        // add user to channel
        await user.related('channels').attach([invitation.channelId], trx)
      }

      await invitation.delete()

      await trx.commit()

      return response.ok({})
    } catch (err) {
      await trx.rollback()

      return response.abort(err)
    }
  }

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
    if (invitation.invitedById !== user.id && invitation.channel.administratorId !== user.id) {
      return response.badRequest('Permission denied')
    }

    await invitation.delete()

    return response.noContent()
  }
}
