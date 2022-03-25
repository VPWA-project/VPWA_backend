import {
  BaseModel,
  beforeCreate,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  LucidRow,
  ManyToMany,
  manyToMany,
  ModelQueryBuilderContract,
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

  @column()
  public administratorId: string

  @belongsTo(() => User, {
    localKey: 'administrator_id',
  })
  public administrator: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime

  private static softDeleteQuery = async (row: LucidRow) => {
    if (row['delete_at']) {
      row['delete_at'] = DateTime.local()

      await row.save()
    }
  }

  @beforeFind()
  public static softDeletesFind = this.softDeleteQuery

  @beforeFetch()
  public static softDeletesFetch = this.softDeleteQuery

  public static softDelete = async (query: ModelQueryBuilderContract<typeof BaseModel>) => {
    query.whereNull('deleted_at')
  }

  @beforeCreate()
  public static async createUUID(user: Channel) {
    user.id = uuid()
  }

  @hasMany(() => Invitation, {
    foreignKey: 'channel_id',
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
