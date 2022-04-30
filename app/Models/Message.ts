import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Channel from './Channel'
import User from './User'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: string

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column()
  public message: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Channel)
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'tags',
    pivotTimestamps: true,
  })
  public tags: ManyToMany<typeof User>
}
