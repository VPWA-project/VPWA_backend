import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChannelUser extends BaseSchema {
  protected tableName = 'channel_user'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.uuid('channel_id').references('id').inTable('channels').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo('now')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
