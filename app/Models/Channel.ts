import {
  BaseModel,
  beforeCreate,
  beforeFetch,
  beforeFind,
  column,
  LucidRow,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  public id: string

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
