import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class UsersController {
  public async login({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      email: schema.string({ trim: true }, [rules.email()]),
      password: schema.string(),
    })

    const data = await request.validate({ schema: validationSchema })

    try {
      const token = await auth.use('api').attempt(data.email, data.password, {
        expiresIn: '1day',
      })
      return token
    } catch {
      return response.badRequest('Invalid credentials')
    }
  }

  public async logout({ auth }: HttpContextContract) {
    await auth.use('api').revoke()

    return {
      revoked: true,
    }
  }

  public async register({ request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      email: schema.string({ trim: true }, [
        rules.email(),
        rules.unique({ table: 'users', column: 'email' }),
      ]),
      password: schema.string({}, [rules.confirmed()]),
      firstname: schema.string({ trim: true }),
      lastname: schema.string({ trim: true }),
      nickname: schema.string({ trim: true }, [
        rules.unique({ table: 'users', column: 'nickname' }),
      ]),
    })

    const data = await request.validate({ schema: validationSchema })
    const user = await User.create(data)

    return response.created(user)
  }

  public async index({}: HttpContextContract) {}

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
