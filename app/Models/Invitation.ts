import { BaseModel, beforeCreate, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Channel from './Channel'
import User from './User'

export default class Invitation extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public user_id: string

  @column()
  public invited_by_id: string

  @column()
  public channel_id: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: false })
  public acceptedAt: DateTime

  @beforeCreate()
  public static async createUUID(invitation: Invitation) {
    invitation.id = uuid()
  }

  @belongsTo(() => User, {
    foreignKey: 'invited_by_id',
  })
  public invitedBy: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channel_id',
  })
  public channel: BelongsTo<typeof Channel>
}
