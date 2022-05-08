import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'

export default class Channel {
  public async handle({}: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    await next()
  }

  /**
   * Handle ws namespace connection
   *
   * Check if user can join given channel
   */
  public async wsHandle({ auth, params: { name } }: WsContextContract, next: () => Promise<void>) {
    await auth.user!.related('channels').query().where('name', '=', name).firstOrFail()

    await next()
  }
}
