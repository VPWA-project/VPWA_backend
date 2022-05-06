import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class MeController {
  public async index({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    return response.ok(user)
  }

  public async update({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      onlyNotifications: schema.boolean.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    const user = auth.user as User

    if ('onlyNotifications' in data) {
      user.onlyNotifications = data.onlyNotifications as boolean
    }

    await user.save()

    return response.ok(user)
  }

  public async destroy({}: HttpContextContract) {}

  public async getChannels({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    const channels = await user.related('channels').query().preload('administrator')

    return response.ok(channels)
  }

  public async getInvitations({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    const invitations = await user
      .related('receivedInvitations')
      .query()
      .preload('channel', (channel) => channel.preload('administrator'))
      .preload('invitedBy')

    return response.ok(invitations)
  }
}
