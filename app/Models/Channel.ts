import {
  BaseModel,
  beforeCreate,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  LucidRow,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'
import { ChannelTypes } from 'App/Controllers/Http/ChannelsController'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
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
}
