import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'

export default class InvitationsController {
  /**
   * Get all user's invitations
   */
  public async index({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    const invitations = await Invitation.query()
      .where('invited_by_id', user.id)
      .orWhere('user_id', user.id)
      .orderBy('created_at', 'desc')

    const sendedInvitations = invitations.filter((invitation) => invitation.invitedById === user.id)
    const receivedInvitations = invitations.filter((invitation) => invitation.userId === user.id)

    return response.ok({
      sended: sendedInvitations,
      received: receivedInvitations,
    })
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
