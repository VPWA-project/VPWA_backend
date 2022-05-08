import { BaseModel, beforeCreate, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Channel from './Channel'
import User from './User'

export default class Invitation extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'user_id' })
  public userId: string

  @column({ columnName: 'invited_by_id' })
  public invitedById: string

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static async createUUID(invitation: Invitation) {
    invitation.id = uuid()
  }

  @belongsTo(() => User, {
    foreignKey: 'invitedById',
  })
  public invitedBy: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  public channel: BelongsTo<typeof Channel>
}
