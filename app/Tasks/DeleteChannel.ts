import { BaseTask } from 'adonis5-scheduler/build'
import Channel from 'App/Models/Channel'
import { DateTime } from 'luxon'

export default class DeleteChannel extends BaseTask {
  public static get schedule() {
    return '0 0 * * *' // runs every day at 00:00
  }
  /**
   * Set enable use .lock file for block run retry task
   * Lock file save to `build/tmpTaskLock`
   */
  public static get useLock() {
    return false
  }

  private async shouldDelete(channel: Channel) {
    const lastMessage = await channel
      .related('messages')
      .query()
      .orderBy('created_at', 'desc')
      .first()

    const date30daysBack = DateTime.now().plus({ days: -30 })

    return (
      (lastMessage && lastMessage.createdAt < date30daysBack) ||
      (!lastMessage && channel.createdAt < date30daysBack)
    )
  }

  public async handle() {
    const channels = await Channel.all()

    channels.forEach(async (channel) => {
      if (await this.shouldDelete(channel)) {
        await channel.delete()
        this.logger.info(`Delete channel ${channel.name}, because it was inactive 30 days`)
      }
    })
  }
}
