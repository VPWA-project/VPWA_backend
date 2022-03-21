import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Channel from './Channel'

export default class Kick extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public kickedUserId: string

  @column()
  public kickedByUserId: string

  @column()
  public channelId: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  // TODO: kicked user id relation
  // TODO: kicker user id relation

  @belongsTo(() => Channel)
  public channel: BelongsTo<typeof Channel>
}