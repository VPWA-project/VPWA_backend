import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import { UserStatus } from 'App/types/types'

export default class MeController {
  public async index({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    return response.ok(user)
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      status: schema.enum.optional(Object.values(UserStatus)),
      onlyNotifications: schema.boolean.optional(),
    })

    const data = await request.validate({ schema: validationSchema })
    const user = auth.user as User

    if (data.status) {
      user.status = data.status
    }

    if (data.onlyNotifications) {
      user.onlyNotifications = data.onlyNotifications
    }

    await user.save()

    return response.ok(user)
  }

  public async destroy({}: HttpContextContract) {}

  public async getChannels({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    const channels = await user.related('channels').query()

    return response.ok(channels)
  }

  public async getInvitations({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    const invitations = await user.related('receivedInvitations').query()

    return response.ok(invitations)
  }
}
