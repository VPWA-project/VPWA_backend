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
      return await auth.use('api').attempt(data.email, data.password, {
        expiresIn: '1day',
      })
    } catch {
      return response.unauthorized({
        errors: [
          {
            field: 'email',
            rule: 'invalid credentials',
            message: 'E-mail or password is incorrect',
          },
        ],
      })
    }
  }

  public async logout({ auth }: HttpContextContract) {
    return await auth.use('api').logout()
  }

  public async register({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      email: schema.string({ trim: true }, [
        rules.email(),
        rules.unique({ table: 'users', column: 'email' }),
      ]),
      password: schema.string({}, [rules.minLength(8), rules.confirmed()]),
      firstname: schema.string({ trim: true }, [rules.maxLength(15)]),
      lastname: schema.string({ trim: true }, [rules.maxLength(15)]),
      nickname: schema.string({ trim: true }, [
        rules.unique({ table: 'users', column: 'nickname' }),
        rules.minLength(3),
        rules.maxLength(15),
      ]),
    })

    const data = await request.validate({
      schema: validationSchema,
      messages: {
        'email.unique': 'E-mail already used',
        'confirmed': 'Passwords are not equal',
        'nickname.unique': 'Nickname already used',
      },
    })
    const user = await User.create(data)

    const token = await auth.use('api').attempt(data.email, data.password, {
      expiresIn: '1day',
    })

    return response.created({
      user,
      token,
    })
  }

  /**
   * Fetch all users
   */
  public async index({ auth, request, response }: HttpContextContract) {
    const validationSchema = schema.create({
      page: schema.number.optional([rules.unsigned()]),
      limit: schema.number.optional([rules.range(10, 20)]),
      search: schema.string.optional({ trim: true }),
    })

    const data = await request.validate({ schema: validationSchema })
    const user = auth.user as User

    const query = User.query().where('id', '!=', user.id)

    if (data.search) {
      query
        .where('nickname', 'ILIKE', data.search + '%') // startswith
        .orderBy('nickname', 'asc')
    }

    const users = await query.paginate(data.page || 1, data.limit || 10)

    return response.ok(users)
  }
}
