import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'

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

    // TODO: check if user is not inviting himself
    // TODO: check if user is admin if channel is private
    // TODO: check if the channel exist
    // TODO: check if user is already in given channel
    // TODO: delete ban if exist

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
      invitedById: user.id,
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

    if (invitation.userId !== user.id) {
      return response.badRequest('Invitation does not belongs to you')
    }

    //invitation.acceptedAt = DateTime.local()

    //await invitation.save()

    if (data.status === InvitationStatus.Accept) {
      // add user to channel
      await user.related('channels').attach([invitation.channelId])
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

    // TODO: administrator of the channel can also delete invitation
    if (invitation.invitedById !== user.id) {
      return response.badRequest('Permission denied')
    }

    await invitation.delete()

    return response.noContent()
  }
}
