import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'

export default class InvitationsController {
  public async index({}: HttpContextContract) {}

  public async createInvitation({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      channelId: schema.string({ trim: true }, [rules.exists({ table: 'channels', column: 'id' })]),
      userId: schema.string({ trim: true }, [rules.exists({ table: 'users', column: 'id' })]),
    })

    const data = await request.validate({ schema: validationSchema })
    const user = auth.user as User

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

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

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
