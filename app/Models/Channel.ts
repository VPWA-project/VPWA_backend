import {
  BaseModel,
  beforeCreate,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import { ChannelTypes } from 'App/Controllers/Http/ChannelsController'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Invitation from './Invitation'
import Message from './Message'
import User from './User'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column()
  public type: ChannelTypes

  @column({ columnName: 'administrator_id' })
  public administratorId: string

  @belongsTo(() => User, {
    foreignKey: 'administratorId',
  })
  public administrator: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static async createUUID(user: Channel) {
    user.id = uuid()
  }

  @hasMany(() => Invitation, {
    foreignKey: 'channelId',
  })
  public invitations: HasMany<typeof Invitation>

  @manyToMany(() => User)
  public users: ManyToMany<typeof User>

  @manyToMany(() => User, {
    pivotForeignKey: 'channel_id',
    pivotTable: 'banned_users',
  })
  public bannedUsers: ManyToMany<typeof User>

  @manyToMany(() => User, {
    pivotForeignKey: 'channel_id',
    pivotRelatedForeignKey: 'kicked_user_id',
    pivotTable: 'kicked_users',
  })
  public kickedUsers: ManyToMany<typeof User>

  @hasMany(() => Message)
  public messages: HasMany<typeof Message>
}
