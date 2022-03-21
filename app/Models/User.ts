import Hash from '@ioc:Adonis/Core/Hash'
import {
  BaseModel,
  beforeCreate,
  beforeSave,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Channel from './Channel'
import Invitation from './Invitation'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken?: string

  @column()
  public firstname: string

  @column()
  public lastname: string

  @column()
  public nickname: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  @beforeCreate()
  public static async createUUID(user: User) {
    user.id = uuid()
  }

  @hasMany(() => Channel, {
    foreignKey: 'administrator_id',
  })
  public ownChannels: HasMany<typeof Channel>

  @hasMany(() => Invitation, {
    foreignKey: 'user_id',
  })
  public receivedInvitations: HasMany<typeof Invitation>

  @hasMany(() => Invitation, {
    foreignKey: 'invited_by_id',
  })
  public sendedInvitations: HasMany<typeof Invitation>

  @manyToMany(() => Channel)
  public channels: ManyToMany<typeof Channel>

  @manyToMany(() => Channel, {
    pivotForeignKey: 'user_id',
    pivotTable: 'banned_users',
  })
  public bannedChannels: ManyToMany<typeof Channel>
}
