import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
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
