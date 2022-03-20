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

  /**
   * Fetch all users
   */
  public async index({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      page: schema.number.optional([rules.unsigned()]),
      limit: schema.number.optional([rules.range(10, 50)]),
      search: schema.string.optional({ trim: true }),
    })

    const data = await request.validate({ schema: validationSchema })
    const user = auth.user as User

    const query = User.query()
      .select('id', 'email', 'firstname', 'lastname', 'nickname')
      .where('id', '!=', user.id)

    if (data.search) {
      query
        .where('nickname', 'ILIKE', data.search + '%') // startswith
        .orderBy('nickname', 'asc')
    }

    const users = await query.paginate(data.page || 1, data.limit || 50)

    return response.ok(users)
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
