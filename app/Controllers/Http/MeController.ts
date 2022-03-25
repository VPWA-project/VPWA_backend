import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class MeController {
  public async index({ auth, response }: HttpContextContract) {
    const user = auth.user as User

    return response.ok(user)
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}

  public async getChannels({}: HttpContextContract) {}

  public async getInvitations({}: HttpContextContract) {}
}
