import { BaseModel, beforeCreate, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Channel from './Channel'
import User from './User'

export default class Invitation extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public invitedById: string

  @column()
  public channelId: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true })
  public acceptedAt: DateTime

  @beforeCreate()
  public static async createUUID(invitation: Invitation) {
    invitation.id = uuid()
  }

  @belongsTo(() => User, {
    localKey: 'invited_by_id',
  })
  public invitedBy: BelongsTo<typeof User>

  @belongsTo(() => User, {
    localKey: 'user_id',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    localKey: 'channel_id',
  })
  public channel: BelongsTo<typeof Channel>
}
